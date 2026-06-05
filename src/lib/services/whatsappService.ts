import { phoneToWhatsAppDigits } from "@/lib/phone";
import { getAppSettings } from "@/lib/settings";
import {
  getActiveWhatsAppProvider,
  getWhatsAppProviderLabel,
} from "./whatsapp/providers/get-provider";
import type { WhatsAppTemplateComponent } from "./whatsapp/providers/types";
import { buildPublicQrMediaUrl, isPublicMediaUrl } from "./whatsapp/qr-media-url";

export type WhatsAppMessageContext = {
  name: string;
  qrLink: string;
  formulaName?: string;
  shortCode?: string;
};

export type SendMessageResult =
  | { sent: true; method: "api"; provider?: string }
  | { sent: false; method: "wa.me"; link: string };

export type { WhatsAppTemplateComponent };

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
    return getActiveWhatsAppProvider() !== null;
  }

  getProviderName(): string | null {
    return getWhatsAppProviderLabel();
  }

  async sendTemplateMessage(
    phone: string,
    template: {
      name: string;
      language: string;
      components?: WhatsAppTemplateComponent[];
    }
  ): Promise<{ sent: true } | { sent: false; error: string }> {
    const provider = getActiveWhatsAppProvider();
    if (!provider) {
      return { sent: false, error: "Aucun fournisseur WhatsApp configuré" };
    }
    return provider.sendTemplate(phone, template);
  }

  async sendTextMessage(
    phone: string,
    text: string
  ): Promise<{ sent: true } | { sent: false; error: string }> {
    const provider = getActiveWhatsAppProvider();
    if (!provider) {
      return { sent: false, error: "Aucun fournisseur WhatsApp configuré" };
    }
    return provider.sendText(phone, text);
  }

  async sendOtpCode(
    phone: string,
    code: string
  ): Promise<SendMessageResult & { error?: string }> {
    const message = `Code de connexion JAMILA\n\n${code}\n\nValide 10 minutes. Ne le partagez pas.`;
    const provider = getActiveWhatsAppProvider();
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;

    if (provider && templateName && provider.name === "meta") {
      const result = await provider.sendTemplate(phone, {
        name: templateName,
        language: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE ?? "fr",
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
        ],
      });
      if (result.sent) {
        return { sent: true, method: "api", provider: provider.name };
      }
      console.warn("WhatsApp OTP template failed:", result.error);
    }

    if (provider) {
      const result = await provider.sendText(phone, message);
      if (result.sent) {
        return { sent: true, method: "api", provider: provider.name };
      }
      console.warn(`WhatsApp OTP (${provider.name}) failed:`, result.error);
    }

    return {
      sent: false,
      method: "wa.me",
      link: this.buildWaMeLink(phone, message),
    };
  }

  async sendImageMessage(
    phone: string,
    imagePng: Buffer,
    caption: string,
    options?: { subscriptionId?: string }
  ): Promise<{ sent: true } | { sent: false; error: string }> {
    const provider = getActiveWhatsAppProvider();
    if (!provider) {
      return { sent: false, error: "Aucun fournisseur WhatsApp configuré" };
    }

    let mediaUrl: string | undefined;
    if (
      (provider.name === "twilio" || provider.name === "wasender") &&
      options?.subscriptionId
    ) {
      try {
        const url = buildPublicQrMediaUrl(options.subscriptionId);
        if (isPublicMediaUrl(url)) {
          mediaUrl = url;
        }
      } catch (e) {
        console.error("QR media URL:", e);
      }
    }

    return provider.sendImage(phone, imagePng, caption, { mediaUrl });
  }

  async sendMessage(phone: string, message: string): Promise<SendMessageResult> {
    const provider = getActiveWhatsAppProvider();
    if (provider) {
      const result = await provider.sendText(phone, message);
      if (result.sent) {
        return { sent: true, method: "api", provider: provider.name };
      }
      console.warn(`WhatsApp (${provider.name}) failed, fallback wa.me:`, result.error);
    }

    return {
      sent: false,
      method: "wa.me",
      link: this.buildWaMeLink(phone, message),
    };
  }
}

export const whatsappService = new WhatsAppService();
