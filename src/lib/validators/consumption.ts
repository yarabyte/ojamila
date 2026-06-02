import { z } from "zod";

export const consumeMealSchema = z.object({
  qrToken: z.string().min(10).optional(),
  shortCode: z.string().min(4).max(8).optional(),
  subscriptionId: z.string().cuid().optional(),
}).refine(
  (data) => data.qrToken || data.shortCode || data.subscriptionId,
  { message: "qrToken, shortCode ou subscriptionId requis" }
);

export const lookupSubscriptionSchema = z.object({
  qrToken: z.string().min(10).optional(),
  shortCode: z.string().min(4).max(8).optional(),
}).refine(
  (data) => data.qrToken || data.shortCode,
  { message: "qrToken ou shortCode requis" }
);
