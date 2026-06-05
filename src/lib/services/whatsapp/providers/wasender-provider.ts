import { normalizePhone } from "@/lib/phone";
import { isPublicMediaUrl } from "../qr-media-url";
import type { SendResult, WhatsAppProvider } from "./types";

function stripEnv(value: string | undefined): string | undefined {
  return value?.replace(/^["']|["']$/g, "");
}

function getApiKey(): string | null {
  return stripEnv(process.env.WASENDER_API_KEY) ?? null;
}

function apiBase(): string {
  return (
    stripEnv(process.env.WASENDER_API_BASE) ??
    "https://www.wasenderapi.com"
  ).replace(/\/$/, "");
}

function toE164(phone: string): string {
  return normalizePhone(phone);
}

function parseWasenderError(body: string): string {
  try {
    const json = JSON.parse(body) as {
      message?: string;
      error?: string;
      errors?: Array<{ message?: string }>;
    };
    if (json.errors?.[0]?.message) return json.errors[0].message;
    return json.message ?? json.error ?? "Erreur WasenderAPI";
  } catch {
    return body.slice(0, 200) || "Erreur WasenderAPI";
  }
}

async function sendWasenderMessage(
  payload: Record<string, string>
): Promise<SendResult> {
  const apiKey = getApiKey();
  if (!apiKey) return { sent: false, error: "WasenderAPI non configuré" };

  const res = await fetch(`${apiBase()}/api/send-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error("WasenderAPI:", body);
    return { sent: false, error: parseWasenderError(body) };
  }

  try {
    const json = JSON.parse(body) as { success?: boolean; message?: string };
    if (json.success === false) {
      return { sent: false, error: json.message ?? "Erreur WasenderAPI" };
    }
  } catch {
    // réponse non-JSON mais HTTP 2xx
  }

  return { sent: true };
}

export const wasenderWhatsAppProvider: WhatsAppProvider = {
  name: "wasender",

  isConfigured() {
    return getApiKey() !== null;
  },

  async sendText(phone, text) {
    return sendWasenderMessage({
      to: toE164(phone),
      text: text.slice(0, 4096),
    });
  },

  async sendTemplate(phone, template) {
    const code =
      template.components?.[0]?.parameters?.[0]?.type === "text"
        ? template.components[0].parameters[0].text
        : undefined;
    const text = code
      ? `Code de connexion JAMILA\n\n${code}\n\nValide 10 minutes. Ne le partagez pas.`
      : `Message JAMILA : ${template.name}`;
    return sendWasenderMessage({ to: toE164(phone), text });
  },

  async sendImage(phone, _imagePng, caption, options) {
    const mediaUrl =
      options?.mediaUrl && isPublicMediaUrl(options.mediaUrl)
        ? options.mediaUrl
        : undefined;

    if (!mediaUrl) {
      return sendWasenderMessage({
        to: toE164(phone),
        text: caption,
      });
    }

    const withMedia = await sendWasenderMessage({
      to: toE164(phone),
      text: caption.slice(0, 1024),
      imageUrl: mediaUrl,
    });
    if (withMedia.sent) return withMedia;

    console.warn("Wasender image failed, fallback text:", withMedia.error);
    return sendWasenderMessage({ to: toE164(phone), text: caption });
  },
};
