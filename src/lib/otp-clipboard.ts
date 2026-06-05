/** Extrait un code OTP à 6 chiffres depuis un texte copié (message WhatsApp complet ou code seul). */
export function extractOtpFromClipboard(text: string): string | null {
  const trimmed = text.trim();
  if (/^\d{6}$/.test(trimmed)) return trimmed;

  for (const line of text.split(/\n/)) {
    const l = line.trim();
    if (/^\d{6}$/.test(l)) return l;
  }

  const parts = text.split(/\D+/).filter(Boolean);
  const sixDigitParts = parts.filter((p) => p.length === 6);
  if (sixDigitParts.length === 1) return sixDigitParts[0]!;
  if (sixDigitParts.length > 1) {
    return sixDigitParts[sixDigitParts.length - 1]!;
  }

  return null;
}
