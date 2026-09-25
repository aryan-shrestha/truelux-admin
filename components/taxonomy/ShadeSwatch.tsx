import { ShadeDot } from "@/components/taxonomy/ShadeDot";
import { Badge } from "@/components/ui/badge";

export function ShadeSwatch({ name, hex }: { name: string; hex: string }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <ShadeDot hex={hex} />
      {name}
    </Badge>
  );
}
