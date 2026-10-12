import { cn } from "@/lib/cn";

// The TrueLux mark (public/truelux-logo.jpg). Decorative: wherever it appears, the
// name is written beside it.
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/truelux-logo.jpg"
      alt=""
      className={cn("shrink-0 rounded-md object-cover", className)}
    />
  );
}
