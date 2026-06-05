import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VenueAboutSection } from "@/components/venue-info";
import { FormulaCard } from "@/components/formula/formula-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { subscriptionService, getDashboardStats } from "@/lib/services";
import { VENUE_ADDRESS, VENUE_BUFFET_NOTE, VENUE_NAME } from "@/lib/venue";
import { formatFcfa } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, MapPin, Sparkles } from "lucide-react";

export default async function FormulesPage() {
  const [formulas, stats] = await Promise.all([
    subscriptionService.listFormulasAvailability().catch(() => []),
    getDashboardStats().catch(() => null),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/formules" />
      <main className="flex-1">
        <section className="border-b border-gold/20 bg-black-deep text-white">
          <div className="container-app py-10 sm:py-14">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-gold"
            >
              <ChevronLeft className="h-4 w-4" />
              Menu
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              Prévente abonnements repas
            </div>
            <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight text-balance sm:text-4xl lg:text-5xl">
              Soutenez l&apos;extension de {VENUE_NAME}
            </h1>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/70 sm:text-base">
              <MapPin className="h-4 w-4 shrink-0 text-gold" />
              {VENUE_ADDRESS.full} — {VENUE_BUFFET_NOTE.toLowerCase()}
            </p>
            {stats && (
              <div className="mt-8 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <ProgressBar
                  value={stats.fundsCollected}
                  max={stats.fundraisingGoal}
                  label={`${formatFcfa(stats.fundsCollected)} collectés`}
                />
                <p className="mt-2 text-xs text-white/50">
                  Objectif {formatFcfa(stats.fundraisingGoal)}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="page-main bg-gradient-to-b from-gold-soft/20 to-background">
          <div className="mb-8">
            <h2 className="section-title">
              Choisissez votre formule
            </h2>
            <p className="mt-1 text-muted-foreground">
              Paiement en espèces à la caisse · validité 6 mois · 1 repas/jour
            </p>
          </div>

          {formulas.length === 0 ? (
            <div className="card-elevated p-8 text-center text-muted-foreground">
              <p>Base de données non configurée.</p>
              <p className="mt-2 text-sm">
                <code>npx prisma migrate dev && npx prisma db seed</code>
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {formulas.map((f) => (
                <FormulaCard key={f.formulaId} formula={f} />
              ))}
            </div>
          )}
        </section>

        <VenueAboutSection variant="light" />
      </main>
      <SiteFooter />
    </div>
  );
}
