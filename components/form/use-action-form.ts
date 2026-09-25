"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { type DefaultValues, type FieldValues, type Path, useForm } from "react-hook-form";
import type { z } from "zod";

import type { ActionResult } from "@/lib/actions/attempt";

type UseActionFormOptions<TInput extends FieldValues, TOutput extends FieldValues, TData> = {
  schema: z.ZodType<TOutput, TInput>;
  defaultValues: DefaultValues<TInput>;
  action: (values: TOutput) => Promise<ActionResult<TData>>;
  onSuccess: (data: TData) => void;
};

export function useActionForm<TInput extends FieldValues, TOutput extends FieldValues, TData>({
  schema,
  defaultValues,
  action,
  onSuccess,
}: UseActionFormOptions<TInput, TOutput, TData>) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await action(values);
      if (result.ok) {
        onSuccess(result.data);
        return;
      }
      const fields = Object.entries(result.fieldErrors);
      const known = fields.filter(([field]) => field in form.getValues());
      for (const [field, message] of known) {
        // The API names fields exactly as the form does, so its keys are form paths.
        form.setError(field as Path<TInput>, { message });
      }
      if (known.length < fields.length || fields.length === 0) {
        form.setError("root", { message: result.message });
      }
    });
  });

  return { form, submit, isPending, rootError: form.formState.errors.root?.message };
}
