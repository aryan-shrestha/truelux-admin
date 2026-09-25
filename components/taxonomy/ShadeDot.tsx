export function ShadeDot({ hex }: { hex: string }) {
  return (
    // The colour is API data, so it cannot be a theme class.
    <span
      aria-hidden
      className="ring-foreground/15 size-2.5 shrink-0 rounded-full ring-1"
      style={{ backgroundColor: hex }}
    />
  );
}
