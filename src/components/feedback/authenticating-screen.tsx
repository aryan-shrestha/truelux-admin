import { BrandLogo } from "@/components/layout/brand-logo";

// Shown on a first load or reload while the staff session is checked (and its token
// refreshed, if needed), before anything of the signed-in frame can show.
export function AuthenticatingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-svh items-center justify-center bg-muted p-6"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-6 text-center">
        <BrandLogo className="size-20 rounded-2xl shadow-md ring-1 ring-primary/10" />
        <div className="flex flex-col gap-1">
          <p className="font-heading text-2xl tracking-tight">TrueLux Admin</p>
          <p className="text-sm text-muted-foreground">Authenticating…</p>
        </div>
        <div aria-hidden className="h-1 w-40 overflow-hidden rounded-full bg-border">
          <div className="h-full w-2/5 rounded-full bg-primary motion-safe:animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}
