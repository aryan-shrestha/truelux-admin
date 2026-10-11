import type { ErrorComponentProps } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/repositories/errors";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
    >
      <h2 className="font-heading text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      {requestId && (
        <p className="text-xs text-muted-foreground">
          Reference: <code>{requestId}</code>
        </p>
      )}
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
