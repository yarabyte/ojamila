import { SubscriptionStatus } from "@prisma/client";
import { pushService } from "./pushService";
import type { SubscriptionWithRelations } from "./subscriptionService";

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

export async function notifyStaffNewSubscription(
  sub: Pick<SubscriptionWithRelations, "id" | "status" | "client" | "formula">
): Promise<void> {
  if (!pushService.isConfigured()) return;

  const base = appBaseUrl();
  let title: string;
  let body: string;
  let url: string;

  switch (sub.status) {
    case SubscriptionStatus.PENDING_PAYMENT:
      title = "Paiement à encaisser";
      body = `${sub.client.name} — formule ${sub.formula.name}. Confirmer les espèces en caisse.`;
      url = `${base}/staff/pending`;
      break;
    case SubscriptionStatus.WAITLIST:
      title = "Liste d'attente";
      body = `${sub.client.name} — ${sub.formula.name}. Une place s'est libérée ?`;
      url = `${base}/staff/waitlist`;
      break;
    case SubscriptionStatus.ACTIVE:
      title = "Nouvelle souscription active";
      body = `${sub.client.name} — ${sub.formula.name}`;
      url = `${base}/staff/subscribe/done/${sub.id}`;
      break;
    default:
      title = "Nouvelle souscription";
      body = `${sub.client.name} — ${sub.formula.name} (${sub.status})`;
      url = `${base}/admin/subscriptions/${sub.id}`;
  }

  await pushService.sendToStaffAndAdmins({ title, body, url });
}

export async function notifyClientWaitlistPromotion(
  sub: Pick<SubscriptionWithRelations, "id" | "client" | "formula">
): Promise<void> {
  if (!pushService.isConfigured()) return;

  const base = appBaseUrl();
  await pushService.sendToUser(sub.client.id, {
    title: "Place disponible — JAMILA",
    body: `Bonjour ${sub.client.name}, une place s'est libérée pour ${sub.formula.name}. Présentez-vous à la caisse.`,
    url: `${base}/subscribe/confirmation/${sub.id}`,
  });
}
