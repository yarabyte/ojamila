export type WhatsAppTemplateComponent = {
  type: "body" | "header" | "button";
  sub_type?: "url" | "quick_reply";
  index?: number;
  parameters: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: { link: string } }
  >;
};

export type SendResult =
  | { sent: true }
  | { sent: false; error: string };

export interface WhatsAppProvider {
  readonly name: "meta" | "twilio";
  isConfigured(): boolean;
  sendText(phone: string, text: string): Promise<SendResult>;
  sendTemplate(
    phone: string,
    template: {
      name: string;
      language: string;
      components?: WhatsAppTemplateComponent[];
    }
  ): Promise<SendResult>;
  sendImage(
    phone: string,
    imagePng: Buffer,
    caption: string,
    options?: { mediaUrl?: string }
  ): Promise<SendResult>;
}
