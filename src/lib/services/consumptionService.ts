import { MealGiftStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { decodeQrPayload, verifyGiftToken, verifyQrToken } from "@/lib/qr";
import { getAppSettings } from "@/lib/settings";
import { giftService } from "@/lib/services/giftService";
import { subscriptionService } from "@/lib/services/subscriptionService";

const IDEMPOTENCY_WINDOW_MS = 5000;

const recentScans = new Map<string, number>();

function checkIdempotency(key: string): void {
  const last = recentScans.get(key);
  const now = Date.now();
  if (last && now - last < IDEMPOTENCY_WINDOW_MS) {
    throw new AppError(
      "Scan déjà enregistré — attendez quelques secondes",
      ErrorCodes.DUPLICATE_SCAN,
      429
    );
  }
  recentScans.set(key, now);
  if (recentScans.size > 500) {
    const cutoff = now - IDEMPOTENCY_WINDOW_MS * 2;
    recentScans.forEach((ts, k) => {
      if (ts < cutoff) recentScans.delete(k);
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
  giftId?: string;
  isGift?: boolean;
  clientName: string;
  senderName?: string;
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
  isGift?: boolean;
};

type ScanTarget =
  | { type: "subscription"; subscriptionId: string }
  | { type: "gift"; giftId: string };

export class ConsumptionService {
  async resolveScanTarget(params: {
    qrToken?: string;
    shortCode?: string;
    subscriptionId?: string;
    giftId?: string;
  }): Promise<ScanTarget> {
    if (params.giftId) {
      return { type: "gift", giftId: params.giftId };
    }

    if (params.subscriptionId) {
      return { type: "subscription", subscriptionId: params.subscriptionId };
    }

    if (params.qrToken) {
      const decoded = decodeQrPayload(params.qrToken);
      if (decoded?.type === "gift") {
        return { type: "gift", giftId: decoded.id };
      }
      if (decoded?.type === "subscription") {
        return { type: "subscription", subscriptionId: decoded.id };
      }

      try {
        return { type: "gift", giftId: verifyGiftToken(params.qrToken) };
      } catch {
        try {
          return {
            type: "subscription",
            subscriptionId: verifyQrToken(params.qrToken),
          };
        } catch {
          const gift = await prisma.mealGift.findUnique({
            where: { giftToken: params.qrToken },
          });
          if (gift) return { type: "gift", giftId: gift.id };

          const sub = await prisma.subscription.findUnique({
            where: { qrToken: params.qrToken },
          });
          if (sub) {
            return { type: "subscription", subscriptionId: sub.id };
          }
          throw new AppError("QR invalide", ErrorCodes.INVALID_QR, 400);
        }
      }
    }

    if (params.shortCode) {
      const code = params.shortCode.toUpperCase();
      if (code.startsWith("G")) {
        const gift = await prisma.mealGift.findUnique({
          where: { shortCode: code },
        });
        if (gift) return { type: "gift", giftId: gift.id };
      }

      const sub = await prisma.subscription.findUnique({
        where: { shortCode: code },
      });
      if (!sub) {
        throw new AppError(
          "Code introuvable",
          ErrorCodes.SUBSCRIPTION_NOT_FOUND,
          404
        );
      }
      return { type: "subscription", subscriptionId: sub.id };
    }

    throw new AppError("Identifiant requis", ErrorCodes.INVALID_QR, 400);
  }

  /** @deprecated utiliser resolveScanTarget */
  async resolveSubscriptionId(params: {
    qrToken?: string;
    shortCode?: string;
    subscriptionId?: string;
  }): Promise<string> {
    const target = await this.resolveScanTarget(params);
    if (target.type === "gift") {
      const gift = await giftService.getGiftById(target.giftId);
      if (!gift) {
        throw new AppError("Repas offert introuvable", ErrorCodes.GIFT_NOT_FOUND, 404);
      }
      return gift.subscriptionId;
    }
    return target.subscriptionId;
  }

  async getDailyLimit(
    formulaDailyLimit: number | null,
    settingsDefault: number
  ): Promise<number> {
    return formulaDailyLimit ?? settingsDefault;
  }

  async validateGiftForConsumption(giftId: string): Promise<{
    blockReason?: string;
    canConsume: boolean;
  }> {
    await giftService.expireOutdatedGifts();
    await subscriptionService.expireOutdatedSubscriptions();

    const gift = await giftService.getGiftById(giftId);
    if (!gift) {
      return { canConsume: false, blockReason: "Repas offert introuvable" };
    }

    if (gift.status === MealGiftStatus.CONSUMED) {
      return { canConsume: false, blockReason: "Ce repas a déjà été utilisé" };
    }

    if (gift.status === MealGiftStatus.CANCELLED) {
      return { canConsume: false, blockReason: "Repas offert annulé" };
    }

    if (
      gift.status === MealGiftStatus.EXPIRED ||
      gift.expiresAt < new Date()
    ) {
      return { canConsume: false, blockReason: "Repas offert expiré" };
    }

    if (gift.status !== MealGiftStatus.PENDING) {
      return { canConsume: false, blockReason: "Repas offert non valide" };
    }

    const sub = gift.subscription;
    if (sub.status !== SubscriptionStatus.ACTIVE) {
      return {
        canConsume: false,
        blockReason: "Abonnement de l'offrant non actif",
      };
    }

    if (sub.expiresAt && sub.expiresAt < new Date()) {
      return {
        canConsume: false,
        blockReason: "Abonnement de l'offrant expiré",
      };
    }

    if (subscriptionService.mealsRemaining(sub) <= 0) {
      return {
        canConsume: false,
        blockReason: "Solde de l'offrant épuisé",
      };
    }

    return { canConsume: true };
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
    const target = await this.resolveScanTarget(params);

    if (target.type === "gift") {
      const gift = await giftService.getGiftById(target.giftId);
      if (!gift) {
        throw new AppError(
          "Repas offert introuvable",
          ErrorCodes.GIFT_NOT_FOUND,
          404
        );
      }

      const validation = await this.validateGiftForConsumption(gift.id);
      const sub = gift.subscription;

      return {
        subscriptionId: sub.id,
        giftId: gift.id,
        isGift: true,
        clientName: `Repas offert`,
        senderName: sub.client.name,
        formulaName: sub.formula.name,
        mealsRemaining: validation.canConsume ? 1 : 0,
        totalMeals: 1,
        mealsConsumed: gift.status === MealGiftStatus.CONSUMED ? 1 : 0,
        status: sub.status,
        expiresAt: gift.expiresAt,
        canConsume: validation.canConsume,
        blockReason: validation.blockReason,
      };
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: target.subscriptionId },
      include: { client: true, formula: true },
    });

    if (!sub) {
      throw new AppError(
        "Abonnement introuvable",
        ErrorCodes.SUBSCRIPTION_NOT_FOUND,
        404
      );
    }

    const validation = await this.validateForConsumption(target.subscriptionId);
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
      giftId?: string;
    },
    servedById: string
  ): Promise<ConsumeResult> {
    const target = await this.resolveScanTarget(params);

    if (target.type === "gift") {
      return this.consumeGift(target.giftId, servedById);
    }

    const subscriptionId = target.subscriptionId;
    checkIdempotency(`sub:${subscriptionId}`);
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

  async consumeGift(
    giftId: string,
    servedById: string
  ): Promise<ConsumeResult> {
    checkIdempotency(`gift:${giftId}`);
    await giftService.expireOutdatedGifts();

    return prisma.$transaction(async (tx) => {
      const gift = await tx.mealGift.findUnique({
        where: { id: giftId },
        include: {
          subscription: { include: { formula: true, client: true } },
        },
      });

      if (!gift) {
        throw new AppError(
          "Repas offert introuvable",
          ErrorCodes.GIFT_NOT_FOUND,
          404
        );
      }

      if (gift.status === MealGiftStatus.CONSUMED) {
        throw new AppError(
          "Ce repas a déjà été utilisé",
          ErrorCodes.GIFT_ALREADY_USED,
          400
        );
      }

      if (
        gift.status === MealGiftStatus.EXPIRED ||
        gift.expiresAt < new Date()
      ) {
        await tx.mealGift.update({
          where: { id: gift.id },
          data: { status: MealGiftStatus.EXPIRED },
        });
        throw new AppError("Repas offert expiré", ErrorCodes.GIFT_EXPIRED, 400);
      }

      if (gift.status !== MealGiftStatus.PENDING) {
        throw new AppError(
          "Repas offert non valide",
          ErrorCodes.GIFT_NOT_PENDING,
          400
        );
      }

      const sub = gift.subscription;

      if (sub.status !== SubscriptionStatus.ACTIVE) {
        throw new AppError(
          "Abonnement de l'offrant non actif",
          ErrorCodes.NOT_ACTIVE,
          400
        );
      }

      if (sub.expiresAt && sub.expiresAt < new Date()) {
        throw new AppError(
          "Abonnement de l'offrant expiré",
          ErrorCodes.EXPIRED,
          400
        );
      }

      if (subscriptionService.mealsRemaining(sub) <= 0) {
        throw new AppError(
          "Solde de l'offrant épuisé",
          ErrorCodes.NO_MEALS_LEFT,
          400
        );
      }

      const consumedAt = new Date();
      const consumption = await tx.consumption.create({
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

      await tx.mealGift.update({
        where: { id: gift.id },
        data: {
          status: MealGiftStatus.CONSUMED,
          consumedAt,
          consumptionId: consumption.id,
        },
      });

      return {
        success: true,
        mealsRemaining: subscriptionService.mealsRemaining(updated),
        consumedAt,
        isGift: true,
      };
    });
  }
}

export const consumptionService = new ConsumptionService();
