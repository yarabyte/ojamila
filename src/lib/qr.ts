import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";

const QR_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function getQrSecret(): string {
  const secret = process.env.JWT_QR_SECRET;
  if (!secret) {
    throw new Error("JWT_QR_SECRET is not configured");
  }
  return secret;
}

export function signQrToken(subscriptionId: string): string {
  return jwt.sign({ sub: subscriptionId }, getQrSecret(), {
    algorithm: "HS256",
    expiresIn: "365d",
  });
}

export function verifyQrToken(token: string): string {
  try {
    const payload = jwt.verify(token, getQrSecret()) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.sub !== "string") {
      throw new Error("Invalid payload");
    }
    return payload.sub;
  } catch {
    throw new Error("Invalid QR token");
  }
}

export function signGiftToken(giftId: string): string {
  return jwt.sign({ gift: giftId }, getQrSecret(), {
    algorithm: "HS256",
    expiresIn: "30d",
  });
}

export function verifyGiftToken(token: string): string {
  try {
    const payload = jwt.verify(token, getQrSecret()) as jwt.JwtPayload;
    if (!payload.gift || typeof payload.gift !== "string") {
      throw new Error("Invalid gift payload");
    }
    return payload.gift;
  } catch {
    throw new Error("Invalid gift token");
  }
}

export function decodeQrPayload(
  token: string
): { type: "subscription"; id: string } | { type: "gift"; id: string } | null {
  try {
    const payload = jwt.verify(token, getQrSecret()) as jwt.JwtPayload;
    if (payload.gift && typeof payload.gift === "string") {
      return { type: "gift", id: payload.gift };
    }
    if (payload.sub && typeof payload.sub === "string") {
      return { type: "subscription", id: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}

/** Code secours repas offert — préfixe G pour le distinguer de l'abonnement. */
export function generateGiftShortCode(): string {
  return `G${generateShortCode(5)}`;
}

export function generateShortCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += QR_ALPHABET[bytes[i]! % QR_ALPHABET.length];
  }
  return code;
}
