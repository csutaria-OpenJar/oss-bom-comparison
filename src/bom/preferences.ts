import { DEFAULT_REPORT_FILTERS } from "./fields";
import type { ColumnMapping, MatchKey, ReportFilters } from "./types";

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
      headerMappings: parsed.headerMappings ?? {},
      preferredMatchKey: parsed.preferredMatchKey ?? "line_item",
      reportFilters: parsed.reportFilters ?? DEFAULT_REPORT_FILTERS,
    };
  } catch {
    return fallback;
  }
}

export function saveMappingPreference(headers: string[], mapping: ColumnMapping, matchKey: MatchKey): void {
  const current = loadPreferences();
  current.headerMappings[headerSignature(headers)] = mapping;
  current.preferredMatchKey = matchKey;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function loadMappingPreference(headers: string[]): ColumnMapping {
  return loadPreferences().headerMappings[headerSignature(headers)] ?? {};
}

export function saveReportFilters(reportFilters: ReportFilters): void {
  const current = loadPreferences();
  current.reportFilters = reportFilters;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

function headerSignature(headers: string[]): string {
  return headers.map((header) => header.trim().toLowerCase()).join("|");
}
