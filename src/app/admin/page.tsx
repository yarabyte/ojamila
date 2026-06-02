import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminQuickLinks } from "@/components/admin/admin-quick-links";
import { DashboardChart } from "@/components/admin/dashboard-chart";
import { getDashboardStats } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";
import { VENUE_NAME } from "@/lib/venue";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const progress = Math.min(
    100,
    Math.round((stats.fundsCollected / stats.fundraisingGoal) * 100)
  );

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="font-display text-3xl font-semibold">Tableau de bord</h1>
        <p className="text-muted-foreground">{VENUE_NAME} — levée de fonds</p>
      </div>

      <AdminQuickLinks />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fonds collectés</CardDescription>
            <CardTitle className="text-2xl">
              {formatFcfa(stats.fundsCollected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-gold-soft">
              <div
                className="h-2 rounded-full bg-gold"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {progress}% de l&apos;objectif {formatFcfa(stats.fundraisingGoal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Souscripteurs</CardDescription>
            <CardTitle className="text-2xl">{stats.subscriberCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Repas restants</CardDescription>
            <CardTitle className="text-2xl text-success">
              {stats.mealsRemaining}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Repas consommés</CardDescription>
            <CardTitle className="text-2xl">{stats.mealsConsumed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trésorerie indicative (80 / 20)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gold-soft/50 p-4">
            <p className="text-sm text-muted-foreground">80% finitions</p>
            <p className="text-xl font-semibold">
              {formatFcfa(stats.fundsFinitions)}
            </p>
          </div>
          <div className="rounded-xl bg-gold-soft/50 p-4">
            <p className="text-sm text-muted-foreground">20% réserve buffet</p>
            <p className="text-xl font-semibold">
              {formatFcfa(stats.fundsReserve)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Souscriptions (30 jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardChart data={stats.dailyChart} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Par formule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2">Formule</th>
                  <th className="pb-2">Actifs</th>
                  <th className="pb-2">Attente</th>
                  <th className="pb-2">Objectif</th>
                  <th className="pb-2">Plafond</th>
                </tr>
              </thead>
              <tbody>
                {stats.byFormula.map((f) => (
                  <tr key={f.formulaId} className="border-b border-gold/10">
                    <td className="py-2 font-medium">{f.name}</td>
                    <td className="py-2">{f.activeCount}</td>
                    <td className="py-2">{f.waitlistCount}</td>
                    <td className="py-2">{f.salesTarget}</td>
                    <td className="py-2">{f.hardCap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
