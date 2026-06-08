import { BOM_FIELDS } from "./fields";
import type {
  BomField,
  BomRow,
  ComparisonResult,
  DuplicateGroup,
  FieldChange,
  ManufacturerPartChange,
  MatchKey,
  MatchKeyValidation,
} from "./types";

const QUANTITY_UNITS = new Set(["pc", "pcs", "ea", "each", "unit", "units"]);

export function validateMatchKeys(rows: BomRow[], matchKey: MatchKey): MatchKeyValidation {
  const occurrences = new Map<string, number[]>();
  const displayValues = new Map<string, string>();
  const blankRowIndexes: number[] = [];

  rows.forEach((row, index) => {
    const raw = row[matchKey];
    const normalized = normalizeKey(raw);
    if (!normalized) {
      blankRowIndexes.push(index);
      return;
    }
    displayValues.set(normalized, raw);
    occurrences.set(normalized, [...(occurrences.get(normalized) ?? []), index]);
  });

  const duplicateGroups: DuplicateGroup[] = [...occurrences.entries()]
    .filter(([, indexes]) => indexes.length > 1)
    .map(([key, rowIndexes]) => ({ key: displayValues.get(key) ?? key, rowIndexes }));

  return { blankRowIndexes, duplicateGroups };
}

export function compareBoms(originalRows: BomRow[], nextRows: BomRow[], matchKey: MatchKey): ComparisonResult {
  const originalGroups = groupByMatchKey(originalRows, matchKey);
  const nextGroups = groupByMatchKey(nextRows, matchKey);
  const originalKeys = new Set(originalGroups.keys());
  const nextKeys = new Set(nextGroups.keys());
  const matchedKeys = [...originalKeys].filter((key) => nextKeys.has(key));

  const addedRows = [...nextGroups.entries()]
    .filter(([key]) => !originalKeys.has(key))
    .flatMap(([, group]) => group);
  const removedRows = [...originalGroups.entries()]
    .filter(([key]) => !nextKeys.has(key))
    .flatMap(([, group]) => group);
  const unmatchedOrBlankRows = [
    ...originalRows.filter((row) => !normalizeKey(row[matchKey])),
    ...nextRows.filter((row) => !normalizeKey(row[matchKey])),
  ];

  const changedFields: FieldChange[] = [];
  const manufacturerPartAdds: ManufacturerPartChange[] = [];
  const manufacturerPartRemoves: ManufacturerPartChange[] = [];
  const matchedRows: ComparisonResult["matchedRows"] = [];

  for (const key of matchedKeys) {
    const originalGroup = originalGroups.get(key) ?? [];
    const nextGroup = nextGroups.get(key) ?? [];
    const original = originalGroup[0];
    const next = nextGroup[0];
    const rowChanges = changedFieldsForRows(original, next, matchKey);
    changedFields.push(...rowChanges);

    const originalParts = manufacturerParts(originalGroup);
    const nextParts = manufacturerParts(nextGroup);
    for (const [partKey, row] of nextParts) {
      if (!originalParts.has(partKey)) {
        manufacturerPartAdds.push(partChange(row, matchKey, next[matchKey]));
      }
    }
    for (const [partKey, row] of originalParts) {
      if (!nextParts.has(partKey)) {
        manufacturerPartRemoves.push(partChange(row, matchKey, original[matchKey]));
      }
    }

    matchedRows.push({
      matchKey,
      matchValue: next[matchKey],
      original,
      originalRows: originalGroup,
      next,
      newRows: nextGroup,
      changes: rowChanges,
    });
  }

  return {
    summary: {
      addedRows: addedRows.length,
      removedRows: removedRows.length,
      changedFields: changedFields.length,
      manufacturerPartAdds: manufacturerPartAdds.length,
      manufacturerPartRemoves: manufacturerPartRemoves.length,
      unmatchedOrBlankRows: unmatchedOrBlankRows.length,
    },
    addedRows,
    removedRows,
    changedFields,
    manufacturerPartAdds,
    manufacturerPartRemoves,
    unmatchedOrBlankRows,
    matchedRows,
  };
}

function changedFieldsForRows(original: BomRow, next: BomRow, matchKey: MatchKey): FieldChange[] {
  return BOM_FIELDS
    .filter((field) => field !== matchKey)
    .map((field) => fieldChangeForRows(field, original, next, matchKey))
    .filter((change): change is FieldChange => change !== undefined);
}

function fieldChangeForRows(
  field: BomField,
  original: BomRow,
  next: BomRow,
  matchKey: MatchKey,
): FieldChange | undefined {
  if (field === "reference_designators") {
    const diff = referenceDesignatorDiff(original[field], next[field]);
    if (diff && diff.added.length === 0 && diff.removed.length === 0) return undefined;
    if (diff) {
      return {
        matchKey,
        matchValue: next[matchKey],
        field,
        originalValue: original[field],
        newValue: next[field],
        referenceDesignatorDiff: diff,
      };
    }
  }

  if (compareValue(field, original[field]) === compareValue(field, next[field])) return undefined;
  return {
    matchKey,
    matchValue: next[matchKey],
    field,
    originalValue: original[field],
    newValue: next[field],
  };
}

function groupByMatchKey(rows: BomRow[], matchKey: MatchKey): Map<string, BomRow[]> {
  const groups = new Map<string, BomRow[]>();
  for (const row of rows) {
    const key = normalizeKey(row[matchKey]);
    if (!key) {
      continue;
    }
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return groups;
}

function manufacturerParts(rows: BomRow[]): Map<string, BomRow> {
  const parts = new Map<string, BomRow>();
  for (const row of rows) {
    const key = manufacturerPartIdentity(row);
    if (key) {
      parts.set(key, row);
    }
  }
  return parts;
}

function manufacturerPartIdentity(row: BomRow): string {
  const partNumber = normalizeText(row.manufacturer_part_number);
  if (!partNumber) {
    return "";
  }
  return `${normalizeText(row.manufacturer_name)}|${partNumber}`;
}

function partChange(row: BomRow, matchKey: MatchKey, matchValue: string): ManufacturerPartChange {
  return {
    matchKey,
    matchValue,
    lineItem: row.line_item,
    manufacturerName: row.manufacturer_name,
    manufacturerPartNumber: row.manufacturer_part_number,
  };
}

function compareValue(field: BomField, value: string): string {
  if (field === "quantity") {
    return normalizeQuantity(value) ?? normalizeText(value);
  }
  if (field === "reference_designators") {
    return value
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
      .join(",");
  }
  return normalizeText(value);
}

function normalizeQuantity(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(?:\s*([a-z]+))?$/);
  if (!match) return undefined;

  const unit = match[2];
  if (unit && !QUANTITY_UNITS.has(unit)) return undefined;

  const numeric = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return undefined;

  return String(numeric);
}

function referenceDesignatorDiff(
  originalValue: string,
  nextValue: string,
): { added: string[]; removed: string[] } | undefined {
  const originalRefs = parseReferenceDesignators(originalValue);
  const nextRefs = parseReferenceDesignators(nextValue);
  if (originalRefs.length === 0 || nextRefs.length === 0) return undefined;

  const originalSet = new Set(originalRefs.map((ref) => ref.toLowerCase()));
  const nextSet = new Set(nextRefs.map((ref) => ref.toLowerCase()));
  const originalDisplay = new Map(originalRefs.map((ref) => [ref.toLowerCase(), ref]));
  const nextDisplay = new Map(nextRefs.map((ref) => [ref.toLowerCase(), ref]));

  return {
    added: nextRefs
      .filter((ref) => !originalSet.has(ref.toLowerCase()))
      .map((ref) => nextDisplay.get(ref.toLowerCase()) ?? ref),
    removed: originalRefs
      .filter((ref) => !nextSet.has(ref.toLowerCase()))
      .map((ref) => originalDisplay.get(ref.toLowerCase()) ?? ref),
  };
}

function parseReferenceDesignators(value: string): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();
  for (const rawToken of value.split(",")) {
    const token = rawToken.trim();
    if (!token) continue;
    const expanded = expandReferenceRange(token);
    for (const ref of expanded) {
      const normalized = ref.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        refs.push(ref.toUpperCase());
      }
    }
  }
  return refs;
}

function expandReferenceRange(token: string): string[] {
  const range = token.match(/^([a-z]+)(\d+)\s*-\s*\1(\d+)$/i);
  if (!range) return isReferenceToken(token) ? [token] : [];

  const prefix = range[1];
  const start = Number(range[2]);
  const end = Number(range[3]);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end - start > 1000) {
    return [];
  }

  return Array.from({ length: end - start + 1 }, (_, index) => `${prefix}${start + index}`);
}

function isReferenceToken(token: string): boolean {
  return /^[a-z]+\d+[a-z0-9-]*$/i.test(token.trim());
}

function normalizeKey(value: string): string {
  return normalizeText(value);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}
