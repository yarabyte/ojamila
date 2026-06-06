import { z } from "zod";

/** E.164 : + puis 8 à 15 chiffres (premier chiffre ≠ 0) */
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/**
 * Normalise un numéro WhatsApp vers E.164 (+XXXXXXXX).
 * - International : +33…, 0033…, ou indicatif sans + (33612345678)
 * - Cameroun : 677…, 0677…, +237677…
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "+";

  if (trimmed.startsWith("+")) {
    return `+${trimmed.replace(/\D/g, "")}`;
  }

  if (trimmed.startsWith("00")) {
    return `+${trimmed.slice(2).replace(/\D/g, "")}`;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("237") && digits.length >= 11) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    const national = digits.slice(1);
    if (/^[62]\d{8}$/.test(national)) {
      return `+237${national}`;
    }
  }

  if (digits.length === 9 && /^[62]\d{8}$/.test(digits)) {
    return `+237${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function isValidPhone(raw: string): boolean {
  return E164_PATTERN.test(normalizePhone(raw));
}

export const phoneSchema = z
  .string()
  .min(1, "Numéro WhatsApp requis")
  .transform(normalizePhone)
  .refine((v) => E164_PATTERN.test(v), {
    message:
      "Numéro WhatsApp invalide. Utilisez le format international (+237…, +33…, +1…).",
  });

export function phoneToWhatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
