import { isAxiosError } from "axios";
import { z } from "zod";

const ERROR_ENVELOPE = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()),
  }),
});

export const NETWORK_ERROR_CODE = "network_error";
export const UNEXPECTED_RESPONSE_CODE = "unexpected_response";

// A refused CORS preflight is indistinguishable from being offline: both arrive
// without a response.
const NETWORK_ERROR_MESSAGE =
  "The server could not be reached. Check your connection and try again.";

const MESSAGES: Record<string, string> = {
  [NETWORK_ERROR_CODE]: NETWORK_ERROR_MESSAGE,
  authentication_failed: "Your session has ended. Sign in again.",
  permission_denied: "Your account does not have access to this.",
  not_found: "That record no longer exists.",
  conflict:
    "This duplicates an existing record. Check the name, slug or SKU, or the variant's size and shade.",
  throttled: "Too many requests. Wait a moment and try again.",
  invalid_refresh_token: "Your session had already ended.",
  product_has_no_variants: "Add at least one variant before publishing.",
  invalid_status_transition: "The order cannot move to that status from where it is now.",
  order_already_shipped: "The order has already shipped, so it can no longer be changed that way.",
  order_not_cancellable: "Only pending or confirmed orders can be cancelled.",
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;
  readonly requestId: string | undefined;

  constructor({
    status,
    code,
    message,
    details = {},
    requestId,
  }: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string | undefined;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (!isAxiosError(error) || error.response === undefined) {
    return new ApiError({
      status: 0,
      code: NETWORK_ERROR_CODE,
      message: NETWORK_ERROR_MESSAGE,
    });
  }

  const { status, data, headers } = error.response;
  const requestId =
    typeof headers["x-request-id"] === "string" ? headers["x-request-id"] : undefined;
  const envelope = ERROR_ENVELOPE.safeParse(data);
  if (!envelope.success) {
    return new ApiError({
      status,
      code: UNEXPECTED_RESPONSE_CODE,
      message: "The server returned an unexpected response.",
      requestId,
    });
  }

  return new ApiError({ status, ...envelope.data.error, requestId });
}

export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong.";
  if (error.code === "validation_error") return error.message;
  const message = MESSAGES[error.code];
  if (message !== undefined) return message;
  return error.requestId === undefined
    ? "Something went wrong."
    : `Something went wrong (ref ${error.requestId}).`;
}

export function fieldErrors(error: ApiError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.details)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") {
      errors[field] = messages[0];
    } else if (typeof messages === "string") {
      errors[field] = messages;
    }
  }
  return errors;
}
