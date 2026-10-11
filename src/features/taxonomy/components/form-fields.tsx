import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function TextField({
  name,
  label,
  description,
  placeholder,
  inputMode,
}: {
  name: string;
  label: string;
  description?: string;
  placeholder?: string;
  inputMode?: "numeric";
}) {
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
            {...field}
            id={id}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete="off"
            aria-invalid={fieldState.invalid}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function NameSlugFields({ namePlaceholder }: { namePlaceholder: string }) {
  return (
    <>
      <TextField name="name" label="Name" placeholder={namePlaceholder} />
      <TextField
        name="slug"
        label="Slug"
        description="Used in storefront URLs. Leave empty to make one from the name."
      />
    </>
  );
}

export function SortOrderField() {
  return (
    <TextField
      name="sort_order"
      label="Sort order"
      description="Lower numbers come first."
      inputMode="numeric"
    />
  );
}
