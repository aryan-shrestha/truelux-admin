export type SearchParams = Record<string, string | string[] | undefined>;

export function paramsRecord(params: URLSearchParams): SearchParams {
  const record: SearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    record[key] = values.length === 1 ? values[0] : values;
  }
  return record;
}

export type ApiQuery = Record<string, string | number | boolean | string[] | undefined>;

// Empty values are dropped and arrays repeat their key, the way the API reads filters.
export function toSearch(query: ApiQuery | undefined): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === "") continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, String(item));
    }
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

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
