import { normalizePhone } from "@/lib/phone";
import { isPublicMediaUrl } from "../qr-media-url";
import type { SendResult, WhatsAppProvider } from "./types";

type TwilioSendResult = SendResult;

function stripEnv(value: string | undefined): string | undefined {
  return value?.replace(/^["']|["']$/g, "");
}

function getConfig(): {
  accountSid: string;
  authToken: string;
  from: string;
} | null {
  const accountSid = stripEnv(process.env.TWILIO_ACCOUNT_SID);
  const authToken = stripEnv(process.env.TWILIO_AUTH_TOKEN);
  const from = stripEnv(process.env.TWILIO_WHATSAPP_FROM);
  if (!accountSid || !authToken || !from) return null;
  return { accountSid, authToken, from };
}

function toWhatsAppAddress(phone: string): string {
  const normalized = normalizePhone(phone);
  return `whatsapp:${normalized}`;
}

function parseTwilioError(body: string): string {
  try {
    const json = JSON.parse(body) as { message?: string; code?: number };
    const msg = json.message ?? "Erreur API Twilio";
    if (json.code === 21620) {
      return "URL image inaccessible depuis Twilio (localhost). Message texte envoyé à la place.";
    }
    if (json.code === 63007) {
      const join = process.env.TWILIO_SANDBOX_JOIN_PHRASE;
      const sandboxTo = process.env.TWILIO_SANDBOX_TO ?? "+1 415 523 8886";
      if (join) {
        return `Numéro non autorisé. Depuis le WhatsApp du client (+237…), envoyez « ${join} » au ${sandboxTo}, puis réessayez.`;
      }
      return `Numéro non autorisé — console Twilio → Sandbox : le client doit envoyer « join … » au ${sandboxTo} avant de recevoir des messages.`;
    }
    if (
      json.code === 63038 ||
      msg.toLowerCase().includes("daily messages limit")
    ) {
      return "Limite Twilio atteinte (5 messages/jour en essai gratuit). Réessayez demain, ajoutez une carte bancaire sur Twilio, ou utilisez le lien wa.me manuel.";
    }
    if (json.code === 63016) {
      return "Hors fenêtre 24 h — configurez un Content Template Twilio.";
    }
    return msg;
  } catch {
    return body.slice(0, 200) || "Erreur API Twilio";
  }
}

async function sendTwilioMessage(params: {
  to: string;
  body?: string;
  mediaUrl?: string;
  contentSid?: string;
  contentVariables?: string;
}): Promise<TwilioSendResult> {
  const config = getConfig();
  if (!config) return { sent: false, error: "Twilio WhatsApp non configuré" };

  const form = new URLSearchParams();
  form.set(
    "From",
    config.from.startsWith("whatsapp:") ? config.from : `whatsapp:${config.from}`
  );
  form.set("To", toWhatsAppAddress(params.to));

  if (params.contentSid) {
    form.set("ContentSid", params.contentSid);
    if (params.contentVariables) {
      form.set("ContentVariables", params.contentVariables);
    }
  } else {
    if (params.body) form.set("Body", params.body.slice(0, 1600));
    if (params.mediaUrl) form.set("MediaUrl", params.mediaUrl);
  }

  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString(
    "base64"
  );

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Twilio WhatsApp:", err);
    return { sent: false, error: parseTwilioError(err) };
  }

  return { sent: true };
}

export const twilioWhatsAppProvider: WhatsAppProvider = {
  name: "twilio",

  isConfigured() {
    return getConfig() !== null;
  },

  async sendText(phone, text) {
    return sendTwilioMessage({ to: phone, body: text });
  },

  async sendTemplate(phone, template) {
    const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;
    if (!contentSid) {
      const code =
        template.components?.[0]?.parameters?.[0]?.type === "text"
          ? template.components[0].parameters[0].text
          : undefined;
      if (code) {
        return sendTwilioMessage({
          to: phone,
          body: `Votre code Ô JAMILA : ${code}. Valide 10 minutes.`,
        });
      }
      return {
        sent: false,
        error: "TWILIO_WHATSAPP_CONTENT_SID non configuré",
      };
    }

    const variables: Record<string, string> = { "1": template.name };
    template.components?.forEach((component, ci) => {
      component.parameters.forEach((param, pi) => {
        if (param.type === "text") {
          variables[String(ci * 10 + pi + 1)] = param.text;
        }
      });
    });

    return sendTwilioMessage({
      to: phone,
      contentSid,
      contentVariables: JSON.stringify(variables),
    });
  },

  async sendImage(phone, _imagePng, caption, options) {
    const mediaUrl =
      options?.mediaUrl && isPublicMediaUrl(options.mediaUrl)
        ? options.mediaUrl
        : undefined;

    if (!mediaUrl) {
      return sendTwilioMessage({ to: phone, body: caption });
    }

    const withMedia = await sendTwilioMessage({
      to: phone,
      body: caption.slice(0, 1600),
      mediaUrl,
    });
    if (withMedia.sent) return withMedia;

    console.warn("Twilio image failed, fallback text:", withMedia.error);
    return sendTwilioMessage({ to: phone, body: caption });
  },
};
