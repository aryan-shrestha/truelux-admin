import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { ImagesManager } from "@/components/products/ImagesManager";
import type { ActionResult } from "@/lib/actions/attempt";
import { reorderImages } from "@/lib/products/actions";
import { productQueries } from "@/lib/products/queries";
import { image, product } from "@/tests/fixtures/products";
import { renderWithQuery, testQueryClient } from "@/tests/fixtures/query";

vi.mock("@/lib/products/actions", () => ({
  reorderImages: vi.fn(),
  uploadImage: vi.fn(),
  updateImage: vi.fn(),
  removeImage: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const images = [image("a", 0, true), image("b", 1)];

function sortOrders(client: ReturnType<typeof testQueryClient>): Record<string, number> {
  const cached = client.getQueryData(productQueries.detail("p1").queryKey);
  return Object.fromEntries((cached?.images ?? []).map((entry) => [entry.id, entry.sort_order]));
}

describe("ImagesManager reorder", () => {
  it("moves the image at once, then puts it back when the API refuses", async () => {
    let answer: (result: ActionResult<null>) => void = () => {};
    vi.mocked(reorderImages).mockReturnValueOnce(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const client = testQueryClient();
    client.setQueryData(productQueries.detail("p1").queryKey, { ...product, images });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderWithQuery(<ImagesManager productId="p1" images={images} />, client);

    await userEvent.click(screen.getByRole("button", { name: "Move image 2 earlier" }));

    await waitFor(() => expect(sortOrders(client)).toEqual({ a: 1, b: 0 }));

    answer({ ok: false, code: "not_found", message: "Gone.", fieldErrors: {}, details: {} });

    await waitFor(() => expect(sortOrders(client)).toEqual({ a: 0, b: 1 }));
    expect(toast.error).toHaveBeenCalledWith("Gone.");
    vi.unstubAllGlobals();
  });
});
