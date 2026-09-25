export type SearchParams = Record<string, string | string[] | undefined>;

export function allParams(value: string | string[] | undefined): string[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return allParams(value)[0];
}

export function queryParam(params: SearchParams): string {
  return firstParam(params.q)?.trim() ?? "";
}

export function pageParam(params: SearchParams): number {
  const page = Number.parseInt(firstParam(params.page) ?? "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
