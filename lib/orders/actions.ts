"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type ActionResult, attempt, invalidInput } from "@/lib/actions/attempt";
import { transitionOrder } from "@/lib/api/orders";
import type { OrderDetail } from "@/lib/api/types";

const targetSchema = z.enum(["confirmed", "shipped", "delivered", "cancelled"]);

export async function moveOrder(id: string, to: z.input<typeof targetSchema>): Promise<ActionResult<OrderDetail>> {
  const parsed = targetSchema.safeParse(to);
  if (!parsed.success) return invalidInput();
  const result = await attempt(() => transitionOrder({ id, to: parsed.data }));
  if (result.ok) {
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath("/");
  }
  return result;
}
