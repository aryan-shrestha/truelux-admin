import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h2 className="font-heading text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">The page you asked for does not exist.</p>
      <Button variant="outline" asChild>
        <Link to="/">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
