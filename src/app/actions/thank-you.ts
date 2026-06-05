"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildThankYouPreviewMessage,
  getFirstSubscriptionSample,
  getThankYouSubscriptionCount,
  recordThankYouCampaign,
  sendThankYouBatch,
  whatsappService,
} from "@/lib/services";
import { getAppSettings } from "@/lib/settings";
import { z } from "zod";
import type { ActionResult } from "./admin";

const driveUrlSchema = z
  .string()
  .url("URL invalide")
  .refine((url) => url.startsWith("https://"), "L'URL doit commencer par https://")
  .refine(
    (url) => {
      try {
        const host = new URL(url).hostname;
        return (
          host === "drive.google.com" ||
          host.endsWith(".drive.google.com") ||
          host === "docs.google.com" ||
          host.endsWith(".docs.google.com")
        );
      } catch {
        return false;
      }
    },
    "Utilisez un lien Google Drive ou Google Docs"
  );

const thankYouSettingsSchema = z.object({
  thankYouMessageTemplate: z
    .string()
    .min(20, "Le message doit contenir au moins 20 caractères"),
  thankYouDriveUrl: z.union([driveUrlSchema, z.literal("")]),
});

export async function updateThankYouSettingsAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN"]);
    const raw = {
      thankYouMessageTemplate: formData.get("thankYouMessageTemplate"),
      thankYouDriveUrl: formData.get("thankYouDriveUrl"),
    };
    const parsed = thankYouSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    await prisma.appSettings.update({
      where: { id: "singleton" },
      data: parsed.data,
    });
    revalidatePath("/admin/thank-you");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") return { success: false, error: "Session expirée" };
      if (e.message === "FORBIDDEN") return { success: false, error: "Accès refusé" };
      return { success: false, error: e.message };
    }
    return { success: false, error: "Erreur paramètres remerciements" };
  }
}

export async function getThankYouPreviewAction(): Promise<
  ActionResult<{ message: string; sampleName: string; sampleFormula: string }>
> {
  try {
    await requireRole(["ADMIN"]);
    const settings = await getAppSettings();
    const sample = await getFirstSubscriptionSample();
    const message = buildThankYouPreviewMessage(settings, sample);
    return {
      success: true,
      data: {
        message,
        sampleName: sample?.name ?? "Marie Dupont",
        sampleFormula: sample?.formulaName ?? "Confort",
      },
    };
  } catch (e) {
    if (e instanceof Error) return { success: false, error: e.message };
    return { success: false, error: "Impossible de générer l'aperçu" };
  }
}

export type ThankYouBatchActionResult = {
  total: number;
  processed: number;
  sent: number;
  failed: number;
  failures: { subscriptionId: string; name: string; phone: string; error: string }[];
  hasMore: boolean;
  nextOffset: number;
  campaignComplete: boolean;
};

export async function sendThankYouBatchAction(
  offset: number,
  limit: number,
  campaignSentSoFar: number
): Promise<ActionResult<ThankYouBatchActionResult>> {
  try {
    await requireRole(["ADMIN"]);
    const result = await sendThankYouBatch({ offset, limit });

    let campaignComplete = !result.hasMore;
    if (campaignComplete) {
      await recordThankYouCampaign(campaignSentSoFar + result.sent);
      revalidatePath("/admin/thank-you");
    }

    return {
      success: true,
      data: {
        ...result,
        campaignComplete,
      },
    };
  } catch (e) {
    if (e instanceof Error) return { success: false, error: e.message };
    return { success: false, error: "Erreur lors de l'envoi" };
  }
}

export async function getThankYouPageData(): Promise<{
  settings: Awaited<ReturnType<typeof getAppSettings>>;
  subscriptionCount: number;
  whatsappConfigured: boolean;
  whatsappProvider: string | null;
}> {
  await requireRole(["ADMIN"]);
  const [settings, subscriptionCount] = await Promise.all([
    getAppSettings(),
    getThankYouSubscriptionCount(),
  ]);
  return {
    settings,
    subscriptionCount,
    whatsappConfigured: whatsappService.isCloudApiConfigured(),
    whatsappProvider: whatsappService.getProviderName(),
  };
}
