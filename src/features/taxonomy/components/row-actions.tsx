import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
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

import { useDeleteTaxonomy } from "../queries/taxonomy.mutations";
import type { TaxonomyKind } from "../schemas/taxonomy.schema";

export function RowActions({
  kind,
  id,
  name,
  inUseMessage,
  deleteDescription = "This cannot be undone.",
  editDialog,
}: {
  kind: TaxonomyKind;
  id: string;
  name: string;
  // The API's 409 carries no details, so the message names the count the row shows.
  inUseMessage: string;
  deleteDescription?: string;
  editDialog: (state: { open: boolean; onOpenChange: (open: boolean) => void }) => ReactNode;
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleting(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
