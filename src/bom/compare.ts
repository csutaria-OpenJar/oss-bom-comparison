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

    matchedRows.push({ matchKey, matchValue: next[matchKey], original, next, changes: rowChanges });
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
    .filter((field) => compareValue(field, original[field]) !== compareValue(field, next[field]))
    .map((field) => ({
      matchKey,
      matchValue: next[matchKey],
      field,
      originalValue: original[field],
      newValue: next[field],
    }));
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
  if (field === "reference_designators") {
    return value
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
      .join(",");
  }
  return normalizeText(value);
}

function normalizeKey(value: string): string {
  return normalizeText(value);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}
