import { describe, expect, it } from "vitest";

import { orderAfterMove } from "@/components/products/ImagesManager";
import { image } from "@/tests/fixtures/products";

describe("orderAfterMove", () => {
  it("swaps an image with its neighbour and patches only what changed", () => {
    const images = [image("a", 0), image("b", 1), image("c", 2)];

    expect(orderAfterMove(images, 2, -1)).toEqual([
      { id: "c", sort_order: 1 },
      { id: "b", sort_order: 2 },
    ]);
  });

  it("renumbers from zero when the stored orders collide", () => {
    const images = [image("a", 0), image("b", 0), image("c", 0)];

    expect(orderAfterMove(images, 0, 1)).toEqual([
      { id: "a", sort_order: 1 },
      { id: "c", sort_order: 2 },
    ]);
  });

  it("does nothing past either end", () => {
    expect(orderAfterMove([image("a", 0)], 0, -1)).toEqual([]);
  });
});
