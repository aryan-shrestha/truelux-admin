import { moveImage } from "./image-order";
import type { ProductImage } from "./schemas/product.schema";

function image(id: string, sort_order: number): ProductImage {
  return { id, url: `https://cdn.test/${id}.jpg`, alt_text: "", sort_order, is_primary: false };
}

describe("moveImage", () => {
  it("renumbers from the new position and reports only what changed", () => {
    const { images, changes } = moveImage([image("a", 0), image("b", 1), image("c", 2)], 2, 1);

    expect(images.map((item) => [item.id, item.sort_order])).toEqual([
      ["a", 0],
      ["c", 1],
      ["b", 2],
    ]);
    expect(changes).toEqual([
      { id: "c", sort_order: 1 },
      { id: "b", sort_order: 2 },
    ]);
  });

  it("separates images whose stored numbers collide", () => {
    const { images, changes } = moveImage([image("a", 0), image("b", 0), image("c", 0)], 0, 1);

    expect(images.map((item) => item.id)).toEqual(["b", "a", "c"]);
    expect(changes).toEqual([
      { id: "a", sort_order: 1 },
      { id: "c", sort_order: 2 },
    ]);
  });
});
