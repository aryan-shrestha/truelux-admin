import { CalendarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay, parseIsoDate, toIsoDate } from "@/lib/date";

export function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string | undefined;
  to: string | undefined;
  onChange: (range: { from: string; to: string } | undefined) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // Only a half-chosen range lives here; a complete one is in the URL.
  const [draft, setDraft] = useState<DateRange | undefined>();
  const applied =
    from === undefined
      ? undefined
      : { from: parseIsoDate(from), to: to === undefined ? undefined : parseIsoDate(to) };
  const label =
    from === undefined
      ? "Any date"
      : `${formatDay(from)} – ${to === undefined ? "today" : formatDay(to)}`;

  // The first click starts a range and the second ends it (the same day twice is a
  // one-day range). DayPicker's own range would complete on the first click.
  function handleDayClick(day: Date) {
    const start = draft?.from;
    if (start === undefined) {
      setDraft({ from: day, to: undefined });
      return;
    }
    const [first, last] = day < start ? [day, start] : [start, day];
    onChange({ from: toIsoDate(first), to: toIsoDate(last) });
    setDraft(undefined);
    setIsOpen(false);
  }

  return (
    <div className="flex items-center gap-1">
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          setDraft(undefined);
        }}
      >
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
            defaultMonth={(draft ?? applied)?.from}
            selected={draft ?? applied}
            onSelect={(_range, day) => handleDayClick(day)}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
      {from !== undefined && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear the date range"
          onClick={() => onChange(undefined)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
