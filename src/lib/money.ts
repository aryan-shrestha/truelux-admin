const GROUPER = new Intl.NumberFormat("en-IN");

// The API sends money as a decimal string. It is grouped from its digits (BigInt for
// the rupees) and never becomes a float, so no amount is ever rounded on screen.
const AMOUNT = /^(-?\d+)(?:\.(\d{1,2}))?$/;

export function formatMoney(amount: string): string {
  const match = AMOUNT.exec(amount.trim());
  if (match === null) return amount;
  const [, rupees = "0", paisa = ""] = match;
  return `Rs ${GROUPER.format(BigInt(rupees))}.${paisa.padEnd(2, "0")}`;
}

// The one sanctioned conversion of an amount to a number: chart geometry only. Nothing
// shown as money or added up comes from its result.
export function toChartNumber(amount: string): number {
  return AMOUNT.test(amount.trim()) ? Number(amount) : 0;
}
