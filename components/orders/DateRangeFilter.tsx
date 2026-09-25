"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { useUrlParams } from "@/components/data-table/use-url-params";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ISO = "yyyy-MM-dd";
const LABEL = "d MMM yyyy";

function toRange(from: string | undefined, to: string | undefined): DateRange | undefined {
  return from ? { from: parseISO(from), to: to ? parseISO(to) : undefined } : undefined;
}

type DateRangeFilterProps = {
  from: string | undefined;
  to: string | undefined;
};

export function DateRangeFilter({ from, to }: DateRangeFilterProps) {
  const { update } = useUrlParams();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(() => toRange(from, to));
  const label = from
    ? `${format(parseISO(from), LABEL)} – ${to ? format(parseISO(to), LABEL) : "today"}`
    : "Any date";

  function apply(next: DateRange | undefined) {
    setRange(next);
    if (next?.from && next.to) {
      update({ from: format(next.from, ISO), to: format(next.to, ISO) });
      setOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label={`Order date: ${label}`}>
            <CalendarIcon data-icon="inline-start" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={range?.from}
            selected={range}
            onSelect={apply}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
      {from ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear the date range"
          onClick={() => {
            setRange(undefined);
            update({ from: null, to: null });
          }}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
