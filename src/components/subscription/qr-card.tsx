import Image from "next/image";
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
    <Card className="mx-auto max-w-sm overflow-hidden">
      <CardHeader className="bg-black-deep text-center text-white">
        <CardTitle className="font-display text-gold">Votre QR JAMILA</CardTitle>
        <p className="text-sm text-white/80">{clientName}</p>
        <p className="text-xs text-gold">{formulaName}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        <div className="relative rounded-2xl border-4 border-gold bg-white p-3 shadow-card">
          <Image
            src={qrDataUrl}
            alt="QR Code abonnement"
            width={240}
            height={240}
            className="rounded-lg"
            unoptimized
          />
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black-deep text-sm font-bold text-gold">
            J
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-success">
            {mealsRemaining} repas restants
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Code secours : <strong className="text-foreground">{shortCode}</strong>
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
      </CardContent>
    </Card>
  );
}
