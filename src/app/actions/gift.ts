"use server";

import { revalidatePath } from "next/cache";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { AppError } from "@/lib/errors";
import { giftService, whatsappService } from "@/lib/services";
import { generateQrPngBuffer } from "@/lib/qr-display";
import { phoneSchema } from "@/lib/phone";
import { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const createGiftSchema = z.object({
  subscriptionId: z.string().cuid(),
  recipientPhone: phoneSchema,
});

export async function createMealGift(
  formData: FormData
): Promise<
  ActionResult<{
    giftId: string;
    shortCode: string;
    autoSent: boolean;
    waMeUrl?: string;
  }>
> {
  try {
    const senderPhone = await getClientPhoneFromCookies();
    if (!senderPhone) {
      return { success: false, error: "Connectez-vous pour offrir un repas" };
    }

    const parsed = createGiftSchema.safeParse({
      subscriptionId: formData.get("subscriptionId"),
      recipientPhone: formData.get("recipientPhone"),
    });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    const gift = await giftService.createGift(
      senderPhone,
      parsed.data.subscriptionId,
      parsed.data.recipientPhone
    );

    const caption = await whatsappService.buildGiftMessage({
      senderName: gift.subscription.client.name,
      shortCode: gift.shortCode,
    });

    let autoSent = false;
    let waMeUrl: string | undefined;

    if (whatsappService.isCloudApiConfigured()) {
      const png = await generateQrPngBuffer(gift.giftToken);
      const result = await whatsappService.sendImageMessage(
        gift.recipientPhone,
        png,
        caption,
        { giftId: gift.id }
      );
      if (result.sent) {
        autoSent = true;
      } else {
        waMeUrl = whatsappService.buildWaMeLink(gift.recipientPhone, caption);
      }
    } else {
      waMeUrl = whatsappService.buildWaMeLink(gift.recipientPhone, caption);
    }

    revalidatePath("/client");
    revalidatePath("/client/qr");
    revalidatePath(`/client/subscription/${parsed.data.subscriptionId}`);

    return {
      success: true,
      data: {
        giftId: gift.id,
        shortCode: gift.shortCode,
        autoSent,
        waMeUrl,
      },
    };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    console.error(e);
    return { success: false, error: "Impossible d'offrir ce repas" };
  }
}
