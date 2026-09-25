import { unstable_rethrow } from "next/navigation";

import { ApiError, ApiUnreachableError, describeError, fieldErrors } from "@/lib/api/errors";

export type ActionFailure = {
  ok: false;
  code: string | null;
  message: string;
  fieldErrors: Record<string, string>;
  details: Record<string, unknown>;
};

export type ActionResult<T = null> = { ok: true; data: T } | ActionFailure;

export function invalidInput(): ActionFailure {
  return {
    ok: false,
    code: "validation_error",
    message: "Check the highlighted fields.",
    fieldErrors: {},
    details: {},
  };
}

export async function attempt<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return {
        ok: false,
        code: error.code,
        message: describeError(error),
        fieldErrors: error.code === "validation_error" ? fieldErrors(error) : {},
        details: error.details,
      };
    }
    if (error instanceof ApiUnreachableError) {
      console.error("API unreachable", error.cause);
      return { ok: false, code: null, message: describeError(error), fieldErrors: {}, details: {} };
    }
    throw error;
  }
}
