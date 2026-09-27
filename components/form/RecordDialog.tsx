"use client";

import type { QueryKey } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type DefaultValues, type FieldValues, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { FormRootError } from "@/components/form/FormRootError";
import { useActionForm } from "@/components/form/use-action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/lib/actions/attempt";

type RecordDialogProps<TInput extends FieldValues, TOutput extends FieldValues> = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  schema: z.ZodType<TOutput, TInput>;
  defaultValues: DefaultValues<TInput>;
  action: (values: TOutput) => Promise<ActionResult<unknown>>;
  invalidates: readonly QueryKey[];
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

export function RecordDialog<TInput extends FieldValues, TOutput extends FieldValues>(
  props: RecordDialogProps<TInput, TOutput>,
) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = props.open ?? uncontrolledOpen;
  const setOpen = props.onOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.trigger ? <DialogTrigger asChild>{props.trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {open ? <RecordForm {...props} onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RecordForm<TInput extends FieldValues, TOutput extends FieldValues>({
  schema,
  defaultValues,
  action,
  invalidates,
  successMessage,
  submitLabel,
  children,
  onDone,
}: RecordDialogProps<TInput, TOutput> & { onDone: () => void }) {
  const { form, submit, isPending, rootError } = useActionForm({
    schema,
    defaultValues,
    action,
    invalidates,
    onSuccess: () => {
      toast.success(successMessage);
      onDone();
    },
  });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <FieldGroup>
          <FormRootError message={rootError} />
          {children}
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
