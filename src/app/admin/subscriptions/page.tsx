import { AdminSubscriptionsList } from "@/components/admin/admin-subscriptions-list";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold">Abonnements</h1>
        <Button variant="secondary" asChild className="w-full sm:w-auto">
          <a href="/api/admin/subscriptions/export">Export CSV</a>
        </Button>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0"
      >
        <div className="sm:col-span-2 lg:max-w-xs lg:flex-1">
          <Input
            name="q"
            placeholder="Rechercher nom / téléphone"
            defaultValue={searchParams.q}
            className="w-full"
          />
        </div>
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm"
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
          className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm lg:max-w-[12rem]"
        >
          <option value="">Toutes formules</option>
          {formulas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <Button type="submit" className="w-full sm:col-span-2 lg:w-auto">
          Filtrer
        </Button>
      </form>

      <AdminSubscriptionsList subs={subs} />
    </div>
  );
}
