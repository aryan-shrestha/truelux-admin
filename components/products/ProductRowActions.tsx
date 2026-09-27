"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/form/ConfirmAction";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Page, ProductListItem } from "@/lib/api/types";
import { removeProduct, setPublished } from "@/lib/products/actions";
import { productInvalidates, productKeys, productQueries } from "@/lib/products/queries";
import { failureMessage, throwOnFailure } from "@/lib/query/action";

export function ProductRowActions({ product }: { product: ProductListItem }) {
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const lists = { queryKey: productKeys.lists() };

  // The flag is the merchant's to set, so the row flips at once and flips back if the API
  // refuses (a product without variants cannot be published).
  const { mutate: publish } = useMutation({
    mutationFn: async (isPublished: boolean) =>
      throwOnFailure(await setPublished(product.id, isPublished)),
    meta: { invalidates: productInvalidates(product.id) },
    onMutate: async (isPublished) => {
      await queryClient.cancelQueries(lists);
      const previous = queryClient.getQueriesData<Page<ProductListItem>>(lists);
      queryClient.setQueriesData<Page<ProductListItem>>(
        lists,
        (page) =>
          page && {
            ...page,
            results: page.results.map((row) =>
              row.id === product.id ? { ...row, is_published: isPublished } : row,
            ),
          },
      );
      return { previous };
    },
    onError: (error, _isPublished, context) => {
      for (const [queryKey, page] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, page);
      }
      const message = failureMessage(error);
      if (message) toast.error(message);
    },
    onSuccess: (_saved, isPublished) => {
      toast.success(isPublished ? `${product.name} published` : `${product.name} unpublished`);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${product.name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/products/${product.id}`}>
                <PencilIcon />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => publish(!product.is_published)}>
              {product.is_published ? <EyeOffIcon /> : <EyeIcon />}
              {product.is_published ? "Unpublish" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmAction
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${product.name}?`}
        description="Its variants and images are deleted too. This cannot be undone."
        confirmLabel="Delete product"
        successMessage={`${product.name} deleted`}
        action={() => removeProduct(product.id)}
        invalidates={[productKeys.lists()]}
        onSuccess={() =>
          queryClient.removeQueries({ queryKey: productQueries.detail(product.id).queryKey })
        }
        onFailure={(failure) => {
          if (failure.code !== "conflict") {
            toast.error(failure.message);
            return;
          }
          setDeleting(false);
          toast.error("This product has been ordered, so it cannot be deleted.", {
            action: product.is_published
              ? { label: "Unpublish instead", onClick: () => publish(false) }
              : undefined,
          });
        }}
      />
    </>
  );
}
