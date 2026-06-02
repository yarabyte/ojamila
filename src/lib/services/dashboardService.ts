import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";

export async function getDashboardStats() {
  const settings = await getAppSettings();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [formulas, consumptionsTotal, recentSubs, subscriptionCount] =
    await Promise.all([
      prisma.formula.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.consumption.count(),
      prisma.subscription.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.subscription.count({
        where: {
          status: {
            in: [
              SubscriptionStatus.ACTIVE,
              SubscriptionStatus.PENDING_PAYMENT,
              SubscriptionStatus.WAITLIST,
            ],
          },
        },
      }),
    ]);

  const dailyChart = buildDailyChart(
    recentSubs.map((s) => ({ createdAt: s.createdAt, _count: 1 }))
  );

  let fundsCollected = 0;
  let mealsRemaining = 0;
  let mealsConsumed = 0;

  const byFormula = await Promise.all(
    formulas.map(async (f) => {
      const paidSubs = await prisma.subscription.findMany({
        where: {
          formulaId: f.id,
          status: SubscriptionStatus.ACTIVE,
        },
      });
      const activeCount = paidSubs.length;
      const waitlistCount = await prisma.subscription.count({
        where: { formulaId: f.id, status: SubscriptionStatus.WAITLIST },
      });

      const formulaRevenue = paidSubs.length * f.priceFcfa;
      fundsCollected += formulaRevenue;

      const activeSubsFormula = await prisma.subscription.findMany({
        where: { formulaId: f.id, status: SubscriptionStatus.ACTIVE },
      });
      const consumed = activeSubsFormula.reduce((s, sub) => s + sub.mealsConsumed, 0);
      const remaining = activeSubsFormula.reduce(
        (s, sub) => s + (sub.totalMeals - sub.mealsConsumed),
        0
      );
      mealsConsumed += consumed;
      mealsRemaining += remaining;

      return {
        formulaId: f.id,
        name: f.name,
        activeCount,
        waitlistCount,
        salesTarget: f.salesTarget,
        hardCap: f.hardCap,
        priceFcfa: f.priceFcfa,
      };
    })
  );

  const subscriberCount = await prisma.subscription.groupBy({
    by: ["clientId"],
    where: {
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PENDING_PAYMENT,
          SubscriptionStatus.WAITLIST,
        ],
      },
    },
  });

  return {
    fundsCollected,
    fundsFinitions: Math.round(fundsCollected * 0.8),
    fundsReserve: Math.round(fundsCollected * 0.2),
    fundraisingGoal: settings.fundraisingGoalFcfa,
    subscriberCount: subscriberCount.length,
    subscriptionCount,
    mealsConsumed,
    mealsRemaining,
    consumptionsTotal,
    byFormula,
    dailyChart,
  };
}

function buildDailyChart(
  rows: { createdAt: Date; _count: number }[]
): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}
