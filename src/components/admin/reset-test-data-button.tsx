"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetTestDataAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export function ResetTestDataButton({
  testPeriodEndsAt,
}: {
  testPeriodEndsAt: Date;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const endLabel = testPeriodEndsAt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function reset() {
    const confirmed = window.confirm(
      "Réinitialiser toutes les données de test ?\n\n" +
        "Seront supprimés : abonnements, repas offerts, consommations, clients et codes OTP.\n" +
        "Formules, staff et admin seront conservés.\n\n" +
        "Cette action est irréversible."
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setDone(null);

    const result = await resetTestDataAction();
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setDone(
      `${result.data.subscriptions} abonnement(s), ${result.data.consumptions} consommation(s) et ${result.data.clients} client(s) supprimés.`
    );
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="font-semibold text-foreground">
            Fin de la période de test
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La période de test s&apos;est terminée le{" "}
            <strong className="text-foreground">{endLabel}</strong>. Vous
            pouvez effacer les données de démonstration avant le lancement
            réel.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="destructive"
        className="gap-2"
        onClick={reset}
        disabled={loading || !!done}
      >
        <RotateCcw className="h-4 w-4" />
        {loading ? "Réinitialisation…" : "Réinitialiser les données de test"}
      </Button>

      {done && (
        <p className="rounded-xl bg-success/15 px-3 py-2 text-sm text-success">
          {done}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
