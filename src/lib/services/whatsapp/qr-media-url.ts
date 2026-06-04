import { createHmac } from "crypto";

export function signQrMediaUrl(subscriptionId: string): string {
  const secret = process.env.JWT_QR_SECRET;
  if (!secret) throw new Error("JWT_QR_SECRET manquant");
  return createHmac("sha256", secret).update(subscriptionId).digest("hex").slice(0, 24);
}

export function buildPublicQrMediaUrl(subscriptionId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL manquant");
  const sig = signQrMediaUrl(subscriptionId);
  return `${base.replace(/\/$/, "")}/api/public/qr/${subscriptionId}?sig=${sig}`;
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

/** Twilio doit pouvoir télécharger l'URL depuis Internet (HTTPS public). */
export function isTwilioReachableMediaUrl(url: string): boolean {
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

export function canSendQrImageViaTwilio(): boolean {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return false;
  return isTwilioReachableMediaUrl(
    `${base.replace(/\/$/, "")}/api/public/qr/example`
  );
}
