/** Normalise un numéro WhatsApp vers le format international (+237...) */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("237") && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 9) {
    return `+237${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+237${digits}`;
  }
  if (raw.startsWith("+")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

export function phoneToWhatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}
