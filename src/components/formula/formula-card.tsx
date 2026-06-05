import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { FormulaAvailability } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";
import { Clock, UtensilsCrossed } from "lucide-react";

export function FormulaCard({ formula: f }: { formula: FormulaAvailability }) {
  const waitlist = f.isHardCapReached;

  return (
    <article className="card-interactive group relative flex flex-col overflow-hidden">
      {f.isAtSalesTarget && !waitlist && (
        <span className="badge-gold absolute right-4 top-4 z-10 shadow-sm">
          Populaire
        </span>
      )}

      <div className="border-b border-gold/25 bg-gradient-to-br from-gold-soft/90 to-gold-soft/40 px-5 py-5">
        <h2 className="pr-20 font-display text-xl font-semibold">{f.name}</h2>
        <p className="mt-2 font-display text-2xl font-semibold text-gold-deep">
          {formatFcfa(f.priceFcfa)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Paiement espèces à la caisse</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UtensilsCrossed className="h-4 w-4 text-gold-deep" />
          <span>
            <strong className="text-foreground">{f.totalMeals}</strong> repas
            buffet midi
          </span>
        </div>

        {waitlist ? (
          <p className="alert-warning font-medium">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            Complet — rejoindre la liste d&apos;attente
          </p>
        ) : (
          <p className="alert-success font-medium">
            {f.remainingSlots} place{f.remainingSlots > 1 ? "s" : ""} disponible
            {f.remainingSlots > 1 ? "s" : ""}
          </p>
        )}

        <Button
          asChild
          size="lg"
          variant={waitlist ? "waitlist" : "default"}
          className="mt-auto w-full gap-2"
        >
          <Link href={`/subscribe/${f.formulaId}`}>
            {waitlist ? (
              <>
                <Clock className="h-4 w-4" />
                Liste d&apos;attente
              </>
            ) : (
              <>
                <UtensilsCrossed className="h-4 w-4" />
                Choisir cette formule
              </>
            )}
          </Link>
        </Button>
      </div>
    </article>
  );
}
