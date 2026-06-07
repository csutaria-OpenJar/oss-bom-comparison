import { BOM_FIELDS, FIELD_LABELS, HEADER_ALIASES, MATCH_KEYS } from "./fields";
import type { BomField, ColumnMapping, MatchKey } from "./types";

export function suggestMapping(headers: string[], remembered: ColumnMapping = {}): ColumnMapping {
  const suggested: ColumnMapping = {};
  const usedColumns = new Set<number>();

  for (const field of BOM_FIELDS) {
    const rememberedIndex = remembered[field];
    if (rememberedIndex !== undefined && headers[rememberedIndex] && !usedColumns.has(rememberedIndex)) {
      suggested[field] = rememberedIndex;
      usedColumns.add(rememberedIndex);
    }
  }

  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  for (const field of BOM_FIELDS) {
    if (suggested[field] !== undefined) {
      continue;
    }
    const aliases = HEADER_ALIASES[field].map(normalizeHeader);
    const index = normalizedHeaders.findIndex(
      (header, columnIndex) => aliases.includes(header) && !usedColumns.has(columnIndex),
    );
    if (index >= 0) {
      suggested[field] = index;
      usedColumns.add(index);
    }
  }

  return suggested;
}

export function fieldsByColumn(columnFields: Array<BomField | "">): ColumnMapping {
  return columnFields.reduce<ColumnMapping>((mapping, field, index) => {
    if (field) {
      mapping[field] = index;
    }
    return mapping;
  }, {});
}

export function validateMapping(columnFields: Array<BomField | "">, matchKey: MatchKey): string[] {
  const errors: string[] = [];
  const selected = columnFields.filter((field): field is BomField => field !== "");
  const duplicates = selected.filter((field, index) => selected.indexOf(field) !== index);
  const uniqueDuplicates = [...new Set(duplicates)];

  if (uniqueDuplicates.length > 0) {
    errors.push(`Each field can only be mapped once: ${uniqueDuplicates.map((field) => FIELD_LABELS[field]).join(", ")}.`);
  }
  if (!MATCH_KEYS.includes(matchKey) || !selected.includes(matchKey)) {
    errors.push("Map the selected match-key field before continuing.");
  }
  if (uniqueDuplicates.length === 0 && selected.filter((field) => field !== matchKey).length === 0) {
    errors.push("Map at least one comparison field before continuing.");
  }

  return errors;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}
