"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { formatActionError } from "@/lib/format-action-error";
import {
  pushService,
  subscriptionService,
  whatsappService,
} from "@/lib/services";
import { counterSubscriptionSchema } from "@/lib/validators/subscription";
import { getSubscriptionQrUrl } from "@/lib/qr-display";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function subscribeAtCounter(
  formData: FormData
): Promise<ActionResult<{ subscriptionId: string }>> {
  try {
    const session = await requireRole(["STAFF", "ADMIN"]);
    const raw = {
      formulaId: formData.get("formulaId") as string,
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      cguAccepted: formData.get("cguAccepted") === "on" || formData.get("cguAccepted") === "true",
      markAsPaid: formData.get("markAsPaid") === "on" || formData.get("markAsPaid") === "true",
    };
    const parsed = counterSubscriptionSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Données invalides",
      };
    }

    const sub = await subscriptionService.createCounterSubscription(
      parsed.data,
      session.user.id
    );

    revalidatePath("/staff");
    revalidatePath("/admin");
    return { success: true, data: { subscriptionId: sub.id } };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { success: false, error: "Non autorisé" };
    }
    console.error(e);
    return { success: false, error: "Erreur souscription comptoir" };
  }
}

export async function activateSubscription(
  subscriptionId: string
): Promise<ActionResult> {
  try {
    await requireRole(["STAFF", "ADMIN"]);
    await subscriptionService.activateAfterPayment(subscriptionId);
    revalidatePath("/staff", "layout");
    revalidatePath("/admin", "layout");
    revalidatePath("/staff/pending");
    revalidatePath("/admin/subscriptions");
    return { success: true, data: undefined };
  } catch (e) {
    console.error("activateSubscription", e);
    return { success: false, error: formatActionError(e, "Activation impossible") };
  }
}

export async function promoteWaitlist(
  subscriptionId: string
): Promise<ActionResult<{ whatsappUrl?: string }>> {
  try {
    await requireRole(["STAFF", "ADMIN"]);
    const sub = await subscriptionService.promoteFromWaitlist(subscriptionId);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    void pushService.sendToUser(sub.clientId, {
      title: "Place disponible — JAMILA",
      body: `Bonjour ${sub.client.name}, une place s'est libérée pour ${sub.formula.name}. Présentez-vous à la caisse.`,
      url: `${base}/subscribe/confirmation/${sub.id}`,
    });
    const qrLink = getSubscriptionQrUrl(sub.id);
    const whatsappUrl = await whatsappService.getShareLink(sub.client.phone, {
      name: sub.client.name,
      qrLink,
      formulaName: sub.formula.name,
      shortCode: sub.shortCode,
    });
    revalidatePath("/staff/waitlist");
    revalidatePath("/admin/waitlist");
    return { success: true, data: { whatsappUrl } };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    return { success: false, error: "Promotion impossible" };
  }
}

export async function removeWaitlistEntry(
  subscriptionId: string
): Promise<ActionResult> {
  try {
    await requireRole(["STAFF", "ADMIN"]);
    await subscriptionService.removeFromWaitlist(subscriptionId);
    revalidatePath("/staff/waitlist");
    revalidatePath("/admin/waitlist");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof AppError) return { success: false, error: e.message };
    return { success: false, error: "Suppression impossible" };
  }
}
