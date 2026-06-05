"use client";

import { useState } from "react";
import {
  getWhatsAppQrSharePayload,
  sendWhatsAppQrImage,
  sendWhatsAppTextForSubscription,
} from "@/app/actions/subscription";
import { IndeterminateBar } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import {
  dataUrlToFile,
  downloadDataUrl,
  shareQrImageOnDevice,
} from "@/lib/qr-share-client";
import { cn } from "@/lib/utils";
import { ImageIcon, Link2, MessageCircle } from "lucide-react";

export function WhatsAppButton({
  subscriptionId,
  className,
}: {
  subscriptionId: string;
  /** @deprecated ignoré — thème staff aligné sur le thème clair */
  variant?: "default" | "staff";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendQrAsImage() {
    setLoading(true);
    setHint(null);
    setError(null);

    try {
      const payload = await getWhatsAppQrSharePayload(subscriptionId);
      if (!payload.success) {
        setError(payload.error);
        return;
      }

      const { dataUrl, filename, message, waMeUrl, cloudApiConfigured } =
        payload.data;

      if (cloudApiConfigured) {
        const apiResult = await sendWhatsAppQrImage(subscriptionId);
        if (apiResult.success) {
          setHint(
            apiResult.data.textOnly
              ? "Message WhatsApp envoyé (lien QR — image disponible en production)."
              : "QR envoyé sur WhatsApp du client."
          );
          return;
        }
        setError(apiResult.error);
      }

      const file = dataUrlToFile(dataUrl, filename);
      const shared = await shareQrImageOnDevice(file, message);

      if (shared === "shared") {
        setHint("Choisissez WhatsApp dans le menu de partage.");
        return;
      }

      if (shared === "cancelled") return;

      downloadDataUrl(dataUrl, filename);
      window.open(waMeUrl, "_blank");
      setHint(
        "QR téléchargé. Dans WhatsApp, joignez l'image jamila-qr-….png au message ouvert."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openLinkOnly() {
    setLoading(true);
    setHint(null);
    setError(null);
    const result = await sendWhatsAppTextForSubscription(subscriptionId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.data.autoSent) {
      setHint("Message WhatsApp envoyé au client.");
      return;
    }
    if (result.data.url) {
      window.open(result.data.url, "_blank");
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {loading && (
        <div className="space-y-1.5 rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            Préparation de l&apos;envoi WhatsApp…
          </p>
          <IndeterminateBar />
        </div>
      )}
      <Button
        type="button"
        variant="default"
        className="w-full gap-2"
        size="lg"
        onClick={sendQrAsImage}
        disabled={loading}
      >
        <ImageIcon className="h-5 w-5" />
        {loading ? "Préparation…" : "Envoyer le QR (image) par WhatsApp"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-11 w-full gap-2 text-xs text-muted-foreground"
        onClick={openLinkOnly}
        disabled={loading}
      >
        <Link2 className="h-4 w-4" />
        Envoyer uniquement le lien texte
      </Button>
      {hint && (
        <p className="flex items-start gap-2 rounded-xl bg-success/15 px-3 py-2 text-xs text-success">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {hint}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-danger/15 px-3 py-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
