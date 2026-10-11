import { Link } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { describeError } from "@/lib/repositories/errors";

import { useDeleteProduct, useSetPublished } from "../queries/products.mutations";
import type { ProductListItem } from "../schemas/product.schema";

export function ProductRowActions({ product }: { product: ProductListItem }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const setPublished = useSetPublished();
  const remove = useDeleteProduct();

  function togglePublished(isPublished: boolean) {
    setPublished.mutate(
      { id: product.id, isPublished },
      {
        onSuccess: () =>
          toast.success(`${product.name} ${isPublished ? "published" : "unpublished"}`),
        onError: (error) => toast.error(describeError(error)),
      },
    );
  }

  function handleDelete() {
    remove.mutate(product.id, {
      onSuccess: () => {
        toast.success(`${product.name} deleted`);
        setIsDeleting(false);
      },
      onError: (error) => {
        setIsDeleting(false);
        // A product that has been ordered is kept for the order history; hiding it is
        // what staff usually want instead.
        if (error.code === "conflict") {
          toast.error(`${product.name} has been ordered, so it cannot be deleted.`, {
            action: product.is_published
              ? { label: "Unpublish instead", onClick: () => togglePublished(false) }
              : undefined,
          });
          return;
        }
        toast.error(describeError(error));
      },
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${product.name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/products/$productId" params={{ productId: product.id }}>
              <PencilIcon />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => togglePublished(!product.is_published)}>
            {product.is_published ? <EyeOffIcon /> : <EyeIcon />}
            {product.is_published ? "Unpublish" : "Publish"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleting(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        title={`Delete ${product.name}?`}
        description="Its variants and images go with it. This cannot be undone."
        confirmLabel="Delete"
        isPending={remove.isPending}
        open={isDeleting}
        onOpenChange={setIsDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
