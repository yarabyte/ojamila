import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/subscription/whatsapp-button";
import { subscriptionService } from "@/lib/services";
import { SubscriptionStatus } from "@prisma/client";
import { ActivateButton } from "@/components/staff/activate-button";
import { PageHeader } from "@/components/ui/page-header";

export default async function StaffSubscribeDonePage({
  params,
}: {
  params: { id: string };
}) {
  const sub = await subscriptionService.getById(params.id);
  if (!sub) notFound();

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <PageHeader title="Abonnement créé" />
      <div className="staff-card space-y-4 p-4">
        <p className="text-foreground">
          {sub.client.name} — {sub.formula.name}
        </p>
        <p className="text-sm text-muted-foreground">
          Statut : <strong className="text-foreground">{sub.status}</strong> ·
          Code {sub.shortCode}
        </p>

        {sub.status === SubscriptionStatus.PENDING_PAYMENT && (
          <ActivateButton subscriptionId={sub.id} />
        )}

        {sub.status === SubscriptionStatus.ACTIVE && (
          <>
            <p className="text-sm text-muted-foreground">
              Envoyez le QR en image sur le WhatsApp du client :
            </p>
            <WhatsAppButton subscriptionId={sub.id} />
            <Button asChild variant="secondary" className="w-full">
              <Link href="/client/qr">Voir le QR client</Link>
            </Button>
          </>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/staff/subscribe">Nouvelle souscription</Link>
        </Button>
      </div>
    </main>
  );
}
