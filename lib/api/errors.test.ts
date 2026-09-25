import { describe, expect, it } from "vitest";

import { ApiError, ApiUnreachableError, describeError, fieldErrors } from "@/lib/api/errors";

function apiError(code: string, message = "server wording", requestId: string | null = "req-1") {
  return new ApiError(code, 422, {}, requestId, message);
}

describe("describeError", () => {
  it.each([
    ["invalid_status_transition", /cannot move to that status/],
    ["order_already_shipped", /already shipped/],
    ["order_not_cancellable", /Only pending or confirmed/],
    ["product_has_no_variants", /at least one variant/],
    ["conflict", /still in use/],
    ["throttled", /Too many requests/],
  ])("branches on %s, not on the server's wording", (code, expected) => {
    expect(describeError(apiError(code))).toMatch(expected);
  });

  it("passes a validation message through, since it is written for users", () => {
    expect(describeError(apiError("validation_error", "Enter a valid SKU."))).toBe("Enter a valid SKU.");
  });

  it("gives an unknown code the request id to quote", () => {
    expect(describeError(apiError("server_error"))).toBe("Something went wrong (ref req-1).");
  });

  it("says the API could not be reached for a transport failure", () => {
    expect(describeError(new ApiUnreachableError(new TypeError("fetch failed")))).toMatch(/could not be reached/);
  });
});

describe("fieldErrors", () => {
  it("takes the first message for each field", () => {
    const error = new ApiError("validation_error", 400, { sku: ["Taken.", "Too long."], slug: "Bad." }, null, "x");

    expect(fieldErrors(error)).toEqual({ sku: "Taken.", slug: "Bad." });
  });
});
