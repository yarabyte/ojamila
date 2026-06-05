import type { AppSettings, Formula, Subscription, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import { whatsappService } from "./whatsappService";

export type ThankYouSubscription = Subscription & {
  client: User;
  formula: Formula;
};

export type ThankYouBatchFailure = {
  subscriptionId: string;
  name: string;
  phone: string;
  error: string;
};

export type ThankYouBatchResult = {
  total: number;
  processed: number;
  sent: number;
  failed: number;
  failures: ThankYouBatchFailure[];
  hasMore: boolean;
  nextOffset: number;
};

const SEND_DELAY_MS = 600;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildThankYouMessage(
  settings: Pick<AppSettings, "thankYouMessageTemplate" | "thankYouDriveUrl">,
  sub: ThankYouSubscription
): string {
  return settings.thankYouMessageTemplate
    .replace(/\{\{name\}\}/g, sub.client.name)
    .replace(/\{\{driveLink\}\}/g, settings.thankYouDriveUrl)
    .replace(/\{\{formulaName\}\}/g, sub.formula.name);
}

export function buildThankYouPreviewMessage(
  settings: Pick<AppSettings, "thankYouMessageTemplate" | "thankYouDriveUrl">,
  sample?: { name: string; formulaName: string }
): string {
  const name = sample?.name ?? "Marie Dupont";
  const formulaName = sample?.formulaName ?? "Confort";
  return settings.thankYouMessageTemplate
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{driveLink\}\}/g, settings.thankYouDriveUrl || "https://drive.google.com/…")
    .replace(/\{\{formulaName\}\}/g, formulaName);
}

export async function getThankYouSubscriptionCount(): Promise<number> {
  return prisma.subscription.count();
}

export async function sendThankYouBatch(options: {
  offset: number;
  limit: number;
}): Promise<ThankYouBatchResult> {
  if (!whatsappService.isCloudApiConfigured()) {
    throw new Error(
      "Configurez Wasender (ou un autre fournisseur WhatsApp) pour l'envoi groupé."
    );
  }

  const settings = await getAppSettings();
  if (!settings.thankYouDriveUrl.trim()) {
    throw new Error("Le lien Google Drive est obligatoire avant l'envoi.");
  }

  const { offset, limit } = options;
  const total = await prisma.subscription.count();

  const subs = await prisma.subscription.findMany({
    include: { client: true, formula: true },
    orderBy: { createdAt: "asc" },
    skip: offset,
    take: limit,
  });

  let sent = 0;
  let failed = 0;
  const failures: ThankYouBatchFailure[] = [];

  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    const message = buildThankYouMessage(settings, sub);
    const delivery = await whatsappService.sendMessage(sub.client.phone, message);

    if (delivery.sent) {
      sent++;
    } else {
      failed++;
      failures.push({
        subscriptionId: sub.id,
        name: sub.client.name,
        phone: sub.client.phone,
        error: delivery.method === "wa.me" ? "Envoi API indisponible" : "Échec d'envoi",
      });
    }

    if (i < subs.length - 1) {
      await sleep(SEND_DELAY_MS);
    }
  }

  const processed = offset + subs.length;
  const hasMore = processed < total;

  return {
    total,
    processed,
    sent,
    failed,
    failures,
    hasMore,
    nextOffset: hasMore ? processed : total,
  };
}

export async function recordThankYouCampaign(sentCount: number): Promise<void> {
  await prisma.appSettings.update({
    where: { id: "singleton" },
    data: {
      thankYouLastSentAt: new Date(),
      thankYouLastSentCount: sentCount,
    },
  });
}

export async function getFirstSubscriptionSample(): Promise<
  { name: string; formulaName: string } | undefined
> {
  const sub = await prisma.subscription.findFirst({
    include: { client: true, formula: true },
    orderBy: { createdAt: "asc" },
  });
  if (!sub) return undefined;
  return { name: sub.client.name, formulaName: sub.formula.name };
}
