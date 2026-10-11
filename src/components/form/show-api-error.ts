import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { describeError, fieldErrors, type ApiError } from "@/lib/repositories/errors";

// The API's field messages go under the fields the form has; anything else, and every
// other failure, becomes one alert above the fields (the form's `root` error).
// `messages` overrides the sentence for a code where the screen knows more.
export function showApiError<TValues extends FieldValues>(
  form: UseFormReturn<TValues, unknown, unknown>,
  error: ApiError,
  messages: Partial<Record<string, string>> = {},
) {
  if (error.code === "validation_error") {
    const fields = Object.keys(form.getValues());
    const unplaced: string[] = [];
    for (const [field, message] of Object.entries(fieldErrors(error))) {
      if (fields.includes(field)) form.setError(field as Path<TValues>, { message });
      else unplaced.push(message);
    }
    if (unplaced.length > 0) form.setError("root", { message: unplaced.join(" ") });
    return;
  }
  form.setError("root", { message: messages[error.code] ?? describeError(error) });
}
