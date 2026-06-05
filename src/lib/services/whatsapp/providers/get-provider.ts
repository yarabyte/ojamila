import { metaWhatsAppProvider } from "./meta-provider";
import { twilioWhatsAppProvider } from "./twilio-provider";
import { wasenderWhatsAppProvider } from "./wasender-provider";
import type { WhatsAppProvider } from "./types";

export type WhatsAppProviderName = "meta" | "twilio" | "wasender" | "auto";

export function getWhatsAppProviderName(): WhatsAppProviderName {
  const raw = process.env.WHATSAPP_PROVIDER?.toLowerCase();
  if (raw === "meta" || raw === "twilio" || raw === "wasender") return raw;
  return "auto";
}

export function getActiveWhatsAppProvider(): WhatsAppProvider | null {
  const preference = getWhatsAppProviderName();

  if (preference === "wasender") {
    return wasenderWhatsAppProvider.isConfigured()
      ? wasenderWhatsAppProvider
      : null;
  }
  if (preference === "twilio") {
    return twilioWhatsAppProvider.isConfigured() ? twilioWhatsAppProvider : null;
  }
  if (preference === "meta") {
    return metaWhatsAppProvider.isConfigured() ? metaWhatsAppProvider : null;
  }

  if (wasenderWhatsAppProvider.isConfigured()) return wasenderWhatsAppProvider;
  if (twilioWhatsAppProvider.isConfigured()) return twilioWhatsAppProvider;
  if (metaWhatsAppProvider.isConfigured()) return metaWhatsAppProvider;
  return null;
}

export function getWhatsAppProviderLabel(): string | null {
  return getActiveWhatsAppProvider()?.name ?? null;
}
