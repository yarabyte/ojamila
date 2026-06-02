import {
  PaymentMethod,
  Prisma,
  SubscriptionStatus,
  type Formula,
  type Subscription,
  type User,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ErrorCodes } from "@/lib/errors";
import { normalizePhone } from "@/lib/phone";
import { generateShortCode, signQrToken } from "@/lib/qr";
import { getAppSettings } from "@/lib/settings";
import type {
  CounterSubscriptionInput,
  SelfServiceSubscriptionInput,
} from "@/lib/validators/subscription";

export type FormulaAvailability = {
  formulaId: string;
  name: string;
  activeCount: number;
  salesTarget: number;
  hardCap: number;
  remainingSlots: number;
  isAtSalesTarget: boolean;
  isHardCapReached: boolean;
  totalMeals: number;
  priceFcfa: number;
};

export type SubscriptionWithRelations = Subscription & {
  client: User;
  formula: Formula;
};

function totalMealsForFormula(formula: Formula): number {
  return formula.mealsIncluded + formula.bonusMeals;
}

async function uniqueShortCode(
  tx: Prisma.TransactionClient
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateShortCode(6);
    const existing = await tx.subscription.findUnique({
      where: { shortCode: code },
    });
    if (!existing) return code;
  }
  throw new AppError("Impossible de générer un code court", "SHORT_CODE", 500);
}

async function countActiveSubscriptions(
  formulaId: string,
  tx: Prisma.TransactionClient = prisma
): Promise<number> {
  return tx.subscription.count({
    where: { formulaId, status: SubscriptionStatus.ACTIVE },
  });
}

async function nextWaitlistPosition(
  formulaId: string,
  tx: Prisma.TransactionClient
): Promise<number> {
  const max = await tx.subscription.aggregate({
    where: { formulaId, status: SubscriptionStatus.WAITLIST },
    _max: { waitlistPosition: true },
  });
  return (max._max.waitlistPosition ?? 0) + 1;
}

export class SubscriptionService {
  async getFormulaAvailability(
    formulaId: string
  ): Promise<FormulaAvailability> {
    const formula = await prisma.formula.findUnique({ where: { id: formulaId } });
    if (!formula) {
      throw new AppError("Formule introuvable", ErrorCodes.FORMULA_NOT_FOUND, 404);
    }
    if (!formula.active) {
      throw new AppError("Formule inactive", ErrorCodes.FORMULA_INACTIVE, 400);
    }

    const activeCount = await countActiveSubscriptions(formulaId);
    const remainingSlots = Math.max(0, formula.hardCap - activeCount);

    return {
      formulaId: formula.id,
      name: formula.name,
      activeCount,
      salesTarget: formula.salesTarget,
      hardCap: formula.hardCap,
      remainingSlots,
      isAtSalesTarget: activeCount >= formula.salesTarget,
      isHardCapReached: activeCount >= formula.hardCap,
      totalMeals: totalMealsForFormula(formula),
      priceFcfa: formula.priceFcfa,
    };
  }

  async listFormulasAvailability(): Promise<FormulaAvailability[]> {
    const formulas = await prisma.formula.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return Promise.all(
      formulas.map((f) => this.getFormulaAvailability(f.id))
    );
  }

  private async resolveClient(
    tx: Prisma.TransactionClient,
    name: string,
    phone: string,
    cguVersion: string
  ): Promise<User> {
    const normalizedPhone = normalizePhone(phone);
    const now = new Date();

    return tx.user.upsert({
      where: { phone: normalizedPhone },
      create: {
        name,
        phone: normalizedPhone,
        role: "CLIENT",
        cguAcceptedAt: now,
        cguVersion,
      },
      update: {
        name,
        cguAcceptedAt: now,
        cguVersion,
      },
    });
  }

  private async createSubscriptionRecord(
    tx: Prisma.TransactionClient,
    params: {
      clientId: string;
      formula: Formula;
      status: SubscriptionStatus;
      cguVersion: string;
      waitlistPosition?: number;
      activateNow?: boolean;
    }
  ): Promise<Subscription> {
    const settings = await getAppSettings();
    const totalMeals = totalMealsForFormula(params.formula);
    const shortCode = await uniqueShortCode(tx);

    const subscription = await tx.subscription.create({
      data: {
        clientId: params.clientId,
        formulaId: params.formula.id,
        status: params.status,
        totalMeals,
        shortCode,
        qrToken: "pending",
        cguAcceptedAt: new Date(),
        cguVersion: params.cguVersion,
        waitlistPosition: params.waitlistPosition,
        paymentMethod:
          params.status === SubscriptionStatus.ACTIVE
            ? PaymentMethod.CASH
            : null,
        activatedAt: params.activateNow ? new Date() : null,
        expiresAt: params.activateNow
          ? new Date(
              Date.now() +
                (params.formula.validityDays ??
                  settings.validityDaysDefault) *
                  24 *
                  60 *
                  60 *
                  1000
            )
          : null,
      },
    });

    const qrToken = signQrToken(subscription.id);
    return tx.subscription.update({
      where: { id: subscription.id },
      data: { qrToken },
    });
  }

  async createSelfServiceSubscription(
    input: SelfServiceSubscriptionInput
  ): Promise<SubscriptionWithRelations> {
    const settings = await getAppSettings();

    return prisma.$transaction(async (tx) => {
      const formula = await tx.formula.findUnique({
        where: { id: input.formulaId },
      });
      if (!formula || !formula.active) {
        throw new AppError(
          "Formule introuvable ou inactive",
          ErrorCodes.FORMULA_NOT_FOUND,
          404
        );
      }

      const activeCount = await countActiveSubscriptions(formula.id, tx);
      const hardCapReached = activeCount >= formula.hardCap;

      const client = await this.resolveClient(
        tx,
        input.name,
        input.phone,
        settings.cguVersion
      );

      let status: SubscriptionStatus = SubscriptionStatus.PENDING_PAYMENT;
      let waitlistPosition: number | undefined;

      if (hardCapReached) {
        status = SubscriptionStatus.WAITLIST;
        waitlistPosition = await nextWaitlistPosition(formula.id, tx);
      }

      const subscription = await this.createSubscriptionRecord(tx, {
        clientId: client.id,
        formula,
        status,
        cguVersion: settings.cguVersion,
        waitlistPosition,
      });

      return tx.subscription.findUniqueOrThrow({
        where: { id: subscription.id },
        include: { client: true, formula: true },
      });
    });
  }

  async createCounterSubscription(
    input: CounterSubscriptionInput,
    staffId: string
  ): Promise<SubscriptionWithRelations> {
    void staffId; // journalisation staff à brancher (étape 7)
    const settings = await getAppSettings();

    return prisma.$transaction(async (tx) => {
      const formula = await tx.formula.findUnique({
        where: { id: input.formulaId },
      });
      if (!formula || !formula.active) {
        throw new AppError(
          "Formule introuvable",
          ErrorCodes.FORMULA_NOT_FOUND,
          404
        );
      }

      const activeCount = await countActiveSubscriptions(formula.id, tx);
      const hardCapReached = activeCount >= formula.hardCap;

      const client = await this.resolveClient(
        tx,
        input.name,
        input.phone,
        settings.cguVersion
      );

      let status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
      let waitlistPosition: number | undefined;
      let activateNow = true;

      if (hardCapReached) {
        status = SubscriptionStatus.WAITLIST;
        waitlistPosition = await nextWaitlistPosition(formula.id, tx);
        activateNow = false;
      }

      const subscription = await this.createSubscriptionRecord(tx, {
        clientId: client.id,
        formula,
        status,
        cguVersion: settings.cguVersion,
        waitlistPosition,
        activateNow,
      });

      return tx.subscription.findUniqueOrThrow({
        where: { id: subscription.id },
        include: { client: true, formula: true },
      });
    });
  }

  async activateAfterPayment(
    subscriptionId: string
  ): Promise<SubscriptionWithRelations> {
    return prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
        include: { formula: true },
      });

      if (!sub) {
        throw new AppError(
          "Abonnement introuvable",
          ErrorCodes.SUBSCRIPTION_NOT_FOUND,
          404
        );
      }

      if (
        sub.status === SubscriptionStatus.WAITLIST ||
        sub.status === SubscriptionStatus.PENDING_PAYMENT
      ) {
        const activeCount = await countActiveSubscriptions(sub.formulaId, tx);
        if (activeCount >= sub.formula.hardCap) {
          throw new AppError(
            "Plafond de la formule atteint — plus de place disponible",
            ErrorCodes.HARD_CAP_REACHED,
            400
          );
        }
      }

      if (
        sub.status !== SubscriptionStatus.PENDING_PAYMENT &&
        sub.status !== SubscriptionStatus.WAITLIST
      ) {
        throw new AppError(
          "Statut incompatible pour activation",
          ErrorCodes.INVALID_STATUS,
          400
        );
      }

      const settings = await getAppSettings();
      const validityDays =
        sub.formula.validityDays ?? settings.validityDaysDefault;
      const now = new Date();

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          paymentMethod: PaymentMethod.CASH,
          activatedAt: now,
          expiresAt: new Date(
            now.getTime() + validityDays * 24 * 60 * 60 * 1000
          ),
          waitlistPosition: null,
        },
      });

      return tx.subscription.findUniqueOrThrow({
        where: { id: subscriptionId },
        include: { client: true, formula: true },
      });
    });
  }

  async promoteFromWaitlist(
    subscriptionId: string
  ): Promise<SubscriptionWithRelations> {
    return prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.findUnique({
        where: { id: subscriptionId },
        include: { formula: true },
      });

      if (!sub || sub.status !== SubscriptionStatus.WAITLIST) {
        throw new AppError(
          "Abonnement non trouvé en liste d'attente",
          ErrorCodes.INVALID_STATUS,
          400
        );
      }

      const activeCount = await countActiveSubscriptions(sub.formulaId, tx);
      if (activeCount >= sub.formula.hardCap) {
        throw new AppError(
          "Plafond atteint — aucune place disponible",
          ErrorCodes.HARD_CAP_REACHED,
          400
        );
      }

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.PENDING_PAYMENT,
          waitlistPosition: null,
        },
      });

      return tx.subscription.findUniqueOrThrow({
        where: { id: subscriptionId },
        include: { client: true, formula: true },
      });
    });
  }

  async removeFromWaitlist(subscriptionId: string): Promise<void> {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub || sub.status !== SubscriptionStatus.WAITLIST) {
      throw new AppError("Non en liste d'attente", ErrorCodes.INVALID_STATUS, 400);
    }
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.CANCELLED, waitlistPosition: null },
    });
  }

  async getWaitlistByFormula(formulaId: string) {
    return prisma.subscription.findMany({
      where: { formulaId, status: SubscriptionStatus.WAITLIST },
      orderBy: [{ waitlistPosition: "asc" }, { createdAt: "asc" }],
      include: { client: true, formula: true },
    });
  }

  async getById(id: string): Promise<SubscriptionWithRelations | null> {
    return prisma.subscription.findUnique({
      where: { id },
      include: { client: true, formula: true },
    });
  }

  async expireOutdatedSubscriptions(): Promise<number> {
    const result = await prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: { status: SubscriptionStatus.EXPIRED },
    });
    return result.count;
  }

  mealsRemaining(sub: Pick<Subscription, "totalMeals" | "mealsConsumed">): number {
    return Math.max(0, sub.totalMeals - sub.mealsConsumed);
  }
}

export const subscriptionService = new SubscriptionService();
