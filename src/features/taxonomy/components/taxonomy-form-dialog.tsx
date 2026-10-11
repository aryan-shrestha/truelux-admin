import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { describeError, fieldErrors, type ApiError } from "@/lib/repositories/errors";

import { useSaveTaxonomy } from "../queries/taxonomy.mutations";
import type { TaxonomyKind } from "../schemas/taxonomy.schema";

interface FormDialogProps<TInput extends FieldValues, TOutput> {
  kind: TaxonomyKind;
  entryId: string | null;
  title: string;
  description: string;
  submitLabel: string;
  savedMessage: string;
  schema: z.ZodType<TOutput, TInput>;
  defaultValues: DefaultValues<TInput>;
  toBody: (values: TOutput) => FormData | object;
  children: ReactNode;
}

// Opened by its own trigger (New …) or controlled by a row's actions (Edit).
export function TaxonomyFormDialog<TInput extends FieldValues, TOutput>({
  trigger,
  open,
  onOpenChange,
  ...form
}: FormDialogProps<TInput, TOutput> & {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpenByTrigger, setIsOpenByTrigger] = useState(false);
  const isOpen = open ?? isOpenByTrigger;
  const setIsOpen = onOpenChange ?? setIsOpenByTrigger;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger !== undefined && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.title}</DialogTitle>
          <DialogDescription>{form.description}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so an edit always starts from the row's values. */}
        {isOpen && <TaxonomyForm {...form} onSaved={() => setIsOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TaxonomyForm<TInput extends FieldValues, TOutput>({
  kind,
  entryId,
  submitLabel,
  savedMessage,
  schema,
  defaultValues,
  toBody,
  children,
  onSaved,
}: FormDialogProps<TInput, TOutput> & { onSaved: () => void }) {
  const save = useSaveTaxonomy(kind);
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const rootError = form.formState.errors.root?.message;

  // The API's field messages go under the fields this form has; anything else, and
  // every other failure, is one alert above the fields.
  function showApiError(error: ApiError) {
    if (error.code === "validation_error") {
      const unplaced: string[] = [];
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        if (field in defaultValues) form.setError(field as Path<TInput>, { message });
        else unplaced.push(message);
      }
      if (unplaced.length > 0) form.setError("root", { message: unplaced.join(" ") });
      return;
    }
    form.setError("root", {
      message:
        error.code === "conflict"
          ? "This duplicates an existing record. Check the name and the slug."
          : describeError(error),
    });
  }

  function handleSubmit(values: TOutput) {
    save.mutate(
      { id: entryId, body: toBody(values) },
      {
        onSuccess: () => {
          toast.success(savedMessage);
          onSaved();
        },
        onError: showApiError,
      },
    );
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
        <FieldGroup>
          {rootError && (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}
          {children}
        </FieldGroup>
        <DialogFooter className="mt-6">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending && <Spinner aria-hidden data-icon="inline-start" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
