import { prisma } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";
import { WaitlistActions } from "@/components/staff/waitlist-actions";

export default async function AdminWaitlistPage() {
  const entries = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.WAITLIST },
    include: { client: true, formula: true },
    orderBy: [{ formula: { sortOrder: "asc" } }, { waitlistPosition: "asc" }],
  });

  return (
    <div className="space-y-6 pb-16">
      <h1 className="font-display text-2xl font-semibold">Liste d&apos;attente</h1>
      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="rounded-xl border p-4">
            <p className="font-medium">{e.client.name}</p>
            <p className="text-sm text-muted-foreground">
              {e.formula.name} · position {e.waitlistPosition} · {e.client.phone}
            </p>
            <div className="mt-3">
              <WaitlistActions subscriptionId={e.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
