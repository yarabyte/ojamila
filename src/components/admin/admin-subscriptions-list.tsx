import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { subscriptionService } from "@/lib/services";
import type { Formula, Subscription, User } from "@prisma/client";
import { ChevronRight } from "lucide-react";

type SubscriptionRow = Subscription & {
  client: User;
  formula: Formula;
};

export function AdminSubscriptionsList({ subs }: { subs: SubscriptionRow[] }) {
  if (subs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Aucun abonnement trouvé.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {subs.map((s) => (
          <li key={s.id}>
            <Link
              href={`/admin/subscriptions/${s.id}`}
              className="card-interactive block p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {s.client.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.client.phone}
                  </p>
                </div>
                <StatusBadge status={s.status} className="shrink-0" />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-muted-foreground">
                  {s.formula.name}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {subscriptionService.mealsRemaining(s)} / {s.totalMeals} repas
                </span>
              </div>
              <p className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-gold-deep">
                Voir le détail
                <ChevronRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gold-soft/40 text-left">
            <tr>
              <th className="p-3">Client</th>
              <th className="p-3">Formule</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Repas</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">
                  <p className="font-medium">{s.client.name}</p>
                  <p className="text-xs text-muted-foreground">{s.client.phone}</p>
                </td>
                <td className="p-3">{s.formula.name}</td>
                <td className="p-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="p-3 tabular-nums">
                  {subscriptionService.mealsRemaining(s)} / {s.totalMeals}
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/subscriptions/${s.id}`}
                    className="font-medium text-gold-deep underline-offset-2 hover:underline"
                  >
                    Détail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
