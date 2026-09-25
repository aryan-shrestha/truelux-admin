"use client";

import { useUrlParams } from "@/components/data-table/use-url-params";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ANY = "__any";

type UrlSelectProps = {
  param: string;
  label: string;
  anyLabel: string;
  options: { value: string; label: string }[];
};

export function UrlSelect({ param, label, anyLabel, options }: UrlSelectProps) {
  const { searchParams, update } = useUrlParams();

  return (
    <Select
      value={searchParams.get(param) ?? ANY}
      onValueChange={(value) => update({ [param]: value === ANY ? null : value })}
    >
      <SelectTrigger aria-label={label} className="w-full sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
