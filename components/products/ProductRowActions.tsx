"use client";

import { EyeIcon, EyeOffIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
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
import type { ProductListItem } from "@/lib/api/types";
import { removeProduct, setPublished } from "@/lib/products/actions";

export function ProductRowActions({ product }: { product: ProductListItem }) {
  const [deleting, setDeleting] = useState(false);
  const [, startTransition] = useTransition();

  function publish(isPublished: boolean) {
    startTransition(async () => {
      const result = await setPublished(product.id, isPublished);
      if (result.ok) {
        toast.success(isPublished ? `${product.name} published` : `${product.name} unpublished`);
      } else {
        toast.error(result.message);
      }
    });
  }

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
