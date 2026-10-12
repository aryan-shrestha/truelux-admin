import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { BrandLogo } from "@/components/layout/brand-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm, safeNextPath } from "@/features/auth";
import { hasSession } from "@/lib/repositories/session";

const LOGIN_SEARCH_SCHEMA = z.object({
  next: z.string().optional().catch(undefined),
  expired: z.literal(1).optional().catch(undefined),
});

export const Route = createFileRoute("/_auth/login")({
  validateSearch: LOGIN_SEARCH_SCHEMA,
  beforeLoad: ({ search }) => {
    // An ended session has already cleared its tokens; the check guards against
    // bouncing between here and the page that sent the tab back.
    if (hasSession() && search.expired === undefined) {
      throw redirect({ href: safeNextPath(search.next) });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { next, expired } = Route.useSearch();

  return (
    <Card>
      <CardHeader>
        <BrandLogo className="mb-2 size-14 rounded-xl" />
        <CardTitle>
          <h1>Sign in</h1>
        </CardTitle>
        <CardDescription>TrueLux staff only.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={next} isExpired={expired === 1} />
      </CardContent>
    </Card>
  );
}
