import { useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { RowMenu } from "@/components/data-table/row-menu";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { describeError } from "@/lib/repositories/errors";

import { useDeleteProduct, useSetPublished } from "../queries/products.mutations";
import type { ProductListItem } from "../schemas/product.schema";

export function ProductRowActions({
  row: product,
  children,
}: {
  row: ProductListItem;
  children: ReactNode;
}) {
  const navigate = useNavigate();
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
      <RowMenu
        label={`Actions for ${product.name}`}
        actions={[
          {
            label: "Edit",
            icon: PencilIcon,
            onSelect: () =>
              void navigate({ to: "/products/$productId", params: { productId: product.id } }),
          },
          {
            label: product.is_published ? "Unpublish" : "Publish",
            icon: product.is_published ? EyeOffIcon : EyeIcon,
            onSelect: () => togglePublished(!product.is_published),
          },
          {
            label: "Delete",
            icon: Trash2Icon,
            onSelect: () => setIsDeleting(true),
            isDestructive: true,
          },
        ]}
      >
        {children}
      </RowMenu>
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
