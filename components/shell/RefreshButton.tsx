"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RotateCwIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Refetches what the current page shows, whatever its freshness class: for data the
// storefront changed since the last fetch. A failure keeps the data and is toasted by
// the query cache.
export function RefreshButton() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ type: "active" }) > 0;
  const [announcement, setAnnouncement] = useState("");

  async function refresh() {
    setAnnouncement("");
    await queryClient.refetchQueries({ type: "active" });
    const failed = queryClient
      .getQueryCache()
      .findAll({ type: "active" })
      .some((query) => query.state.status === "error");
    if (!failed) setAnnouncement("Data refreshed");
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh data"
            aria-busy={isFetching}
            disabled={isFetching}
            onClick={refresh}
          >
            {isFetching ? <Spinner /> : <RotateCwIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Refresh data</TooltipContent>
      </Tooltip>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
