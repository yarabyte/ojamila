import { createHmac } from "crypto";

function signMediaUrl(id: string, prefix: string): string {
  const secret = process.env.JWT_QR_SECRET;
  if (!secret) throw new Error("JWT_QR_SECRET manquant");
  return createHmac("sha256", secret)
    .update(`${prefix}:${id}`)
    .digest("hex")
    .slice(0, 24);
}

export function signQrMediaUrl(subscriptionId: string): string {
  return signMediaUrl(subscriptionId, "sub");
}

export function signGiftQrMediaUrl(giftId: string): string {
  return signMediaUrl(giftId, "gift");
}

export function buildPublicQrMediaUrl(subscriptionId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL manquant");
  const sig = signQrMediaUrl(subscriptionId);
  return `${base.replace(/\/$/, "")}/api/public/qr/${subscriptionId}?sig=${sig}`;
}

export function buildPublicGiftQrMediaUrl(giftId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL manquant");
  const sig = signGiftQrMediaUrl(giftId);
  return `${base.replace(/\/$/, "")}/api/public/gift-qr/${giftId}?sig=${sig}`;
}

export function verifyQrMediaSignature(
  subscriptionId: string,
  sig: string | null
): boolean {
  if (!sig) return false;
  try {
    return signQrMediaUrl(subscriptionId) === sig;
  } catch {
    return false;
  }
}

export function verifyGiftQrMediaSignature(
  giftId: string,
  sig: string | null
): boolean {
  if (!sig) return false;
  try {
    return signGiftQrMediaUrl(giftId) === sig;
  } catch {
    return false;
  }
}

/** L'URL doit être téléchargeable depuis Internet (Wasender, Twilio, etc.). */
export function isPublicMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local")
    ) {
      return false;
    }
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** @deprecated utiliser isPublicMediaUrl */
export const isTwilioReachableMediaUrl = isPublicMediaUrl;

export function canSendQrImageViaApi(): boolean {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return false;
  return isPublicMediaUrl(
    `${base.replace(/\/$/, "")}/api/public/qr/example`
  );
}

/** @deprecated utiliser canSendQrImageViaApi */
export const canSendQrImageViaTwilio = canSendQrImageViaApi;
