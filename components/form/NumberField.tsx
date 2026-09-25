"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type NumberFieldProps = {
  name: string;
  label: string;
  description?: ReactNode;
  min?: number;
};

export function NumberField({ name, label, description, min = 0 }: NumberFieldProps) {
  const { control } = useFormContext();
  const id = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            step={1}
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
            value={Number.isNaN(field.value) ? "" : field.value}
            onChange={(event) => field.onChange(event.target.valueAsNumber)}
            aria-invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
