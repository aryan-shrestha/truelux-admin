"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type QueryKey, useMutation } from "@tanstack/react-query";
import { type DefaultValues, type FieldValues, type Path, useForm } from "react-hook-form";
import type { z } from "zod";

import type { ActionResult } from "@/lib/actions/attempt";
import { ActionFailureError, failureMessage, throwOnFailure } from "@/lib/query/action";

type UseActionFormOptions<TInput extends FieldValues, TOutput extends FieldValues, TData> = {
  schema: z.ZodType<TOutput, TInput>;
  defaultValues: DefaultValues<TInput>;
  action: (values: TOutput) => Promise<ActionResult<TData>>;
  onSuccess: (data: TData) => void;
  invalidates?: readonly QueryKey[];
  fieldForCode?: Record<string, Path<TInput>>;
};

export function useActionForm<TInput extends FieldValues, TOutput extends FieldValues, TData>({
  schema,
  defaultValues,
  action,
  onSuccess,
  invalidates,
  fieldForCode = {},
}: UseActionFormOptions<TInput, TOutput, TData>) {
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: TOutput) => throwOnFailure(await action(values)),
    meta: { invalidates },
    onSuccess,
    onError: (error) => {
      if (!(error instanceof ActionFailureError)) {
        const message = failureMessage(error);
        if (message) form.setError("root", { message });
        return;
      }
      const { failure } = error;
      const codeField = failure.code ? fieldForCode[failure.code] : undefined;
      if (codeField) {
        form.setError(codeField, { message: failure.message });
        return;
      }
      const fields = Object.entries(failure.fieldErrors);
      const known = fields.filter(([field]) => field in form.getValues());
      for (const [field, message] of known) {
        // The API names fields exactly as the form does, so its keys are form paths.
        form.setError(field as Path<TInput>, { message });
      }
      if (known.length < fields.length || fields.length === 0) {
        form.setError("root", { message: failure.message });
      }
    },
  });

  const submit = form.handleSubmit((values) => mutate(values));

  return { form, submit, isPending, rootError: form.formState.errors.root?.message };
}
