import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

// The caller owns `open` and the mutation, and closes the dialog when the action has
// succeeded. Without a `trigger`, the caller opens it (from a menu item, for example).
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  isPending,
  open,
  onOpenChange,
  onConfirm,
}: {
  trigger?: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  isPending: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger !== undefined && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              // Radix closes the dialog on Action; it stays open until the caller's
              // action has succeeded.
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending && <Spinner aria-hidden data-icon="inline-start" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
