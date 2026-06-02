import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { normalizePhone } from "@/lib/phone";
import { whatsappService } from "./whatsappService";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_MS = 60 * 1000;

const lastRequestByPhone = new Map<string, number>();

function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export class OtpService {
  async requestLoginOtp(phone: string): Promise<{
    whatsappUrl: string;
    /** Uniquement en développement pour tests sans WhatsApp */
    devCode?: string;
  }> {
    const normalized = normalizePhone(phone);

    const last = lastRequestByPhone.get(normalized);
    if (last && Date.now() - last < RATE_LIMIT_MS) {
      throw new AppError(
        "Attendez une minute avant de redemander un code",
        "OTP_RATE_LIMIT",
        429
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone: normalized },
      include: { subscriptions: { take: 1 } },
    });

    if (!user?.subscriptions.length) {
      throw new AppError(
        "Aucun abonnement trouvé pour ce numéro",
        "NO_SUBSCRIPTION",
        404
      );
    }

    const code = generateOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.otpChallenge.deleteMany({ where: { phone: normalized } });
    await prisma.otpChallenge.create({
      data: { phone: normalized, codeHash, expiresAt },
    });

    lastRequestByPhone.set(normalized, Date.now());

    const message = `Votre code de connexion JAMILA : ${code}. Valide 10 minutes. Ne le partagez pas.`;
    const whatsappUrl = whatsappService.buildWaMeLink(normalized, message);

    return {
      whatsappUrl,
      ...(process.env.NODE_ENV === "development" ? { devCode: code } : {}),
    };
  }

  async verifyLoginOtp(phone: string, code: string): Promise<string> {
    const normalized = normalizePhone(phone);
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone: normalized },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      throw new AppError("Code expiré ou invalide", "OTP_INVALID", 400);
    }

    if (challenge.expiresAt < new Date()) {
      await prisma.otpChallenge.delete({ where: { id: challenge.id } });
      throw new AppError("Code expiré", "OTP_EXPIRED", 400);
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new AppError("Trop de tentatives", "OTP_LOCKED", 429);
    }

    const valid = await bcrypt.compare(code, challenge.codeHash);
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });

    if (!valid) {
      throw new AppError("Code incorrect", "OTP_INVALID", 400);
    }

    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
    return normalized;
  }
}

export const otpService = new OtpService();
