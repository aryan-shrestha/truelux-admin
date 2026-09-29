"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions/attempt";
import type { ProductImage } from "@/lib/api/types";
import { productQueries } from "@/lib/products/queries";
import { failureMessage, throwOnFailure } from "@/lib/query/action";
import { afterImageChange } from "@/lib/query/invalidation";

type UseImageMutationOptions<TVariables> = {
  productId: string;
  action: (variables: TVariables) => Promise<ActionResult<unknown>>;
  optimistic: (images: ProductImage[], variables: TVariables) => ProductImage[];
  successMessage?: string;
};

// Image order and alt text are the merchant's own values, not derived by the API, so the
// screen shows them at once and puts the old images back if the write fails.
export function useImageMutation<TVariables>({
  productId,
  action,
  optimistic,
  successMessage,
}: UseImageMutationOptions<TVariables>) {
  const queryClient = useQueryClient();
  const { queryKey } = productQueries.detail(productId);

  return useMutation({
    mutationFn: async (variables: TVariables) => throwOnFailure(await action(variables)),
    meta: { invalidates: afterImageChange(productId) },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(
        queryKey,
        (product) => product && { ...product, images: optimistic(product.images, variables) },
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
      // A reorder is several writes; some may have landed before the failure.
      void queryClient.invalidateQueries({ queryKey });
      const message = failureMessage(error);
      if (message) toast.error(message);
    },
    onSuccess: () => {
      if (successMessage) toast.success(successMessage);
    },
  });
}
