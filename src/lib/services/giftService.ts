import { MealGiftStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import {
  generateGiftShortCode,
  generateShortCode,
  signGiftToken,
} from "@/lib/qr";
import { normalizePhone } from "@/lib/phone";
import { subscriptionService } from "@/lib/services/subscriptionService";

const GIFT_VALIDITY_DAYS = 7;

async function uniqueGiftShortCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = generateGiftShortCode();
    const exists = await prisma.mealGift.findUnique({
      where: { shortCode: code },
    });
    if (!exists) return code;
  }
  return `G${generateShortCode(5)}`;
}

function giftExpiresAt(subscriptionExpiresAt: Date | null): Date {
  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + GIFT_VALIDITY_DAYS);
  inSevenDays.setHours(23, 59, 59, 999);

  if (subscriptionExpiresAt && subscriptionExpiresAt < inSevenDays) {
    return subscriptionExpiresAt;
  }
  return inSevenDays;
}

export type MealGiftWithRelations = Awaited<
  ReturnType<GiftService["getGiftById"]>
>;

export class GiftService {
  async getGiftById(giftId: string) {
    return prisma.mealGift.findUnique({
      where: { id: giftId },
      include: {
        subscription: {
          include: { client: true, formula: true },
        },
      },
    });
  }

  async listPendingGifts(subscriptionId: string) {
    await this.expireOutdatedGifts();
    return prisma.mealGift.findMany({
      where: {
        subscriptionId,
        status: MealGiftStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  async expireOutdatedGifts(): Promise<void> {
    await prisma.mealGift.updateMany({
      where: {
        status: MealGiftStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: { status: MealGiftStatus.EXPIRED },
    });
  }

  async createGift(
    senderPhone: string,
    subscriptionId: string,
    recipientPhoneRaw: string
  ) {
    const recipientPhone = normalizePhone(recipientPhoneRaw);
    if (recipientPhone === normalizePhone(senderPhone)) {
      throw new AppError(
        "Vous ne pouvez pas vous offrir un repas à vous-même",
        ErrorCodes.INVALID_STATUS,
        400
      );
    }

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

    if (sub.client.phone !== normalizePhone(senderPhone)) {
      throw new AppError("Non autorisé", ErrorCodes.UNAUTHORIZED, 403);
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new AppError(
        "Abonnement non actif",
        ErrorCodes.NOT_ACTIVE,
        400
      );
    }

    if (sub.expiresAt && sub.expiresAt < new Date()) {
      throw new AppError("Abonnement expiré", ErrorCodes.EXPIRED, 400);
    }

    if (subscriptionService.mealsRemaining(sub) <= 0) {
      throw new AppError(
        "Plus de repas disponibles",
        ErrorCodes.NO_MEALS_LEFT,
        400
      );
    }

    const shortCode = await uniqueGiftShortCode();
    const expiresAt = giftExpiresAt(sub.expiresAt);

    const gift = await prisma.$transaction(async (tx) => {
      const fresh = await tx.subscription.findUnique({
        where: { id: subscriptionId },
      });
      if (!fresh || subscriptionService.mealsRemaining(fresh) <= 0) {
        throw new AppError(
          "Plus de repas disponibles",
          ErrorCodes.NO_MEALS_LEFT,
          400
        );
      }

      const created = await tx.mealGift.create({
        data: {
          subscriptionId,
          recipientPhone,
          shortCode,
          giftToken: "pending",
          expiresAt,
        },
      });

      const giftToken = signGiftToken(created.id);
      return tx.mealGift.update({
        where: { id: created.id },
        data: { giftToken },
        include: {
          subscription: {
            include: { client: true, formula: true },
          },
        },
      });
    });

    return gift;
  }
}

export const giftService = new GiftService();
