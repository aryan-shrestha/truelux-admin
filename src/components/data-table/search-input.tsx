import { SearchIcon } from "lucide-react";
import { useRef } from "react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

const DEBOUNCE_MS = 300;

// Writes the search to the URL a moment after typing stops, not on every keystroke.
export function SearchInput({
  label,
  value,
  onSearch,
}: {
  label: string;
  value: string | undefined;
  onSearch: (query: string) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <InputGroup className="w-full sm:w-80">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={label}
        defaultValue={value ?? ""}
        onChange={(event) => {
          const query = event.target.value.trim();
          clearTimeout(timer.current);
          timer.current = setTimeout(() => onSearch(query), DEBOUNCE_MS);
        }}
      />
    </InputGroup>
  );
}
