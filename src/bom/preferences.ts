import { BOM_FIELDS, DEFAULT_REPORT_FILTERS, MATCH_KEYS } from "./fields";
import type { BomField, ColumnMapping, MatchKey, ReportFilters } from "./types";

const STORAGE_KEY = "oss-bom-comparison/preferences";

interface StoredPreferences {
  headerMappings: Record<string, ColumnMapping>;
  preferredMatchKey: MatchKey;
  reportFilters: ReportFilters;
}

export function loadPreferences(): StoredPreferences {
  const fallback: StoredPreferences = {
    headerMappings: {},
    preferredMatchKey: "line_item",
    reportFilters: DEFAULT_REPORT_FILTERS,
  };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    return {
      headerMappings: sanitizeHeaderMappings(parsed.headerMappings),
      preferredMatchKey: sanitizeMatchKey(parsed.preferredMatchKey),
      reportFilters: sanitizeReportFilters(parsed.reportFilters),
    };
  } catch {
    return fallback;
  }
}

export function saveMappingPreference(headers: string[], mapping: ColumnMapping, matchKey: MatchKey): void {
  const current = loadPreferences();
  current.headerMappings[headerSignature(headers)] = sanitizeMapping(mapping);
  current.preferredMatchKey = sanitizeMatchKey(matchKey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function loadMappingPreference(headers: string[]): ColumnMapping {
  return loadPreferences().headerMappings[headerSignature(headers)] ?? {};
}

export function saveReportFilters(reportFilters: ReportFilters): void {
  const current = loadPreferences();
  current.reportFilters = sanitizeReportFilters(reportFilters);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

function headerSignature(headers: string[]): string {
  const normalized = headers.map((header) => header.trim().toLowerCase()).join("|");
  let hash = 5381;
  for (const character of normalized) {
    hash = (hash * 33) ^ character.charCodeAt(0);
  }
  return `headers:${(hash >>> 0).toString(36)}`;
}

function sanitizeHeaderMappings(value: unknown): Record<string, ColumnMapping> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([signature]) => isSafeHeaderSignature(signature))
      .map(([signature, mapping]) => [signature, sanitizeMapping(mapping)]),
  );
}

function isSafeHeaderSignature(value: string): boolean {
  return /^headers:[a-z0-9]+$/.test(value);
}

function sanitizeMapping(value: unknown): ColumnMapping {
  if (!isRecord(value)) {
    return {};
  }
  const mapping: ColumnMapping = {};
  for (const field of BOM_FIELDS) {
    const columnIndex = value[field];
    if (typeof columnIndex === "number" && Number.isInteger(columnIndex) && columnIndex >= 0) {
      mapping[field] = columnIndex;
    }
  }
  return mapping;
}

function sanitizeMatchKey(value: unknown): MatchKey {
  return typeof value === "string" && MATCH_KEYS.includes(value as MatchKey)
    ? (value as MatchKey)
    : "line_item";
}

function sanitizeReportFilters(value: unknown): ReportFilters {
  const source = isRecord(value) ? value : {};
  const changedFieldsSource = isRecord(source.changedFields) ? source.changedFields : {};
  const changedFields = Object.fromEntries(
    BOM_FIELDS.map((field): [BomField, boolean] => [
      field,
      typeof changedFieldsSource[field] === "boolean"
        ? changedFieldsSource[field]
        : DEFAULT_REPORT_FILTERS.changedFields[field],
    ]),
  ) as Record<BomField, boolean>;

  return {
    changedFields,
    addedRows: booleanOrDefault(source.addedRows, DEFAULT_REPORT_FILTERS.addedRows),
    removedRows: booleanOrDefault(source.removedRows, DEFAULT_REPORT_FILTERS.removedRows),
    manufacturerPartAdds: booleanOrDefault(
      source.manufacturerPartAdds,
      DEFAULT_REPORT_FILTERS.manufacturerPartAdds,
    ),
    manufacturerPartRemoves: booleanOrDefault(
      source.manufacturerPartRemoves,
      DEFAULT_REPORT_FILTERS.manufacturerPartRemoves,
    ),
    unmatchedOrBlankRows: booleanOrDefault(
      source.unmatchedOrBlankRows,
      DEFAULT_REPORT_FILTERS.unmatchedOrBlankRows,
    ),
  };
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
