import Image from "next/image";
import { QrSaveButton } from "@/components/client/qr-save-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QrCardProps = {
  qrDataUrl: string;
  clientName: string;
  formulaName: string;
  mealsRemaining: number;
  shortCode: string;
  expiresAt: Date | null;
};

export function QrCard({
  qrDataUrl,
  clientName,
  formulaName,
  mealsRemaining,
  shortCode,
  expiresAt,
}: QrCardProps) {
  return (
    <Card className="mx-auto w-full max-w-sm overflow-hidden shadow-card">
      <CardHeader className="border-b border-gold/30 bg-black-deep px-4 py-5 text-center text-white sm:px-6">
        <CardTitle className="font-display text-lg text-gold sm:text-xl">
          Votre QR JAMILA
        </CardTitle>
        <p className="mt-1 text-sm text-white/80">{clientName}</p>
        <p className="text-xs text-gold sm:text-sm">{formulaName}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5 px-4 py-6 sm:gap-6 sm:px-6">
        <div className="relative w-full max-w-[min(100%,280px)] rounded-2xl border-[3px] border-gold/80 bg-white p-2 shadow-card ring-1 ring-gold/30 sm:p-3">
          <Image
            src={qrDataUrl}
            alt="QR Code abonnement"
            width={280}
            height={280}
            className="h-auto w-full rounded-lg"
            unoptimized
            priority
          />
          <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black-deep/90 text-xs font-bold text-gold">
            J
          </div>
        </div>

        <div className="w-full text-center">
          <p className="font-display text-2xl font-semibold text-gold-deep sm:text-3xl">
            {mealsRemaining}
          </p>
          <p className="text-sm text-muted-foreground">repas restants</p>
          <p className="mt-3 inline-flex rounded-xl bg-gold-soft/60 px-3 py-1.5 text-sm text-muted-foreground">
            Code secours :{" "}
            <strong className="ml-1 font-mono text-base tracking-[0.2em] text-foreground">
              {shortCode}
            </strong>
          </p>
          {expiresAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Valide jusqu&apos;au{" "}
              {expiresAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <QrSaveButton qrDataUrl={qrDataUrl} shortCode={shortCode} />
      </CardContent>
    </Card>
  );
}
