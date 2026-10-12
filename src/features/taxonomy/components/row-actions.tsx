import { PencilIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { RowMenu } from "@/components/data-table/row-menu";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { describeError } from "@/lib/repositories/errors";

import { useDeleteTaxonomy } from "../queries/taxonomy.mutations";
import type { TaxonomyKind } from "../schemas/taxonomy.schema";

export function RowActions({
  kind,
  id,
  name,
  inUseMessage,
  deleteDescription = "This cannot be undone.",
  editDialog,
  children,
}: {
  kind: TaxonomyKind;
  id: string;
  name: string;
  // The API's 409 carries no details, so the message names the count the row shows.
  inUseMessage: string;
  deleteDescription?: string;
  editDialog: (state: { open: boolean; onOpenChange: (open: boolean) => void }) => ReactNode;
  // The table row, which right-clicking opens the actions on.
  children: ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const remove = useDeleteTaxonomy(kind);

  function handleDelete() {
    remove.mutate(id, {
      onSuccess: () => {
        toast.success(`${name} deleted`);
        setIsDeleting(false);
      },
      onError: (error) => {
        toast.error(error.code === "conflict" ? inUseMessage : describeError(error));
        setIsDeleting(false);
      },
    });
  }

  return (
    <>
      <RowMenu
        label={`Actions for ${name}`}
        actions={[
          { label: "Edit", icon: PencilIcon, onSelect: () => setIsEditing(true) },
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
      {editDialog({ open: isEditing, onOpenChange: setIsEditing })}
      <ConfirmDialog
        title={`Delete ${name}?`}
        description={deleteDescription}
        confirmLabel="Delete"
        isPending={remove.isPending}
        open={isDeleting}
        onOpenChange={setIsDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
