import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, expired } = await searchParams;

  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p translate="no" className="wordmark text-center text-2xl">
          {env.brandName}
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to the back office</CardTitle>
            <CardDescription>Staff accounts only.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {expired ? (
              <Alert>
                <AlertDescription>Your session ended. Sign in again to continue.</AlertDescription>
              </Alert>
            ) : null}
            <LoginForm next={typeof next === "string" ? next : null} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
