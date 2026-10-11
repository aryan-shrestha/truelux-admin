import { QueryObserver } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/repositories/errors";

import { createQueryClient } from "./query-client";

const NOT_FOUND = new ApiError({ status: 404, code: "not_found", message: "Not found." });

describe("createQueryClient", () => {
  it("toasts a failed background refetch once per query, however often it fails", async () => {
    const queryClient = createQueryClient();
    render(<Toaster />);
    let shouldFail = false;
    const queryKey = ["orders"];
    await queryClient.fetchQuery({
      queryKey,
      queryFn: () => (shouldFail ? Promise.reject(NOT_FOUND) : Promise.resolve("orders")),
    });

    shouldFail = true;
    await queryClient.refetchQueries({ queryKey });
    await queryClient.refetchQueries({ queryKey });

    expect(await screen.findAllByText("That record no longer exists.")).toHaveLength(1);
  });

  it("does not toast a failed first load, which the route error page shows", async () => {
    const queryClient = createQueryClient();
    render(<Toaster />);

    const load = queryClient.fetchQuery({
      queryKey: ["orders"],
      queryFn: () => Promise.reject(NOT_FOUND),
    });

    await expect(load).rejects.toBe(NOT_FOUND);
    expect(screen.queryByText("That record no longer exists.")).not.toBeInTheDocument();
  });

  it("invalidates the keys a mutation names and stays pending until they refetch", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["products"], "products");
    let fetchCount = 0;
    let finishRefetch: (value: string) => void = () => {};
    const observer = new QueryObserver(queryClient, {
      queryKey: ["orders", "list"],
      queryFn: () => {
        fetchCount += 1;
        if (fetchCount === 1) return Promise.resolve("first");
        return new Promise<string>((resolve) => (finishRefetch = resolve));
      },
    });
    const unsubscribe = observer.subscribe(() => {});
    await waitFor(() => expect(observer.getCurrentResult().data).toBe("first"));
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: () => Promise.resolve("saved"),
      meta: { invalidates: [["orders"]] },
    });
    let isSettled = false;

    const saving = mutation.execute(undefined).then(() => (isSettled = true));
    await waitFor(() => expect(fetchCount).toBe(2));
    const wasSettledBeforeRefetch = isSettled;
    finishRefetch("second");
    await saving;

    expect(wasSettledBeforeRefetch).toBe(false);
    expect(observer.getCurrentResult().data).toBe("second");
    expect(queryClient.getQueryState(["products"])?.isInvalidated).toBe(false);
    unsubscribe();
  });
});
