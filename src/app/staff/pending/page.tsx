import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";
import { ActivateButton } from "@/components/staff/activate-button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatFcfa } from "@/lib/utils";
import { Phone } from "lucide-react";

export default async function StaffPendingPage() {
  const pending = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.PENDING_PAYMENT },
    include: { client: true, formula: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <PageHeader
        title="Paiements à encaisser"
        description="Clients inscrits en ligne — confirmer après encaissement espèces"
      />

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">Aucun paiement en attente</p>
          <Button asChild className="mt-4">
            <Link href="/staff/subscribe">Nouvelle souscription comptoir</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {pending.map((sub, i) => (
            <li key={sub.id} className="staff-card">
              <div className="flex items-center justify-between border-b border-border bg-gold-soft/50 px-4 py-2">
                <span className="text-xs font-medium text-gold-deep">
                  #{i + 1} · file chronologique
                </span>
                <StatusBadge status={sub.status} />
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {sub.client.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {sub.client.phone}
                  </p>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-gold-soft/40 px-3 py-2">
                  <span className="font-medium text-gold-deep">
                    {sub.formula.name}
                  </span>
                  <span className="font-display text-lg font-semibold text-foreground">
                    {formatFcfa(sub.formula.priceFcfa)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Inscrit le{" "}
                  {sub.createdAt.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <ActivateButton
                  subscriptionId={sub.id}
                  clientName={sub.client.name}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
