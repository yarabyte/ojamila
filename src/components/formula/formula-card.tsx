import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { FormulaAvailability } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";

export function FormulaCard({ formula: f }: { formula: FormulaAvailability }) {
  return (
    <article className="card-elevated group flex flex-col overflow-hidden">
      <div className="border-b border-gold/20 bg-gradient-to-br from-gold-soft/80 to-gold-soft/30 px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">{f.name}</h2>
          {f.isAtSalesTarget && !f.isHardCapReached && (
            <span className="badge-gold shrink-0">Populaire</span>
          )}
        </div>
        <p className="mt-2 font-display text-2xl font-semibold text-black">
          {formatFcfa(f.priceFcfa)}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UtensilsCrossed className="h-4 w-4 text-gold-deep" />
          <span>
            <strong className="text-foreground">{f.totalMeals}</strong> repas
            buffet midi
          </span>
        </div>

        {f.isHardCapReached ? (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            Complet — rejoindre la liste d&apos;attente
          </p>
        ) : (
          <p className="rounded-xl bg-success/10 px-3 py-2 text-sm font-medium text-success">
            {f.remainingSlots} place{f.remainingSlots > 1 ? "s" : ""} disponible
            {f.remainingSlots > 1 ? "s" : ""}
          </p>
        )}

        <Button asChild size="lg" className="mt-auto w-full">
          <Link href={`/subscribe/${f.formulaId}`}>
            {f.isHardCapReached ? "Liste d'attente" : "Choisir cette formule"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
