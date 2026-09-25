"use client";

import { SearchIcon } from "lucide-react";
import { useRef } from "react";

import { useUrlParams } from "@/components/data-table/use-url-params";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

const DEBOUNCE_MS = 300;

type UrlSearchProps = {
  label: string;
  param?: string;
};

export function UrlSearch({ label, param = "q" }: UrlSearchProps) {
  const { searchParams, update, isPending } = useUrlParams();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return (
    <InputGroup className="w-full sm:w-72">
      <InputGroupAddon>{isPending ? <Spinner /> : <SearchIcon />}</InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={label}
        defaultValue={searchParams.get(param) ?? ""}
        onChange={(event) => {
          const value = event.target.value.trim();
          clearTimeout(timer.current);
          timer.current = setTimeout(() => update({ [param]: value }), DEBOUNCE_MS);
        }}
      />
    </InputGroup>
  );
}
