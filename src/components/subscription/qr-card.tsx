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
      <CardHeader className="bg-black-deep px-4 py-5 text-center text-white sm:px-6">
        <CardTitle className="font-display text-lg text-gold sm:text-xl">
          Votre QR JAMILA
        </CardTitle>
        <p className="mt-1 text-sm text-white/80">{clientName}</p>
        <p className="text-xs text-gold sm:text-sm">{formulaName}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 px-4 py-6 sm:px-6">
        <div className="relative w-full max-w-[min(100%,280px)] rounded-2xl border-4 border-gold bg-white p-2 shadow-card sm:p-3">
          <Image
            src={qrDataUrl}
            alt="QR Code abonnement"
            width={280}
            height={280}
            className="h-auto w-full rounded-lg"
            unoptimized
            priority
          />
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black-deep text-sm font-bold text-gold sm:h-12 sm:w-12 sm:text-base">
            J
          </div>
        </div>

        <div className="w-full text-center">
          <p className="text-xl font-semibold text-success sm:text-2xl">
            {mealsRemaining} repas restants
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Code secours :{" "}
            <strong className="font-mono text-base tracking-wider text-foreground">
              {shortCode}
            </strong>
          </p>
          {expiresAt && (
            <p className="mt-1 text-xs text-muted-foreground">
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
