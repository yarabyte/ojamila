"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { subscribeSelfService } from "@/app/actions/subscription";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormulaAvailability } from "@/lib/services";
import { VENUE_NAME } from "@/lib/venue";
import { Info } from "lucide-react";

export function SubscribeForm({
  formula,
}: {
  formula: FormulaAvailability;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cgu, setCgu] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("cguAccepted", cgu ? "true" : "false");
    const result = await subscribeSelfService(formData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/subscribe/confirmation/${result.data.subscriptionId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="formulaId" value={formula.formulaId} />

      {formula.isHardCapReached ? (
        <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <Info className="h-5 w-5 shrink-0 text-warning" />
          <p>
            Formule complète — vous serez inscrit sur la{" "}
            <strong>liste d&apos;attente</strong>.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-gold-soft/60 px-4 py-3 text-sm">
          <span className="badge-success mr-2">Disponible</span>
          {formula.remainingSlots} place{formula.remainingSlots > 1 ? "s" : ""}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" name="name" required placeholder="Ex. Marie Nguema" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Numéro WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="6XX XXX XXX"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <Checkbox
          id="cgu"
          checked={cgu}
          onCheckedChange={(v) => setCgu(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="cgu" className="text-sm font-normal leading-snug">
          J&apos;accepte les{" "}
          <Link
            href="/cgu"
            className="font-medium text-gold-deep underline"
            target="_blank"
          >
            Conditions Générales
          </Link>
        </Label>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading || !cgu}>
        {loading ? "Enregistrement…" : "Confirmer ma souscription"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Paiement en espèces à la caisse {VENUE_NAME}
      </p>
    </form>
  );
}
