import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { verifyQrToken } from "@/lib/qr";
import { getAppSettings } from "@/lib/settings";
import { subscriptionService } from "@/lib/services/subscriptionService";

const IDEMPOTENCY_WINDOW_MS = 5000;

const recentScans = new Map<string, number>();

function checkIdempotency(subscriptionId: string): void {
  const last = recentScans.get(subscriptionId);
  const now = Date.now();
  if (last && now - last < IDEMPOTENCY_WINDOW_MS) {
    throw new AppError(
      "Scan déjà enregistré — attendez quelques secondes",
      ErrorCodes.DUPLICATE_SCAN,
      429
    );
  }
  recentScans.set(subscriptionId, now);
  if (recentScans.size > 500) {
    const cutoff = now - IDEMPOTENCY_WINDOW_MS * 2;
    recentScans.forEach((ts, key) => {
      if (ts < cutoff) recentScans.delete(key);
    });
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export type ScanPreview = {
  subscriptionId: string;
  clientName: string;
  formulaName: string;
  mealsRemaining: number;
  totalMeals: number;
  mealsConsumed: number;
  status: SubscriptionStatus;
  expiresAt: Date | null;
  canConsume: boolean;
  blockReason?: string;
};

export type ConsumeResult = {
  success: true;
  mealsRemaining: number;
  consumedAt: Date;
};

export class ConsumptionService {
  async resolveSubscriptionId(params: {
    qrToken?: string;
    shortCode?: string;
    subscriptionId?: string;
  }): Promise<string> {
    if (params.subscriptionId) return params.subscriptionId;

    if (params.qrToken) {
      try {
        return verifyQrToken(params.qrToken);
      } catch {
        const sub = await prisma.subscription.findUnique({
          where: { qrToken: params.qrToken },
        });
        if (sub) return sub.id;
        throw new AppError("QR invalide", ErrorCodes.INVALID_QR, 400);
      }
    }

    if (params.shortCode) {
      const sub = await prisma.subscription.findUnique({
        where: { shortCode: params.shortCode.toUpperCase() },
      });
      if (!sub) {
        throw new AppError(
          "Code introuvable",
          ErrorCodes.SUBSCRIPTION_NOT_FOUND,
          404
        );
      }
      return sub.id;
    }

    throw new AppError("Identifiant requis", ErrorCodes.INVALID_QR, 400);
  }

  async getDailyLimit(
    formulaDailyLimit: number | null,
    settingsDefault: number
  ): Promise<number> {
    return formulaDailyLimit ?? settingsDefault;
  }

  async validateForConsumption(subscriptionId: string): Promise<{
    blockReason?: string;
    canConsume: boolean;
  }> {
    await subscriptionService.expireOutdatedSubscriptions();

    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { formula: true },
    });

    if (!sub) {
      return { canConsume: false, blockReason: "Abonnement introuvable" };
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      const messages: Partial<Record<SubscriptionStatus, string>> = {
        PENDING_PAYMENT: "Paiement en attente à la caisse",
        WAITLIST: "En liste d'attente",
        EXPIRED: "Abonnement expiré",
        CANCELLED: "Abonnement annulé",
      };
      return {
        canConsume: false,
        blockReason: messages[sub.status] ?? "Abonnement non actif",
      };
    }

    if (sub.expiresAt && sub.expiresAt < new Date()) {
      return { canConsume: false, blockReason: "Abonnement expiré" };
    }

    const remaining = subscriptionService.mealsRemaining(sub);
    if (remaining <= 0) {
      return { canConsume: false, blockReason: "Solde de repas épuisé" };
    }

    const settings = await getAppSettings();
    const dailyLimit = await this.getDailyLimit(
      sub.formula.dailyMealLimit,
      settings.dailyMealLimitDefault
    );

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todayCount = await prisma.consumption.count({
      where: {
        subscriptionId: sub.id,
        consumedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    if (todayCount >= dailyLimit) {
      return {
        canConsume: false,
        blockReason: `Limite quotidienne atteinte (${dailyLimit} repas/jour)`,
      };
    }

    return { canConsume: true };
  }

  async lookupForScan(params: {
    qrToken?: string;
    shortCode?: string;
  }): Promise<ScanPreview> {
    const subscriptionId = await this.resolveSubscriptionId(params);
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { client: true, formula: true },
    });

    if (!sub) {
      throw new AppError(
        "Abonnement introuvable",
        ErrorCodes.SUBSCRIPTION_NOT_FOUND,
        404
      );
    }

    const validation = await this.validateForConsumption(subscriptionId);
    const mealsRemaining = subscriptionService.mealsRemaining(sub);

    return {
      subscriptionId: sub.id,
      clientName: sub.client.name,
      formulaName: sub.formula.name,
      mealsRemaining,
      totalMeals: sub.totalMeals,
      mealsConsumed: sub.mealsConsumed,
      status: sub.status,
      expiresAt: sub.expiresAt,
      canConsume: validation.canConsume,
      blockReason: validation.blockReason,
    };
  }

  async consumeMeal(
    params: {
      qrToken?: string;
      shortCode?: string;
      subscriptionId?: string;
    },
    servedById: string
  ): Promise<ConsumeResult> {
    const subscriptionId = await this.resolveSubscriptionId(params);
    checkIdempotency(subscriptionId);
    const settings = await getAppSettings();

    return prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
        include: { formula: true, client: true },
      });

      if (!sub) {
        throw new AppError(
          "Abonnement introuvable",
          ErrorCodes.SUBSCRIPTION_NOT_FOUND,
          404
        );
      }

      if (sub.status === SubscriptionStatus.EXPIRED) {
        throw new AppError("Abonnement expiré", ErrorCodes.EXPIRED, 400);
      }

      if (sub.expiresAt && sub.expiresAt < new Date()) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
        throw new AppError("Abonnement expiré", ErrorCodes.EXPIRED, 400);
      }

      if (sub.status !== SubscriptionStatus.ACTIVE) {
        throw new AppError(
          "Abonnement non actif",
          ErrorCodes.NOT_ACTIVE,
          400
        );
      }

      const remaining = subscriptionService.mealsRemaining(sub);
      if (remaining <= 0) {
        throw new AppError("Solde épuisé", ErrorCodes.NO_MEALS_LEFT, 400);
      }

      const dailyLimit =
        sub.formula.dailyMealLimit ?? settings.dailyMealLimitDefault;
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      const todayCount = await tx.consumption.count({
        where: {
          subscriptionId: sub.id,
          consumedAt: { gte: todayStart, lte: todayEnd },
        },
      });

      if (todayCount >= dailyLimit) {
        throw new AppError(
          `Limite quotidienne atteinte (${dailyLimit}/jour)`,
          ErrorCodes.DAILY_LIMIT_REACHED,
          400
        );
      }

      const consumedAt = new Date();
      await tx.consumption.create({
        data: {
          subscriptionId: sub.id,
          servedById,
          consumedAt,
        },
      });

      const updated = await tx.subscription.update({
        where: { id: sub.id },
        data: { mealsConsumed: { increment: 1 } },
      });

      return {
        success: true,
        mealsRemaining: subscriptionService.mealsRemaining(updated),
        consumedAt,
      };
    });
  }
}

export const consumptionService = new ConsumptionService();
