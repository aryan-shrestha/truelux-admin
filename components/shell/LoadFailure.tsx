"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type LoadFailureProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export function LoadFailure({ error, retry }: LoadFailureProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Empty className="m-4 border md:m-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>This page could not load</EmptyTitle>
        <EmptyDescription>
          The API did not answer as expected. Try again; if it keeps failing, pass reference{" "}
          <span className="font-mono">{error.digest ?? "unknown"}</span> to whoever runs the
          backend.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={retry}>
          <RotateCcwIcon data-icon="inline-start" />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
