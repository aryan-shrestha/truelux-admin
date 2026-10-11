import { z } from "zod";

export const LOGIN_FORM_SCHEMA = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginFormValues = z.infer<typeof LOGIN_FORM_SCHEMA>;
