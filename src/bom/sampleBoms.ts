import type { BomRow, ColumnMapping, MappedBom } from "./types";

const MAPPING: ColumnMapping = {
  line_item: 0,
  internal_part_number: 1,
  customer_part_number: 2,
  description: 3,
  manufacturer_name: 4,
  manufacturer_part_number: 5,
  quantity: 6,
  reference_designators: 7,
};

const ORIGINAL_ROWS: BomRow[] = [
  sampleRow("1", "OJ-1001", "CUST-RES-10K", "Resistor, 10k ohm, 1%, 0603", "Yageo", "RC0603FR-0710KL", "8", "R1, R2, R3, R4, R8, R9, R12, R14"),
  sampleRow("1", "OJ-1001", "CUST-RES-10K", "Resistor, 10k ohm, 1%, 0603", "Vishay", "CRCW060310K0FKEA", "8", "R1, R2, R3, R4, R8, R9, R12, R14"),
  sampleRow("2", "OJ-1002", "CUST-CAP-1UF", "Capacitor, 1uF, 10%, X7R, 0603", "Murata", "GRM188R71C105KA12D", "6", "C1, C2, C5, C8, C9, C12"),
  sampleRow("2", "OJ-1002", "CUST-CAP-1UF", "Capacitor, 1uF, 10%, X7R, 0603", "TDK", "C1608X7R1C105K080AC", "6", "C1, C2, C5, C8, C9, C12"),
  sampleRow("3", "OJ-1003", "CUST-MCU-STM32", "MCU, Arm Cortex-M4, 64-pin LQFP", "STMicroelectronics", "STM32F401RCT6", "1", "U1"),
  sampleRow("4", "OJ-1004", "CUST-REG-3V3", "LDO regulator, 3.3V, SOT-23-5", "Texas Instruments", "TLV75533PDBVR", "1", "U3"),
  sampleRow("5", "OJ-1005", "CUST-CONN-USB", "USB-C receptacle, 16-pin, mid-mount", "Amphenol ICC", "12401610E4#2A", "1", "J1"),
  sampleRow("6", "OJ-1006", "CUST-LED-GRN", "LED, green, 0603", "Lite-On", "LTST-C190KGKT", "2", "D1, D2"),
  sampleRow("7", "OJ-1007", "CUST-OSC-16M", "Crystal oscillator, 16 MHz, 3.2x2.5mm", "Abracon", "ASV-16.000MHZ-EJ-T", "1", "Y1"),
  sampleRow("8", "OJ-1008", "CUST-FUSE-500MA", "Resettable fuse, 500 mA, 1206", "Bel Fuse", "0ZCJ0050FF2E", "1", "F1"),
];

const NEW_ROWS: BomRow[] = [
  sampleRow("1", "OJ-1001", "CUST-RES-10K", "Resistor, 10k ohm, 1%, 0603", "Yageo", "RC0603FR-0710KL", "10", "R1, R2, R3, R4, R8, R9, R12, R14, R21, R22"),
  sampleRow("1", "OJ-1001", "CUST-RES-10K", "Resistor, 10k ohm, 1%, 0603", "Panasonic", "ERJ-3EKF1002V", "10", "R1, R2, R3, R4, R8, R9, R12, R14, R21, R22"),
  sampleRow("2", "OJ-1002", "CUST-CAP-1UF", "Capacitor, 1uF, 10%, X7R, 0603", "Murata", "GRM188R71C105KA12D", "6", "C1, C2, C5, C8, C9, C12"),
  sampleRow("2", "OJ-1002", "CUST-CAP-1UF", "Capacitor, 1uF, 10%, X7R, 0603", "Samsung Electro-Mechanics", "CL10B105KO8NNNC", "6", "C1, C2, C5, C8, C9, C12"),
  sampleRow("3", "OJ-1003", "CUST-MCU-STM32", "MCU, Arm Cortex-M4, 64-pin LQFP, industrial temp", "STMicroelectronics", "STM32F401RCT6", "1", "U1"),
  sampleRow("4", "OJ-1004", "CUST-REG-3V3", "LDO regulator, 3.3V, SOT-23-5", "Texas Instruments", "TLV75533PDBVR", "2", "U3, U7"),
  sampleRow("5", "OJ-1005", "CUST-CONN-USB", "USB-C receptacle, 16-pin, mid-mount", "GCT", "USB4105-GF-A", "1", "J1"),
  sampleRow("6", "OJ-1006", "CUST-LED-GRN", "LED, green, 0603", "Lite-On", "LTST-C190KGKT", "1", "D1"),
  sampleRow("7", "OJ-1009", "CUST-TVS-USB", "USB ESD protection array, SOT-23-6", "Semtech", "RClamp0524P.TCT", "1", "U8"),
];

export function createSampleMappedBoms(): { original: MappedBom; next: MappedBom } {
  return {
    original: sampleMappedBom("sample-original-bom.xlsx", ORIGINAL_ROWS),
    next: sampleMappedBom("sample-new-bom.xlsx", NEW_ROWS),
  };
}

function sampleMappedBom(fileName: string, rows: BomRow[]): MappedBom {
  return {
    fileName,
    sheetName: "BOM",
    headerRow: 1,
    mapping: MAPPING,
    matchKey: "internal_part_number",
    rows,
  };
}

function sampleRow(
  line_item: string,
  internal_part_number: string,
  customer_part_number: string,
  description: string,
  manufacturer_name: string,
  manufacturer_part_number: string,
  quantity: string,
  reference_designators: string,
): BomRow {
  return {
    line_item,
    internal_part_number,
    customer_part_number,
    description,
    manufacturer_name,
    manufacturer_part_number,
    quantity,
    reference_designators,
  };
}
