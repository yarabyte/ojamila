import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { QrCard } from "@/components/subscription/qr-card";
import { WhatsAppButton } from "@/components/subscription/whatsapp-button";
import { Button } from "@/components/ui/button";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { generateQrDataUrl } from "@/lib/qr-display";
import { prisma } from "@/lib/db";
import { subscriptionService } from "@/lib/services";
import { SubscriptionStatus } from "@prisma/client";

export default async function ClientSubscriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const phone = await getClientPhoneFromCookies();
  const sub = await subscriptionService.getById(params.id);
  if (!sub) notFound();

  if (phone && sub.client.phone !== phone) {
    redirect("/client");
  }

  const consumptions = await prisma.consumption.findMany({
    where: { subscriptionId: sub.id },
    orderBy: { consumedAt: "desc" },
    take: 20,
  });

  const mealsRemaining = subscriptionService.mealsRemaining(sub);
  const qrDataUrl =
    sub.status === SubscriptionStatus.ACTIVE
      ? await generateQrDataUrl(sub.qrToken)
      : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md space-y-6 px-4 py-8">
        <Button variant="ghost" asChild className="-ml-2">
          <Link href="/client">← Mes abonnements</Link>
        </Button>

        {sub.status === SubscriptionStatus.PENDING_PAYMENT && (
          <div className="rounded-xl bg-gold-soft p-4 text-sm">
            Présentez-vous à la caisse pour payer en espèces et activer votre QR.
          </div>
        )}

        {sub.status === SubscriptionStatus.WAITLIST && (
          <div className="rounded-xl bg-warning/10 p-4 text-sm text-warning">
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
          </>
        ) : (
          <p className="text-center text-muted-foreground">
            QR disponible après activation du paiement.
          </p>
        )}

        <section>
          <h2 className="font-display text-lg font-semibold">Historique</h2>
          {consumptions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Aucun repas consommé.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {consumptions.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-gold/20 px-3 py-2 text-sm"
                >
                  {c.consumedAt.toLocaleString("fr-FR")}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
