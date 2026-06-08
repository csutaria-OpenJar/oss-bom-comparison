import { describe, expect, it } from "vitest";
import { compareBoms } from "./compare";
import { createSampleMappedBoms } from "./sampleBoms";

describe("createSampleMappedBoms", () => {
  it("builds sample BOMs with repeated rows for multiple MPNs per line item", () => {
    const { original, next } = createSampleMappedBoms();

    expect(original.fileName).toBe("sample-original-bom.xlsx");
    expect(next.fileName).toBe("sample-new-bom.xlsx");
    expect(original.matchKey).toBe("internal_part_number");
    expect(next.matchKey).toBe("internal_part_number");
    expect(original.rows.filter((row) => row.internal_part_number === "OJ-1001")).toHaveLength(2);
    expect(original.rows.filter((row) => row.internal_part_number === "OJ-1002")).toHaveLength(2);
    expect(next.rows.filter((row) => row.internal_part_number === "OJ-1001")).toHaveLength(2);
    expect(next.rows.filter((row) => row.internal_part_number === "OJ-1002")).toHaveLength(2);

    const result = compareBoms(original.rows, next.rows, next.matchKey);

    expect(result.addedRows.map((row) => row.internal_part_number)).toEqual(["OJ-1009"]);
    expect(result.removedRows.map((row) => row.internal_part_number)).toEqual(["OJ-1007", "OJ-1008"]);
    expect(result.manufacturerPartAdds.map((row) => row.manufacturerPartNumber)).toEqual([
      "ERJ-3EKF1002V",
      "CL10B105KO8NNNC",
      "USB4105-GF-A",
    ]);
    expect(result.manufacturerPartRemoves.map((row) => row.manufacturerPartNumber)).toEqual([
      "CRCW060310K0FKEA",
      "C1608X7R1C105K080AC",
      "12401610E4#2A",
    ]);
  });
});
