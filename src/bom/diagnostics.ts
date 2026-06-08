import { FIELD_LABELS } from "./fields";
import { validateMatchKeys } from "./compare";
import type { BomField, BomRow, ColumnMapping, MatchKey } from "./types";

export function mappedFieldLabels(mapping: ColumnMapping): string[] {
  return Object.keys(mapping)
    .filter((field): field is BomField => mapping[field as BomField] !== undefined)
    .map((field) => FIELD_LABELS[field]);
}

export function omittedFieldLabels(mapping: ColumnMapping): string[] {
  return Object.entries(FIELD_LABELS)
    .filter(([field]) => mapping[field as BomField] === undefined)
    .map(([, label]) => label);
}

export function matchKeyDiagnosticMessages(rows: BomRow[], matchKey: MatchKey): string[] {
  const diagnostics = validateMatchKeys(rows, matchKey);
  const label = FIELD_LABELS[matchKey];
  const messages: string[] = [];

  if (diagnostics.blankRowIndexes.length > 0) {
    const count = diagnostics.blankRowIndexes.length;
    messages.push(`Blank ${label} keys: ${count} ${pluralize("row", count)}.`);
  }

  if (diagnostics.duplicateGroups.length > 0) {
    const keys = diagnostics.duplicateGroups.map((group) => group.key).join(", ");
    messages.push(`Duplicate ${label} keys: ${keys}.`);
  }

  return messages;
}

function pluralize(value: string, count: number): string {
  return count === 1 ? value : `${value}s`;
}
