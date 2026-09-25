"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signIn } from "@/lib/auth/actions";
import { type LoginInput, loginSchema } from "@/lib/auth/login-schema";

type LoginFormProps = {
  next: string | null;
};

export function LoginForm({ next }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const rootError = form.formState.errors.root?.message;

  function handleSubmit(values: LoginInput) {
    startTransition(async () => {
      const failure = await signIn(values, next);
      form.setError("root", { message: failure.message });
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
      <FieldGroup>
        {rootError ? (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription>{rootError}</AlertDescription>
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
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          Sign in
        </Button>
      </FieldGroup>
    </form>
  );
}
