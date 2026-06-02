"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { COOKIE_NAME, signClientPhone } from "@/lib/client-session";
import { AppError } from "@/lib/errors";
import {
  pushService,
  subscriptionService,
  whatsappService,
} from "@/lib/services";
import { selfServiceSubscriptionSchema } from "@/lib/validators/subscription";
import {
  generateQrDataUrl,
  generateQrPngBuffer,
  getSubscriptionQrUrl,
} from "@/lib/qr-display";
import { SubscriptionStatus } from "@prisma/client";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function subscribeSelfService(
  formData: FormData
): Promise<ActionResult<{ subscriptionId: string }>> {
  try {
    const raw = {
      formulaId: formData.get("formulaId") as string,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      cguAccepted: formData.get("cguAccepted") === "on" || formData.get("cguAccepted") === "true",
    };
    const parsed = selfServiceSubscriptionSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    const sub = await subscriptionService.createSelfServiceSubscription(
      parsed.data
    );

    const token = signClientPhone(parsed.data.phone);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    void pushService.sendToAdmins({
      title: "Nouvelle souscription",
      body: `${sub.client.name} — ${sub.formula.name} (${sub.status})`,
      url: `${base}/admin/subscriptions/${sub.id}`,
    });

    revalidatePath("/");
    return { success: true, data: { subscriptionId: sub.id } };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    console.error(e);
    return { success: false, error: "Erreur lors de la souscription" };
  }
}

type ActiveQrSubscriptionResult =
  | { ok: true; sub: NonNullable<Awaited<ReturnType<typeof subscriptionService.getById>>> }
  | { ok: false; error: string };

async function getActiveSubscriptionForQr(
  subscriptionId: string
): Promise<ActiveQrSubscriptionResult> {
  const sub = await subscriptionService.getById(subscriptionId);
  if (!sub) return { ok: false, error: "Abonnement introuvable" };
  if (sub.status !== SubscriptionStatus.ACTIVE || sub.qrToken === "pending") {
    return {
      ok: false,
      error: "Le QR n'est disponible qu'après activation de l'abonnement",
    };
  }
  return { ok: true, sub };
}

export async function getWhatsAppLinkForSubscription(
  subscriptionId: string
): Promise<ActionResult<{ url: string }>> {
  try {
    const active = await getActiveSubscriptionForQr(subscriptionId);
    if (!active.ok) return { success: false, error: active.error };
    const { sub } = active;

    const qrLink = getSubscriptionQrUrl(sub.id);
    const url = await whatsappService.getShareLink(sub.client.phone, {
      name: sub.client.name,
      qrLink,
      formulaName: sub.formula.name,
      shortCode: sub.shortCode,
    });
    return { success: true, data: { url } };
  } catch {
    return { success: false, error: "Impossible de générer le lien" };
  }
}

export type WhatsAppQrSharePayload = {
  dataUrl: string;
  filename: string;
  message: string;
  waMeUrl: string;
  cloudApiConfigured: boolean;
};

export async function getWhatsAppQrSharePayload(
  subscriptionId: string
): Promise<ActionResult<WhatsAppQrSharePayload>> {
  try {
    const active = await getActiveSubscriptionForQr(subscriptionId);
    if (!active.ok) return { success: false, error: active.error };
    const { sub } = active;

    const qrLink = getSubscriptionQrUrl(sub.id);
    const message = await whatsappService.buildMessage({
      name: sub.client.name,
      qrLink,
      formulaName: sub.formula.name,
      shortCode: sub.shortCode,
    });
    const dataUrl = await generateQrDataUrl(sub.qrToken);
    const filename = `jamila-qr-${sub.shortCode}.png`;
    const waMeUrl = whatsappService.buildWaMeLink(sub.client.phone, message);

    return {
      success: true,
      data: {
        dataUrl,
        filename,
        message,
        waMeUrl,
        cloudApiConfigured: whatsappService.isCloudApiConfigured(),
      },
    };
  } catch {
    return { success: false, error: "Impossible de préparer le QR" };
  }
}

/** Envoi automatique du QR en image si l'API WhatsApp Cloud est configurée */
export async function sendWhatsAppQrImage(
  subscriptionId: string
): Promise<ActionResult<{ method: "api" }>> {
  try {
    const active = await getActiveSubscriptionForQr(subscriptionId);
    if (!active.ok) return { success: false, error: active.error };
    const { sub } = active;

    if (!whatsappService.isCloudApiConfigured()) {
      return {
        success: false,
        error: "API WhatsApp non configurée — utilisez le partage manuel",
      };
    }

    const qrLink = getSubscriptionQrUrl(sub.id);
    const caption = await whatsappService.buildMessage({
      name: sub.client.name,
      qrLink,
      formulaName: sub.formula.name,
      shortCode: sub.shortCode,
    });
    const png = await generateQrPngBuffer(sub.qrToken);
    const result = await whatsappService.sendImageMessage(
      sub.client.phone,
      png,
      caption
    );

    if (!result.sent) {
      return { success: false, error: result.error };
    }
    return { success: true, data: { method: "api" } };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Échec de l'envoi WhatsApp" };
  }
}
