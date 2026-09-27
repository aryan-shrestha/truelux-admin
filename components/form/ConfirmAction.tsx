"use client";

import { type QueryKey, useMutation } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
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
import { ActionFailureError, failureMessage, throwOnFailure } from "@/lib/query/action";

type ConfirmActionProps<T> = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  successMessage: string;
  action: () => Promise<ActionResult<T>>;
  invalidates?: readonly QueryKey[];
  onSuccess?: (data: T) => void;
  onFailure?: (failure: ActionFailure) => void;
  destructive?: boolean;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ConfirmAction<T>({
  title,
  description,
  confirmLabel,
  successMessage,
  action,
  invalidates,
  onSuccess,
  onFailure = (failure) => toast.error(failure.message),
  destructive = true,
  trigger,
  ...controlled
}: ConfirmActionProps<T>) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlled.open ?? uncontrolledOpen;
  const setOpen = controlled.onOpenChange ?? setUncontrolledOpen;
  const { mutate, isPending } = useMutation({
    mutationFn: async () => throwOnFailure(await action()),
    meta: { invalidates },
    onSuccess: (data) => {
      toast.success(successMessage);
      setOpen(false);
      onSuccess?.(data);
    },
    onError: (error) => {
      if (error instanceof ActionFailureError) {
        onFailure(error.failure);
        return;
      }
      const message = failureMessage(error);
      if (message) toast.error(message);
    },
  });

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
              mutate();
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
