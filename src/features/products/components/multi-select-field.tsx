import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

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

export function MultiSelectField({
  name,
  label,
  placeholder,
  description,
  options,
}: {
  name: string;
  label: string;
  placeholder: string;
  description?: string;
  options: readonly { value: string; label: string }[];
}) {
  const { control } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const id = `field-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value;
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
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={id}
                  ref={field.ref}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                  className="h-auto min-h-9 justify-between"
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
                    <span className="font-normal text-muted-foreground">{placeholder}</span>
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
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
