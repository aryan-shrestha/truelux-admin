import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { OrderActions } from "@/components/orders/OrderActions";
import { moveOrder } from "@/lib/orders/actions";

vi.mock("@/lib/orders/actions", () => ({ moveOrder: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("OrderActions", () => {
  it("renders only the transitions the API allows", () => {
    render(<OrderActions orderId="o1" orderNumber="TL-2026-000123" allowed={["shipped"]} />);

    expect(screen.getByRole("button", { name: "Mark as shipped" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
  });

  it("renders nothing for a finished order", () => {
    const { container } = render(
      <OrderActions orderId="o1" orderNumber="TL-2026-000123" allowed={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("cancels only after a confirm that says stock is restored", async () => {
    vi.mocked(moveOrder).mockResolvedValueOnce({
      ok: false,
      code: "order_not_cancellable",
      message: "Only pending or confirmed orders can be cancelled.",
      fieldErrors: {},
      details: {},
    });
    render(
      <OrderActions
        orderId="o1"
        orderNumber="TL-2026-000123"
        allowed={["confirmed", "cancelled"]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancel order" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("The items go back into stock.");
    expect(moveOrder).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel order" }));

    expect(moveOrder).toHaveBeenCalledWith("o1", "cancelled");
    expect(toast.error).toHaveBeenCalledWith("Only pending or confirmed orders can be cancelled.");
  });

  it("confirms a pending order in one click", async () => {
    vi.mocked(moveOrder).mockResolvedValueOnce({
      ok: false,
      code: "invalid_status_transition",
      message: "x",
      fieldErrors: {},
      details: {},
    });
    render(
      <OrderActions
        orderId="o1"
        orderNumber="TL-2026-000123"
        allowed={["confirmed", "cancelled"]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Confirm order" }));

    expect(moveOrder).toHaveBeenCalledWith("o1", "confirmed");
  });
});
