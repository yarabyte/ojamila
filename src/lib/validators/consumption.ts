import { z } from "zod";

export const consumeMealSchema = z.object({
  qrToken: z.string().min(10).optional(),
  shortCode: z.string().min(4).max(8).optional(),
  subscriptionId: z.string().cuid().optional(),
  giftId: z.string().cuid().optional(),
}).refine(
  (data) => data.qrToken || data.shortCode || data.subscriptionId || data.giftId,
  { message: "qrToken, shortCode, subscriptionId ou giftId requis" }
);

export const lookupSubscriptionSchema = z.object({
  qrToken: z.string().min(10).optional(),
  shortCode: z.string().min(4).max(8).optional(),
}).refine(
  (data) => data.qrToken || data.shortCode,
  { message: "qrToken ou shortCode requis" }
);
