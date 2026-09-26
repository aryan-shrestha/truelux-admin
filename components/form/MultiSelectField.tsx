"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import type { SelectOption } from "@/components/form/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type MultiSelectFieldProps = {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder: string;
  description?: string;
};

export function MultiSelectField({
  name,
  label,
  options,
  placeholder,
  description,
}: MultiSelectFieldProps) {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);
  const id = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value ?? [];
        const chosen = options.filter((option) => selected.includes(option.value));

        function toggle(value: string) {
          field.onChange(
            selected.includes(value)
              ? selected.filter((item) => item !== value)
              : [...selected, value],
          );
        }

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={id}
                  ref={field.ref}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                  className="h-auto min-h-8 justify-between"
                >
                  {chosen.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {chosen.map((option) => (
                        <Badge key={option.value} variant="secondary">
                          {option.label}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-normal">{placeholder}</span>
                  )}
                  <ChevronsUpDownIcon data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder={`Search ${label.toLowerCase()}`} />
                  <CommandList>
                    <CommandEmpty>No match.</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          keywords={[option.label]}
                          onSelect={toggle}
                        >
                          {/* Not focusable or clickable: the option itself toggles it. */}
                          <Checkbox
                            checked={selected.includes(option.value)}
                            tabIndex={-1}
                            className="pointer-events-none"
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
