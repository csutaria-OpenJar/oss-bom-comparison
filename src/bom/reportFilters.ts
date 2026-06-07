import type { ComparisonResult, ReportFilters } from "./types";

export function applyReportFilters(result: ComparisonResult, filters: ReportFilters): ComparisonResult {
  const addedRows = filters.addedRows ? result.addedRows : [];
  const removedRows = filters.removedRows ? result.removedRows : [];
  const changedFields = result.changedFields.filter((change) => filters.changedFields[change.field]);
  const manufacturerPartAdds = filters.manufacturerPartAdds ? result.manufacturerPartAdds : [];
  const manufacturerPartRemoves = filters.manufacturerPartRemoves ? result.manufacturerPartRemoves : [];
  const unmatchedOrBlankRows = filters.unmatchedOrBlankRows ? result.unmatchedOrBlankRows : [];

  return {
    ...result,
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
  };
}
