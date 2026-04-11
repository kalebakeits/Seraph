export function fmtInteger(v: number): string {
  return Math.round(v).toLocaleString();
}

export function fmtDecimal1(v: number): string {
  return v.toFixed(1);
}
