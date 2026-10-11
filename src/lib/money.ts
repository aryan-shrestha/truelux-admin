const GROUPER = new Intl.NumberFormat("en-IN");

// The API sends money as a decimal string. It is grouped from its digits (BigInt for
// the rupees) and never becomes a float, so no amount is ever rounded on screen.
export function formatMoney(amount: string): string {
  const match = /^(-?\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (match === null) return amount;
  const [, rupees = "0", paisa = ""] = match;
  return `Rs ${GROUPER.format(BigInt(rupees))}.${paisa.padEnd(2, "0")}`;
}
