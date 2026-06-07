"use server";

import { requireRole } from "@/lib/auth";
import { pushService } from "@/lib/services";
import type { ActionResult } from "./admin";

export async function sendTestPushAction(): Promise<
  ActionResult<{ sent: number }>
> {
  try {
    const session = await requireRole(["STAFF", "ADMIN"]);

    if (!pushService.isConfigured()) {
      return {
        success: false,
        error: "VAPID non configuré sur le serveur (clés manquantes).",
      };
    }

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const result = await pushService.sendToUser(session.user.id, {
      title: "Test alertes JAMILA",
      body: "Si vous voyez ce message, les notifications fonctionnent.",
      url: `${base}/staff`,
    });

    if (result.sent === 0) {
      return {
        success: false,
        error:
          "Aucun appareil enregistré pour votre compte. Touchez « Activer les alertes » puis réessayez.",
      };
    }

    return { success: true, data: { sent: result.sent } };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") {
        return { success: false, error: "Connectez-vous en staff ou admin." };
      }
      return { success: false, error: e.message };
    }
    return { success: false, error: "Envoi test impossible" };
  }
}
