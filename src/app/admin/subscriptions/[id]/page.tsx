import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivateButton } from "@/components/staff/activate-button";
import { WhatsAppButton } from "@/components/subscription/whatsapp-button";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { subscriptionService } from "@/lib/services";
import { SubscriptionStatus } from "@prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const sub = await subscriptionService.getById(params.id);
  if (!sub) notFound();

  const consumptions = await prisma.consumption.findMany({
    where: { subscriptionId: sub.id },
    include: { servedBy: true },
    orderBy: { consumedAt: "desc" },
  });

  return (
    <div className="space-y-6 pb-16">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/admin/subscriptions">← Liste des abonnements</Link>
      </Button>
      <PageHeader
        title={sub.client.name}
        description={sub.formula.name}
      >
        <StatusBadge status={sub.status} />
      </PageHeader>
      <dl className="card-elevated grid gap-4 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Téléphone</dt>
          <dd className="font-medium">{sub.client.phone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Formule</dt>
          <dd className="font-medium">{sub.formula.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Repas restants</dt>
          <dd>
            {subscriptionService.mealsRemaining(sub)} / {sub.totalMeals}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Code secours</dt>
          <dd className="font-mono">{sub.shortCode}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expiration</dt>
          <dd>
            {sub.expiresAt
              ? sub.expiresAt.toLocaleDateString("fr-FR")
              : "—"}
          </dd>
        </div>
      </dl>

      {sub.status === SubscriptionStatus.PENDING_PAYMENT && (
        <ActivateButton subscriptionId={sub.id} clientName={sub.client.name} />
      )}

      {sub.status === SubscriptionStatus.ACTIVE && (
        <div className="card-elevated max-w-md space-y-2 p-4">
          <p className="text-sm text-muted-foreground">
            Envoyer au client le lien vers son QR code :
          </p>
          <WhatsAppButton subscriptionId={sub.id} />
        </div>
      )}

      <section>
        <h2 className="font-display text-lg">Historique consommations</h2>
        <ul className="mt-2 space-y-2">
          {consumptions.map((c) => (
            <li key={c.id} className="rounded-lg border px-3 py-2 text-sm">
              {c.consumedAt.toLocaleString("fr-FR")}
              {c.servedBy && ` — ${c.servedBy.name}`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
