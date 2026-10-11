import { render, screen } from "@testing-library/react";

import { ORDER_STATUS } from "../order-status";
import { ORDER_STATUS_SCHEMA } from "../schemas/order-status.schema";
import { OrderStatusBadge } from "./order-status-badge";

describe("OrderStatusBadge", () => {
  it.each([
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["shipped", "Shipped"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"],
  ] as const)("names the %s status", (status, label) => {
    render(<OrderStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("gives every status its own colour", () => {
    const variants = ORDER_STATUS_SCHEMA.options.map((status) => ORDER_STATUS[status].badge);

    expect(new Set(variants).size).toBe(ORDER_STATUS_SCHEMA.options.length);
  });
});
