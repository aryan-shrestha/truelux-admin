import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { type ApiError, describeError } from "@/lib/repositories/errors";

import { safeNextPath } from "../next-path";
import { useSignIn } from "../queries/auth.mutations";
import { LOGIN_FORM_SCHEMA, type LoginFormValues } from "../schemas/login.schema";

// Wrong password, unknown email, inactive and non-staff accounts all get the same 401,
// so one sentence covers them, and no field is marked.
function describeSignInError(error: ApiError): string {
  return error.code === "authentication_failed"
    ? "Email or password is incorrect."
    : describeError(error);
}

export function LoginForm({ next, isExpired }: { next: string | undefined; isExpired: boolean }) {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LOGIN_FORM_SCHEMA),
    defaultValues: { email: "", password: "" },
  });

  function handleSubmit(values: LoginFormValues) {
    signIn.mutate(values, {
      onSuccess: () => navigate({ href: safeNextPath(next), replace: true }),
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
      <FieldGroup>
        {signIn.error ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription>{describeSignInError(signIn.error)}</AlertDescription>
          </Alert>
        ) : isExpired ? (
          <Alert aria-live="polite">
            <AlertDescription>Your session has ended. Sign in again.</AlertDescription>
          </Alert>
        ) : null}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                {...field}
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" size="lg" disabled={signIn.isPending}>
          {signIn.isPending && <Spinner data-icon="inline-start" />}
          Sign in
        </Button>
      </FieldGroup>
    </form>
  );
}
