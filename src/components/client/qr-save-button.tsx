"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadDataUrl, shareQrImageOnDevice, dataUrlToFile } from "@/lib/qr-share-client";
import { Download, Share2 } from "lucide-react";

export function QrSaveButton({
  qrDataUrl,
  shortCode,
}: {
  qrDataUrl: string;
  shortCode: string;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const filename = `jamila-qr-${shortCode}.png`;

  async function handleShare() {
    setLoading(true);
    setHint(null);
    try {
      const file = dataUrlToFile(qrDataUrl, filename);
      const result = await shareQrImageOnDevice(
        file,
        `Mon QR JAMILA — code secours ${shortCode}`
      );
      if (result === "shared") {
        setHint("Partage lancé — enregistrez l'image dans vos photos si besoin.");
        return;
      }
      if (result === "cancelled") return;
      downloadDataUrl(qrDataUrl, filename);
      setHint("QR enregistré dans vos téléchargements.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    downloadDataUrl(qrDataUrl, filename);
    setHint("QR téléchargé.");
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <Button
        type="button"
        variant="secondary"
        className="flex-1 gap-2"
        onClick={handleShare}
        disabled={loading}
      >
        <Share2 className="h-4 w-4" />
        {loading ? "…" : "Enregistrer / partager"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex-1 gap-2"
        onClick={handleDownload}
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        Télécharger
      </Button>
      {hint && (
        <p className="w-full text-center text-xs text-muted-foreground sm:col-span-2">
          {hint}
        </p>
      )}
    </div>
  );
}
