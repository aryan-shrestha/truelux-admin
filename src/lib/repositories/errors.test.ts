import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";

import {
  ApiError,
  describeError,
  fieldErrors,
  NETWORK_ERROR_CODE,
  toApiError,
  UNEXPECTED_RESPONSE_CODE,
} from "./errors";

function axiosErrorWithResponse(status: number, data: unknown, requestId?: string): AxiosError {
  const headers = new AxiosHeaders();
  if (requestId !== undefined) headers.set("x-request-id", requestId);
  const response = { status, data, headers, statusText: "", config: { headers } } as AxiosResponse;
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, response);
}

describe("toApiError", () => {
  it("maps the back-end error envelope onto ApiError", () => {
    const error = axiosErrorWithResponse(
      400,
      {
        error: {
          code: "validation_error",
          message: "Enter a valid email address.",
          details: { email: ["Enter a valid email address."] },
        },
      },
      "req-123",
    );

    const apiError = toApiError(error);

    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe("validation_error");
    expect(apiError.details).toEqual({ email: ["Enter a valid email address."] });
    expect(apiError.requestId).toBe("req-123");
  });

  it("reports a body that is not the envelope as unexpected_response", () => {
    const error = axiosErrorWithResponse(502, "<html>Bad gateway</html>");

    const apiError = toApiError(error);

    expect(apiError.status).toBe(502);
    expect(apiError.code).toBe(UNEXPECTED_RESPONSE_CODE);
  });

  it("reports a request with no response as network_error", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");

    const apiError = toApiError(error);

    expect(apiError.status).toBe(0);
    expect(apiError.code).toBe(NETWORK_ERROR_CODE);
  });
});

describe("describeError", () => {
  it.each([
    ["network_error", "The server could not be reached. Check your connection and try again."],
    ["authentication_failed", "Your session has ended. Sign in again."],
    ["permission_denied", "Your account does not have access to this."],
    ["not_found", "That record no longer exists."],
    [
      "conflict",
      "This duplicates an existing record. Check the name, slug or SKU, or the variant's size and shade.",
    ],
    ["throttled", "Too many requests. Wait a moment and try again."],
    ["invalid_refresh_token", "Your session had already ended."],
    ["product_has_no_variants", "Add at least one variant before publishing."],
    ["invalid_status_transition", "The order cannot move to that status from where it is now."],
    [
      "order_already_shipped",
      "The order has already shipped, so it can no longer be changed that way.",
    ],
    ["order_not_cancellable", "Only pending or confirmed orders can be cancelled."],
  ])("describes %s", (code, sentence) => {
    const error = new ApiError({ status: 400, code, message: "from the API" });

    expect(describeError(error)).toBe(sentence);
  });

  it("shows the API's own message for a validation error", () => {
    const error = new ApiError({
      status: 400,
      code: "validation_error",
      message: "Enter a valid email address.",
    });

    expect(describeError(error)).toBe("Enter a valid email address.");
  });

  it("carries the request id for an unknown code", () => {
    const withId = new ApiError({
      status: 500,
      code: "server_error",
      message: "",
      requestId: "r1",
    });
    const withoutId = new ApiError({ status: 500, code: "server_error", message: "" });

    expect(describeError(withId)).toBe("Something went wrong (ref r1).");
    expect(describeError(withoutId)).toBe("Something went wrong.");
  });
});

describe("fieldErrors", () => {
  it("takes the first message per field and skips values that are not messages", () => {
    const error = new ApiError({
      status: 400,
      code: "validation_error",
      message: "",
      details: {
        email: ["Enter a valid email address.", "Second message."],
        slug: "Already taken.",
        variants: [{ sku: ["Required."] }],
      },
    });

    expect(fieldErrors(error)).toEqual({
      email: "Enter a valid email address.",
      slug: "Already taken.",
    });
  });
});
