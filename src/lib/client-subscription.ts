import { prisma } from "@/lib/db";
import { SubscriptionStatus, type Subscription } from "@prisma/client";
import type { Formula, User } from "@prisma/client";

export type ClientSubscription = Subscription & {
  client: User;
  formula: Formula;
};

const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PENDING_PAYMENT,
  SubscriptionStatus.WAITLIST,
];

/** Abonnement prioritaire pour afficher le QR (actif en premier). */
export async function getClientPrimarySubscription(
  phone: string
): Promise<ClientSubscription | null> {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      subscriptions: {
        where: { status: { in: ACTIVE_STATUSES } },
        include: { client: true, formula: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const subs = user?.subscriptions ?? [];
  if (subs.length === 0) return null;

  const active = subs.find((s) => s.status === SubscriptionStatus.ACTIVE);
  if (active) return active;

  const pending = subs.find(
    (s) => s.status === SubscriptionStatus.PENDING_PAYMENT
  );
  if (pending) return pending;

  return subs[0] ?? null;
}

export function clientQrPath(subscriptionId: string): string {
  return `/client/subscription/${subscriptionId}`;
}

export async function getClientQrRedirectPath(phone: string): Promise<string> {
  const sub = await getClientPrimarySubscription(phone);
  if (!sub) return "/client";
  return clientQrPath(sub.id);
}
