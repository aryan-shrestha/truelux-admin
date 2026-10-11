import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";

import { ApiError, NETWORK_ERROR_CODE, toApiError, UNEXPECTED_RESPONSE_CODE } from "./errors";

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
