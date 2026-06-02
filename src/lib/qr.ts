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

export function generateShortCode(length = 6): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += QR_ALPHABET[bytes[i]! % QR_ALPHABET.length];
  }
  return code;
}
