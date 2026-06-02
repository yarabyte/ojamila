import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscriptionService } from "@/lib/services";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; formulaId?: string };
}) {
  const formulas = await prisma.formula.findMany({ orderBy: { sortOrder: "asc" } });

  const subs = await prisma.subscription.findMany({
    where: {
      ...(searchParams.status
        ? { status: searchParams.status as never }
        : {}),
      ...(searchParams.formulaId ? { formulaId: searchParams.formulaId } : {}),
      ...(searchParams.q
        ? {
            client: {
              OR: [
                { name: { contains: searchParams.q, mode: "insensitive" } },
                { phone: { contains: searchParams.q } },
              ],
            },
          }
        : {}),
    },
    include: { client: true, formula: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">Abonnements</h1>
        <Button variant="secondary" asChild>
          <a href="/api/admin/subscriptions/export">Export CSV</a>
        </Button>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <Input
          name="q"
          placeholder="Rechercher nom / téléphone"
          defaultValue={searchParams.q}
          className="max-w-xs"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="h-12 rounded-xl border px-3 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="PENDING_PAYMENT">Paiement attente</option>
          <option value="WAITLIST">Liste d&apos;attente</option>
          <option value="EXPIRED">Expiré</option>
          <option value="CANCELLED">Annulé</option>
        </select>
        <select
          name="formulaId"
          defaultValue={searchParams.formulaId ?? ""}
          className="h-12 rounded-xl border px-3 text-sm"
        >
          <option value="">Toutes formules</option>
          {formulas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
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
                <td className="p-3">{s.status}</td>
                <td className="p-3">
                  {subscriptionService.mealsRemaining(s)} / {s.totalMeals}
                </td>
                <td className="p-3">
                  <Link
                    href={`/admin/subscriptions/${s.id}`}
                    className="text-gold-deep underline"
                  >
                    Détail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
