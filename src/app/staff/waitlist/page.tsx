import { prisma } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";
import { WaitlistActions } from "@/components/staff/waitlist-actions";
import { PageHeader } from "@/components/ui/page-header";

export default async function StaffWaitlistPage() {
  const entries = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.WAITLIST },
    include: { client: true, formula: true },
    orderBy: [{ waitlistPosition: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <PageHeader
        title="Liste d'attente"
        description="Promouvoir ou retirer un client"
      />
      <ul className="space-y-3">
        {entries.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground">
            Aucune entrée
          </li>
        ) : (
          entries.map((e) => (
            <li key={e.id} className="staff-card p-4">
              <p className="font-medium text-foreground">{e.client.name}</p>
              <p className="text-sm text-muted-foreground">
                {e.formula.name} · #{e.waitlistPosition}
              </p>
              <p className="text-xs text-muted-foreground">{e.client.phone}</p>
              <div className="mt-3">
                <WaitlistActions subscriptionId={e.id} />
              </div>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
