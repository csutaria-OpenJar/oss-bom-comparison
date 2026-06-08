export type BomField =
  | "line_item"
  | "internal_part_number"
  | "customer_part_number"
  | "description"
  | "manufacturer_name"
  | "manufacturer_part_number"
  | "quantity"
  | "reference_designators";

export type MatchKey =
  | "line_item"
  | "internal_part_number"
  | "customer_part_number"
  | "manufacturer_part_number";

export type ColumnMapping = Partial<Record<BomField, number>>;

export interface BomRow {
  line_item: string;
  internal_part_number: string;
  customer_part_number: string;
  description: string;
  manufacturer_name: string;
  manufacturer_part_number: string;
  quantity: string;
  reference_designators: string;
}

export interface PreviewColumn {
  index: number;
  label: string;
  header: string;
}

export interface PreviewRow {
  rowNumber: number;
  values: string[];
  isHeader: boolean;
}

export interface WorksheetPreview {
  sheetName: string;
  headerRow: number;
  headers: string[];
  columns: PreviewColumn[];
  rows: PreviewRow[];
}

export interface UploadedWorkbook {
  fileName: string;
  workbook: import("./workbook").ParsedWorkbook;
  sheetNames: string[];
}

export interface MappedBom {
  fileName: string;
  sheetName: string;
  headerRow: number;
  mapping: ColumnMapping;
  matchKey: MatchKey;
  rows: BomRow[];
}

export interface DuplicateGroup {
  key: string;
  rowIndexes: number[];
}

export interface MatchKeyValidation {
  blankRowIndexes: number[];
  duplicateGroups: DuplicateGroup[];
}

export interface FieldChange {
  matchKey: MatchKey;
  matchValue: string;
  field: BomField;
  originalValue: string;
  newValue: string;
}

export interface ManufacturerPartChange {
  matchKey: MatchKey;
  matchValue: string;
  lineItem: string;
  manufacturerName: string;
  manufacturerPartNumber: string;
}

export interface ComparisonResult {
  summary: {
    addedRows: number;
    removedRows: number;
    changedFields: number;
    manufacturerPartAdds: number;
    manufacturerPartRemoves: number;
    unmatchedOrBlankRows: number;
  };
  addedRows: BomRow[];
  removedRows: BomRow[];
  changedFields: FieldChange[];
  manufacturerPartAdds: ManufacturerPartChange[];
  manufacturerPartRemoves: ManufacturerPartChange[];
  unmatchedOrBlankRows: BomRow[];
  matchedRows: Array<{
    matchKey: MatchKey;
    matchValue: string;
    original: BomRow;
    originalRows: BomRow[];
    next: BomRow;
    newRows: BomRow[];
    changes: FieldChange[];
  }>;
}

export type ReportFilters = {
  changedFields: Record<BomField, boolean>;
  addedRows: boolean;
  removedRows: boolean;
  manufacturerPartAdds: boolean;
  manufacturerPartRemoves: boolean;
  unmatchedOrBlankRows: boolean;
};
