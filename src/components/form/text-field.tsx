import type { ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

// A text input bound to the enclosing react-hook-form by `name`. `prefix` puts a unit
// beside the value ("Rs") without making it part of the value.
export function TextField({
  name,
  label,
  description,
  placeholder,
  prefix,
  inputMode,
}: {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  prefix?: ReactNode;
  inputMode?: "numeric" | "decimal";
}) {
  const { control } = useFormContext();
  const id = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const inputProps = {
          ...field,
          id,
          placeholder,
          inputMode,
          autoComplete: "off",
          "aria-invalid": fieldState.invalid,
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {prefix === undefined ? (
              <Input {...inputProps} />
            ) : (
              <InputGroup>
                <InputGroupAddon>{prefix}</InputGroupAddon>
                <InputGroupInput {...inputProps} />
              </InputGroup>
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
