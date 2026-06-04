import { phoneToWhatsAppDigits } from "@/lib/phone";
import type { SendResult, WhatsAppProvider, WhatsAppTemplateComponent } from "./types";

function graphApiBase(): string {
  const version = process.env.WHATSAPP_API_VERSION ?? "v25.0";
  return `https://graph.facebook.com/${version}`;
}

function getConfig(): { accessToken: string; phoneNumberId: string } | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId };
}

function parseGraphError(body: string): string {
  try {
    const json = JSON.parse(body) as {
      error?: { message?: string; error_user_msg?: string };
    };
    return (
      json.error?.error_user_msg ??
      json.error?.message ??
      "Erreur API WhatsApp Meta"
    );
  } catch {
    return body.slice(0, 200) || "Erreur API WhatsApp Meta";
  }
}

async function postMessages(
  payload: Record<string, unknown>
): Promise<SendResult> {
  const config = getConfig();
  if (!config) return { sent: false, error: "Meta WhatsApp non configuré" };

  const res = await fetch(
    `${graphApiBase()}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Meta WhatsApp API:", err);
    return { sent: false, error: parseGraphError(err) };
  }
  return { sent: true };
}

export const metaWhatsAppProvider: WhatsAppProvider = {
  name: "meta",

  isConfigured() {
    return getConfig() !== null;
  },

  async sendText(phone, text) {
    return postMessages({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneToWhatsAppDigits(phone),
      type: "text",
      text: { preview_url: true, body: text.slice(0, 4096) },
    });
  },

  async sendTemplate(phone, template) {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneToWhatsAppDigits(phone),
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        ...(template.components?.length
          ? { components: template.components }
          : {}),
      },
    };
    return postMessages(body);
  },

  async sendImage(phone, imagePng, caption) {
    const config = getConfig();
    if (!config) return { sent: false, error: "Meta WhatsApp non configuré" };

    const to = phoneToWhatsAppDigits(phone);
    const { accessToken, phoneNumberId } = config;

    const form = new FormData();
    form.append(
      "file",
      new Blob([Uint8Array.from(imagePng)], { type: "image/png" }),
      "jamila-qr.png"
    );
    form.append("type", "image/png");
    form.append("messaging_product", "whatsapp");

    const uploadRes = await fetch(`${graphApiBase()}/${phoneNumberId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (!uploadRes.ok) {
      return { sent: false, error: parseGraphError(await uploadRes.text()) };
    }

    const { id: mediaId } = (await uploadRes.json()) as { id?: string };
    if (!mediaId) {
      return { sent: false, error: "Échec upload image Meta" };
    }

    return postMessages({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "image",
      image: { id: mediaId, caption: caption.slice(0, 1024) },
    });
  },
};

export type { WhatsAppTemplateComponent };
