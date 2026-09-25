import { Badge } from "@/components/ui/badge";

export function ShadeSwatch({ name, hex }: { name: string; hex: string }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      {/* The colour is data from the API, so it cannot be a theme class. */}
      <span
        aria-hidden
        className="ring-foreground/15 size-2.5 rounded-full ring-1"
        style={{ backgroundColor: hex }}
      />
      {name}
    </Badge>
  );
}
