// Session 13 update: this used to hold hardcoded PROJECTS/SUPPLIERS arrays
// (a static copy of the workbook). Now that the dashboard fetches real data
// from the Express API (see lib/api.ts), those arrays would just be a second,
// driftable copy of the truth - removed. What's left here are the small,
// pure display helpers every page still needs regardless of where the data
// came from.
//
// NOTE ON UNITS: the workbook's "Stock Value" column has no currency or
// "millions" unit attached to it (see Session 09 slide 17's dashboard
// mock-up, which shows the same numbers unitless) - we display raw values.

export type StockRow = {
  id: string;
  stockValue: number;
  under90: number;
  over90: number;
  over180: number;
  over365: number;
};

export function pctOfTotal(value: number, total: number) {
  return total === 0 ? 0 : (value / total) * 100;
}

export function formatValue(n: number) {
  return n.toFixed(2);
}

export function formatPct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}
