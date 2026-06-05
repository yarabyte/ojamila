import { prisma } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";

export function isTestPeriodOver(
  testPeriodEndsAt: Date | null | undefined
): boolean {
  if (!testPeriodEndsAt) return false;
  return new Date() >= testPeriodEndsAt;
}

export async function resetPilotData(): Promise<{
  subscriptions: number;
  consumptions: number;
  clients: number;
}> {
  const settings = await getAppSettings();
  if (!isTestPeriodOver(settings.testPeriodEndsAt)) {
    throw new Error("La période de test n'est pas encore terminée");
  }

  return prisma.$transaction(async (tx) => {
    await tx.mealGift.deleteMany();
    const consumptions = await tx.consumption.deleteMany();
    const subscriptions = await tx.subscription.deleteMany();
    await tx.otpChallenge.deleteMany();
    await tx.pushSubscription.deleteMany();
    const clients = await tx.user.deleteMany({ where: { role: "CLIENT" } });
    await tx.appSettings.update({
      where: { id: "singleton" },
      data: { testPeriodEndsAt: null },
    });

    return {
      consumptions: consumptions.count,
      subscriptions: subscriptions.count,
      clients: clients.count,
    };
  });
}
