import webpush from "web-push";
import { prisma } from "@/lib/db";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function ensureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@ojamila.cm";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export class PushService {
  isConfigured(): boolean {
    return ensureVapid();
  }

  async saveSubscription(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } }
  ) {
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      update: {
        userId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
    });
  }

  async removeSubscription(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  async sendToUser(userId: string, payload: PushPayload) {
    if (!ensureVapid()) return { sent: 0 };

    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    return this.sendToEndpoints(subs, payload);
  }

  async sendToAdmins(payload: PushPayload) {
    if (!ensureVapid()) return { sent: 0 };

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", active: true },
      select: { id: true },
    });

    let sent = 0;
    for (const admin of admins) {
      const result = await this.sendToUser(admin.id, payload);
      sent += result.sent;
    }
    return { sent };
  }

  private async sendToEndpoints(
    subs: { endpoint: string; p256dh: string; auth: string }[],
    payload: PushPayload
  ) {
    let sent = 0;
    const body = JSON.stringify(payload);

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
        sent++;
      } catch (e) {
        console.error("Push failed", sub.endpoint, e);
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: sub.endpoint },
        });
      }
    }
    return { sent };
  }
}

export const pushService = new PushService();
