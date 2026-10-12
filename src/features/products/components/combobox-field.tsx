import { Controller, useFormContext } from "react-hook-form";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface Option {
  value: string;
  label: string;
}

// A searchable single choice bound to the enclosing form by `name`. The form holds
// the option's value (an id); the combobox works with the option itself.
export function ComboboxField({
  name,
  label,
  placeholder,
  emptyMessage,
  options,
}: {
  name: string;
  label: string;
  placeholder: string;
  emptyMessage: string;
  options: readonly Option[];
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
          <Combobox
            items={options}
            value={options.find((option) => option.value === field.value) ?? null}
            onValueChange={(option: Option | null) => field.onChange(option?.value ?? "")}
            itemToStringLabel={(option: Option) => option.label}
            isItemEqualToValue={(option: Option, value: Option) => option.value === value.value}
          >
            <ComboboxInput
              id={id}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
              onBlur={field.onBlur}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
              <ComboboxList>
                {(option: Option) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
