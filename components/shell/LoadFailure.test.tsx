import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoadFailure } from "@/components/shell/LoadFailure";

const reset = vi.fn();

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryErrorResetBoundary: () => ({ reset, clearReset: vi.fn(), isReset: () => false }),
}));

describe("LoadFailure", () => {
  it("clears failed queries before retrying the segment", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    render(<LoadFailure error={Object.assign(new Error("x"), { digest: "d1" })} retry={retry} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByText("d1")).toBeInTheDocument();
  });
});
