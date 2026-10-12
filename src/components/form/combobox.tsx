import { ChevronsUpDownIcon } from "lucide-react";
import { useState, type Ref } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

export interface ComboboxOption {
  value: string;
  label: string;
  swatch?: string;
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-3 shrink-0 rounded-sm border"
      style={{ backgroundColor: color }}
    />
  );
}

// A searchable single choice: shadcn's combobox recipe (`popover` + `command`). Built
// on Radix, so it also works inside a Radix dialog or sheet.
export function Combobox({
  id,
  ref,
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  onChange,
  onBlur,
  ...aria
}: {
  id?: string;
  ref?: Ref<HTMLButtonElement>;
  value: string;
  options: readonly ComboboxOption[];
  placeholder?: string;
  searchPlaceholder: string;
  emptyMessage: string;
  className?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          onBlur={onBlur}
          className={cn("justify-between font-normal", className)}
          {...aria}
        >
          {chosen === undefined ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="flex min-w-0 items-center gap-2">
              {chosen.swatch !== undefined && <Swatch color={chosen.swatch} />}
              <span className="truncate">{chosen.label}</span>
            </span>
          )}
          <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-48 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                // cmdk matches on `value`, so it is the label: an id would match on
                // its hex digits.
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={option.value === value}
                  onSelect={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.swatch !== undefined && <Swatch color={option.swatch} />}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
