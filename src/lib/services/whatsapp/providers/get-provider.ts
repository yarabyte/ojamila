import { metaWhatsAppProvider } from "./meta-provider";
import { twilioWhatsAppProvider } from "./twilio-provider";
import type { WhatsAppProvider } from "./types";

export type WhatsAppProviderName = "meta" | "twilio" | "auto";

export function getWhatsAppProviderName(): WhatsAppProviderName {
  const raw = process.env.WHATSAPP_PROVIDER?.toLowerCase();
  if (raw === "meta" || raw === "twilio") return raw;
  return "auto";
}

export function getActiveWhatsAppProvider(): WhatsAppProvider | null {
  const preference = getWhatsAppProviderName();

  if (preference === "twilio") {
    return twilioWhatsAppProvider.isConfigured() ? twilioWhatsAppProvider : null;
  }
  if (preference === "meta") {
    return metaWhatsAppProvider.isConfigured() ? metaWhatsAppProvider : null;
  }

  if (twilioWhatsAppProvider.isConfigured()) return twilioWhatsAppProvider;
  if (metaWhatsAppProvider.isConfigured()) return metaWhatsAppProvider;
  return null;
}

export function getWhatsAppProviderLabel(): string | null {
  return getActiveWhatsAppProvider()?.name ?? null;
}
