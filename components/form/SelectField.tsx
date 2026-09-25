"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none";

export type SelectOption = { value: string; label: string; adornment?: ReactNode };

type SelectFieldProps = {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  noneLabel?: string;
};

// Radix Select cannot hold an empty value, so an optional choice travels as a
// sentinel and is stored in the form as null.
export function SelectField({ name, label, options, placeholder, noneLabel }: SelectFieldProps) {
  const { control } = useFormContext();
  const id = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select
            name={field.name}
            value={field.value ?? (noneLabel ? NONE : "")}
            onValueChange={(value) => field.onChange(value === NONE ? null : value)}
          >
            <SelectTrigger
              id={id}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {noneLabel ? <SelectItem value={NONE}>{noneLabel}</SelectItem> : null}
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.adornment}
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
