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
      message: "The server could not be reached. Check your connection and try again.",
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
