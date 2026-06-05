import Link from "next/link";
import { GiftMealSection } from "@/components/client/gift-meal-section";
import { QrCard } from "@/components/subscription/qr-card";
import { WhatsAppButton } from "@/components/subscription/whatsapp-button";
import { Button } from "@/components/ui/button";
import { generateQrDataUrl } from "@/lib/qr-display";
import { subscriptionService } from "@/lib/services";
import { SubscriptionStatus } from "@prisma/client";
import type { ClientSubscription } from "@/lib/client-subscription";

export async function ClientQrView({
  sub,
  showBackLink = false,
}: {
  sub: ClientSubscription;
  showBackLink?: boolean;
}) {
  const mealsRemaining = subscriptionService.mealsRemaining(sub);
  const qrDataUrl =
    sub.status === SubscriptionStatus.ACTIVE && sub.qrToken !== "pending"
      ? await generateQrDataUrl(sub.qrToken)
      : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      {showBackLink && (
        <Button variant="ghost" asChild className="-ml-2 text-muted-foreground">
          <Link href="/client">← Mes abonnements</Link>
        </Button>
      )}

      {sub.status === SubscriptionStatus.PENDING_PAYMENT && (
        <div className="rounded-2xl border border-gold/30 bg-gold-soft/80 p-4 text-sm">
          Présentez-vous à la caisse pour payer en espèces et activer votre QR.
        </div>
      )}

      {sub.status === SubscriptionStatus.WAITLIST && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          Liste d&apos;attente — position {sub.waitlistPosition}
        </div>
      )}

      {qrDataUrl ? (
        <>
          <QrCard
            qrDataUrl={qrDataUrl}
            clientName={sub.client.name}
            formulaName={sub.formula.name}
            mealsRemaining={mealsRemaining}
            shortCode={sub.shortCode}
            expiresAt={sub.expiresAt}
          />
          <WhatsAppButton subscriptionId={sub.id} />
          <GiftMealSection
            subscriptionId={sub.id}
            mealsRemaining={mealsRemaining}
          />
          <p className="text-center text-xs text-muted-foreground">
            Conservez ce QR : il sera demandé à chaque repas.
          </p>
        </>
      ) : (
        <div className="card-elevated p-6 text-center text-sm text-muted-foreground">
          QR disponible après activation du paiement à la caisse.
        </div>
      )}
    </div>
  );
}
