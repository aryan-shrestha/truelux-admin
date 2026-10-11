// Dates are shown in the browser's time zone (convention.md). The API's day filters
// are Asia/Kathmandu days, which match for staff in Nepal.
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

// An ISO calendar day ("2026-09-01") read as a local date, not as UTC midnight.
export function parseIsoDate(isoDate: string): Date {
  const [year = 0, month = 1, day = 1] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDay(isoDate: string): string {
  return DAY.format(parseIsoDate(isoDate));
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// The shop's calendar (Asia/Kathmandu, no daylight saving): the API buckets revenue
// and filters orders by these days, so links built from them match its figures in
// any browser zone.
const SHOP_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kathmandu",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DAY_MS = 86_400_000;

// The shop's calendar day `days` before today, as `YYYY-MM-DD`.
export function shopDaysAgo(days: number, now: Date = new Date()): string {
  return SHOP_DAY.format(new Date(now.getTime() - days * DAY_MS));
}
