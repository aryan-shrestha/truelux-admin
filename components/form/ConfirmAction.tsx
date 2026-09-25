"use client";

import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";

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
import type { ActionFailure, ActionResult } from "@/lib/actions/attempt";

type ConfirmActionProps = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  successMessage: string;
  action: () => Promise<ActionResult<unknown>>;
  onFailure?: (failure: ActionFailure) => void;
  destructive?: boolean;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ConfirmAction({
  title,
  description,
  confirmLabel,
  successMessage,
  action,
  onFailure = (failure) => toast.error(failure.message),
  destructive = true,
  trigger,
  ...controlled
}: ConfirmActionProps) {
  const [isPending, startTransition] = useTransition();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlled.open ?? uncontrolledOpen;
  const setOpen = controlled.onOpenChange ?? setUncontrolledOpen;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await action();
                if (result.ok) {
                  toast.success(successMessage);
                  setOpen(false);
                } else {
                  onFailure(result);
                }
              });
            }}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
