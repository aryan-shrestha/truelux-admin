// Explicit zone: the server renders in UTC, and the shop trades in Nepal time.
const TIME_ZONE = "Asia/Kathmandu";

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DAY = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

export function formatDay(isoDate: string): string {
  return DAY.format(new Date(`${isoDate}T00:00:00+05:45`));
}

const ISO_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toIsoDate(date: Date): string {
  return ISO_DAY.format(date);
}

export function daysAgo(days: number, now: Date = new Date()): string {
  return toIsoDate(new Date(now.getTime() - days * 86_400_000));
}
