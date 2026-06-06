import { z } from "zod";
import { phoneSchema } from "@/lib/phone";

export { phoneSchema };

export const selfServiceSubscriptionSchema = z.object({
  formulaId: z.string().min(1),
  name: z.string().min(2, "Nom requis").max(100),
  phone: phoneSchema,
  cguAccepted: z
    .boolean()
    .refine((v) => v === true, { message: "Vous devez accepter les CGU" }),
});

export const counterSubscriptionSchema = z.object({
  formulaId: z.string().min(1),
  name: z.string().min(2).max(100),
  phone: phoneSchema,
  cguAccepted: z
    .boolean()
    .refine((v) => v === true, { message: "Vous devez accepter les CGU" }),
  markAsPaid: z.literal(true),
});

export const activatePaymentSchema = z.object({
  subscriptionId: z.string().cuid(),
});

export const promoteWaitlistSchema = z.object({
  subscriptionId: z.string().cuid(),
});

export type SelfServiceSubscriptionInput = z.infer<
  typeof selfServiceSubscriptionSchema
>;
export type CounterSubscriptionInput = z.infer<
  typeof counterSubscriptionSchema
>;
