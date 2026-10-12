import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

import { Combobox, type ComboboxOption } from "./combobox";

// A searchable single choice bound to the enclosing form by `name`; the form holds
// the option's value (an id). With `noneLabel`, a first option stands for `null` (an
// optional relation).
export function ComboboxField({
  name,
  label,
  description,
  placeholder,
  emptyMessage,
  noneLabel,
  options,
}: {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  emptyMessage: string;
  noneLabel?: string;
  options: readonly ComboboxOption[];
}) {
  const { control } = useFormContext();
  const id = `field-${name}`;
  const items = noneLabel === undefined ? options : [{ value: "", label: noneLabel }, ...options];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Combobox
            id={id}
            ref={field.ref}
            value={field.value ?? ""}
            options={items}
            placeholder={placeholder}
            searchPlaceholder={`Search ${label.toLowerCase()}`}
            emptyMessage={emptyMessage}
            aria-invalid={fieldState.invalid}
            onBlur={field.onBlur}
            onChange={(value) =>
              field.onChange(noneLabel !== undefined && value === "" ? null : value)
            }
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
