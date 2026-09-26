export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly details: Record<string, unknown>,
    readonly requestId: string | null,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiUnreachableError extends Error {
  constructor(override readonly cause: unknown) {
    super("The API could not be reached.");
    this.name = "ApiUnreachableError";
  }
}

const FALLBACK_CODE = "server_error";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function toApiError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get("X-Request-ID");
  const body: unknown = await response.json().catch(() => null);
  const error = isRecord(body) && isRecord(body.error) ? body.error : {};

  return new ApiError(
    typeof error.code === "string" ? error.code : FALLBACK_CODE,
    response.status,
    isRecord(error.details) ? error.details : {},
    requestId,
    typeof error.message === "string" ? error.message : "The request could not be completed.",
  );
}

export function hasCode(error: unknown, code: string): error is ApiError {
  return error instanceof ApiError && error.code === code;
}

const MESSAGES: Record<string, string> = {
  authentication_failed: "Your session has ended. Sign in again.",
  permission_denied: "Your account does not have access to this.",
  not_found: "That record no longer exists.",
  conflict:
    "This duplicates an existing record. Check the name, slug or SKU, or the variant’s size and shade.",
  throttled: "Too many requests. Wait a moment and try again.",
  invalid_refresh_token: "Your session had already ended.",
  product_has_no_variants: "Add at least one variant before publishing.",
  invalid_status_transition: "The order cannot move to that status from where it is now.",
  order_already_shipped: "The order has already shipped, so it can no longer be changed that way.",
  order_not_cancellable: "Only pending or confirmed orders can be cancelled.",
};

export function describeError(error: unknown): string {
  if (error instanceof ApiUnreachableError) {
    return "The API could not be reached. Check your connection and try again.";
  }
  if (!(error instanceof ApiError)) {
    return "Something went wrong.";
  }
  if (error.code === "validation_error") {
    return error.message;
  }
  const message = MESSAGES[error.code];
  if (message) {
    return message;
  }
  return error.requestId
    ? `Something went wrong (ref ${error.requestId}).`
    : "Something went wrong.";
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
