import { MAX_PAGE_SIZE, toListParams } from "./pagination";

describe("toListParams", () => {
  it("turns a page index into limit and offset", () => {
    const params = toListParams({ pagination: { pageIndex: 2, pageSize: 25 } });

    expect(params).toEqual({ limit: 25, offset: 50 });
  });

  it("caps the page size at the API's max_limit", () => {
    const params = toListParams({ pagination: { pageIndex: 1, pageSize: 500 } });

    expect(params.limit).toBe(MAX_PAGE_SIZE);
    expect(params.offset).toBe(MAX_PAGE_SIZE);
  });

  it("writes sorting as DRF ordering, descending with a minus", () => {
    const params = toListParams({
      pagination: { pageIndex: 0, pageSize: 25 },
      sorting: [
        { id: "created_at", desc: true },
        { id: "name", desc: false },
      ],
    });

    expect(params.ordering).toBe("-created_at,name");
  });
});
