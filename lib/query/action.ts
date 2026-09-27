import { unstable_rethrow } from "next/navigation";

import type { ActionFailure, ActionResult } from "@/lib/actions/attempt";
import { describeError } from "@/lib/api/errors";

export class ActionFailureError extends Error {
  constructor(readonly failure: ActionFailure) {
    super(failure.message);
    this.name = "ActionFailureError";
  }
}

// Server actions return their failures so they survive serialisation; a mutation needs
// them thrown to reach `onError`.
export function throwOnFailure<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  throw new ActionFailureError(result);
}

// A server action that redirects (a session that could not be refreshed) rejects with
// Next's navigation signal while the router navigates; that is not a failure to show.
function isNavigation(error: unknown): boolean {
  try {
    unstable_rethrow(error);
    return false;
  } catch {
    return true;
  }
}

export function failureMessage(error: unknown): string | null {
  if (isNavigation(error)) return null;
  return error instanceof ActionFailureError ? error.failure.message : describeError(error);
}
