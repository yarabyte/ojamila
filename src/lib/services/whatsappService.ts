import { phoneToWhatsAppDigits } from "@/lib/phone";
import { getAppSettings } from "@/lib/settings";

const GRAPH_API = "https://graph.facebook.com/v21.0";

function getCloudApiConfig(): {
  accessToken: string;
  phoneNumberId: string;
} | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId };
}

export type WhatsAppMessageContext = {
  name: string;
  qrLink: string;
  formulaName?: string;
  shortCode?: string;
};

/**
 * Abstraction WhatsApp — MVP via lien wa.me.
 * Prêt à brancher WhatsApp Business API / Twilio.
 */
export class WhatsAppService {
  private applyTemplate(
    template: string,
    context: WhatsAppMessageContext
  ): string {
    return template
      .replace(/\{\{name\}\}/g, context.name)
      .replace(/\{\{qrLink\}\}/g, context.qrLink)
      .replace(/\{\{formulaName\}\}/g, context.formulaName ?? "")
      .replace(/\{\{shortCode\}\}/g, context.shortCode ?? "");
  }

  async buildMessage(context: WhatsAppMessageContext): Promise<string> {
    const settings = await getAppSettings();
    return this.applyTemplate(settings.whatsappMessageTemplate, context);
  }

  buildWaMeLink(phone: string, message: string): string {
    const digits = phoneToWhatsAppDigits(phone);
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${digits}?text=${encoded}`;
  }

  async getShareLink(
    phone: string,
    context: WhatsAppMessageContext
  ): Promise<string> {
    const message = await this.buildMessage(context);
    return this.buildWaMeLink(phone, message);
  }

  isCloudApiConfigured(): boolean {
    return getCloudApiConfig() !== null;
  }

  /**
   * Envoi d'une image (QR) via WhatsApp Cloud API.
   * Nécessite WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID.
   */
  async sendImageMessage(
    phone: string,
    imagePng: Buffer,
    caption: string
  ): Promise<{ sent: true } | { sent: false; error: string }> {
    const config = getCloudApiConfig();
    if (!config) {
      return { sent: false, error: "API WhatsApp non configurée" };
    }

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

    const uploadRes = await fetch(
      `${GRAPH_API}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("WhatsApp media upload:", err);
      return { sent: false, error: "Échec envoi image (upload)" };
    }

    const { id: mediaId } = (await uploadRes.json()) as { id?: string };
    if (!mediaId) {
      return { sent: false, error: "Échec envoi image (media id)" };
    }

    const messageRes = await fetch(
      `${GRAPH_API}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "image",
          image: { id: mediaId, caption: caption.slice(0, 1024) },
        }),
      }
    );

    if (!messageRes.ok) {
      const err = await messageRes.text();
      console.error("WhatsApp send image:", err);
      return { sent: false, error: "Échec envoi image (message)" };
    }

    return { sent: true };
  }

  /**
   * Envoi texte via API — fallback wa.me si non configuré.
   */
  async sendMessage(
    phone: string,
    message: string
  ): Promise<{ sent: false; method: "wa.me"; link: string }> {
    return {
      sent: false,
      method: "wa.me",
      link: this.buildWaMeLink(phone, message),
    };
  }
}

export const whatsappService = new WhatsAppService();
