"use client";

import type { ComponentProps, ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

type TextFieldProps = Omit<ComponentProps<"input">, "name" | "id" | "value" | "onChange"> & {
  name: string;
  label: string;
  description?: ReactNode;
  prefix?: ReactNode;
};

export function TextField({ name, label, description, prefix, ...inputProps }: TextFieldProps) {
  const { control } = useFormContext();
  const id = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {prefix ? (
            <InputGroup>
              <InputGroupAddon>{prefix}</InputGroupAddon>
              <InputGroupInput
                {...inputProps}
                {...field}
                value={field.value ?? ""}
                id={id}
                aria-invalid={fieldState.invalid}
              />
            </InputGroup>
          ) : (
            <Input
              {...inputProps}
              {...field}
              value={field.value ?? ""}
              id={id}
              aria-invalid={fieldState.invalid}
            />
          )}
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
