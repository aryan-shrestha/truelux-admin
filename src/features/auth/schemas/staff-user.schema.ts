import { z } from "zod";

export const STAFF_USER_SCHEMA = z.object({
  id: z.uuid(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});

export type StaffUser = z.infer<typeof STAFF_USER_SCHEMA>;
