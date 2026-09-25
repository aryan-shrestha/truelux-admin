"use client";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { type ReactNode, useState } from "react";
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
import type { TaxonomyKind } from "@/lib/api/types";
import { removeTaxonomy } from "@/lib/taxonomy/actions";

export type EditDialogRenderer = (state: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => ReactNode;

type RowActionsProps = {
  kind: TaxonomyKind;
  id: string;
  name: string;
  inUseMessage: string;
  editDialog: EditDialogRenderer;
};

export function RowActions({ kind, id, name, inUseMessage, editDialog }: RowActionsProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <PencilIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {editDialog({ open: editing, onOpenChange: setEditing })}
      <ConfirmAction
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${name}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        successMessage={`${name} deleted`}
        action={() => removeTaxonomy(kind, id)}
        onFailure={(failure) =>
          toast.error(failure.code === "conflict" ? inUseMessage : failure.message)
        }
      />
    </>
  );
}
