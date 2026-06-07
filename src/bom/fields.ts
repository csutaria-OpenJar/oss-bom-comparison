import type { BomField, MatchKey, ReportFilters } from "./types";

export const BOM_FIELDS: BomField[] = [
  "line_item",
  "internal_part_number",
  "customer_part_number",
  "description",
  "manufacturer_name",
  "manufacturer_part_number",
  "quantity",
  "reference_designators",
];

export const MATCH_KEYS: MatchKey[] = [
  "line_item",
  "internal_part_number",
  "customer_part_number",
  "manufacturer_part_number",
];

export const FIELD_LABELS: Record<BomField, string> = {
  line_item: "Line item",
  internal_part_number: "Internal part number",
  customer_part_number: "Customer part number",
  description: "Description",
  manufacturer_name: "Manufacturer name",
  manufacturer_part_number: "Manufacturer part number",
  quantity: "Quantity",
  reference_designators: "Reference designators",
};

export const HEADER_ALIASES: Record<BomField, string[]> = {
  line_item: ["item", "line", "line item", "line_item"],
  internal_part_number: ["internal pn", "internal part number", "part no", "part number"],
  customer_part_number: ["customer pn", "customer part number"],
  description: ["description", "desc"],
  manufacturer_name: ["mfr", "manufacturer", "manufacturer name"],
  manufacturer_part_number: ["mpn", "manufacturer part number", "mfr pn"],
  quantity: ["qty", "quantity"],
  reference_designators: ["ref des", "reference designators", "refs"],
};

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  changedFields: {
    line_item: true,
    internal_part_number: true,
    customer_part_number: true,
    description: true,
    manufacturer_name: true,
    manufacturer_part_number: true,
    quantity: true,
    reference_designators: true,
  },
  addedRows: true,
  removedRows: true,
  manufacturerPartAdds: true,
  manufacturerPartRemoves: true,
  unmatchedOrBlankRows: true,
};
