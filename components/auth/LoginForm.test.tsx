import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/LoginForm";
import { signIn } from "@/lib/auth/actions";

vi.mock("@/lib/auth/actions", () => ({ signIn: vi.fn() }));

describe("LoginForm", () => {
  it("validates before calling the server", async () => {
    render(<LoginForm next={null} />);

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("shows a rejected login as one form-level message, not against a field", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      code: "authentication_failed",
      message: "Email or password is incorrect.",
      fieldErrors: {},
      details: {},
    });
    render(<LoginForm next="/orders" />);

    await userEvent.type(screen.getByLabelText("Email"), "staff@truelux.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email or password is incorrect.")).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledWith(
      { email: "staff@truelux.com", password: "wrong" },
      "/orders",
    );
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).not.toHaveAttribute("aria-invalid", "true");
  });
});
