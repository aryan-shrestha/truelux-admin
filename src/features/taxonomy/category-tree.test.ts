import { toCategoryRows } from "./category-tree";
import type { Category } from "./schemas/taxonomy.schema";

function category(id: string, name: string, parent_id: string | null, sort_order = 0): Category {
  return { id, name, slug: id, parent_id, sort_order, product_count: 0 };
}

describe("toCategoryRows", () => {
  it("puts each child directly under its parent, both levels in sort order", () => {
    const rows = toCategoryRows([
      category("lips", "Lips", null, 2),
      category("gloss", "Gloss", "lips", 1),
      category("face", "Face", null, 1),
      category("balm", "Balm", "lips", 0),
      category("primer", "Primer", "face"),
    ]);

    expect(rows.map((row) => [row.id, row.depth, row.parentName])).toEqual([
      ["face", 0, null],
      ["primer", 1, "Face"],
      ["lips", 0, null],
      ["balm", 1, "Lips"],
      ["gloss", 1, "Lips"],
    ]);
  });

  it("shows a child whose parent was filtered out as top level", () => {
    const rows = toCategoryRows([category("gloss", "Gloss", "lips")]);

    expect(rows).toMatchObject([{ id: "gloss", depth: 0, parentName: null }]);
  });
});
