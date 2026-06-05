"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { subscribeAtCounter } from "@/app/actions/staff";
import { ActionOverlay } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormulaAvailability } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";

export function CounterSubscribeForm({
  formulas,
}: {
  formulas: FormulaAvailability[];
}) {
  const router = useRouter();
  const [formulaId, setFormulaId] = useState(formulas[0]?.formulaId ?? "");
  const [cgu, setCgu] = useState(false);
  const [paid, setPaid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = formulas.find((f) => f.formulaId === formulaId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("formulaId", formulaId);
    formData.set("cguAccepted", cgu ? "true" : "false");
    formData.set("markAsPaid", paid ? "true" : "false");
    const result = await subscribeAtCounter(formData);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/staff/subscribe/done/${result.data.subscriptionId}`);
  }

  return (
    <>
    <ActionOverlay
      open={loading}
      message="Création de l'abonnement…"
      detail="Enregistrement du client et réservation de la place."
    />
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Formule</Label>
        <select
          value={formulaId}
          onChange={(e) => setFormulaId(e.target.value)}
          className="flex h-12 w-full rounded-xl border border-input bg-card px-4 text-black"
        >
          {formulas.map((f) => (
            <option key={f.formulaId} value={f.formulaId}>
              {f.name} — {formatFcfa(f.priceFcfa)}
              {f.isHardCapReached ? " (liste d'attente)" : ` (${f.remainingSlots} places)`}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <p className="text-sm text-muted-foreground">
          {selected.totalMeals} repas ·{" "}
          {selected.isHardCapReached
            ? "Sera en liste d'attente"
            : `${selected.remainingSlots} place(s)`}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nom client</Label>
        <Input id="name" name="name" required className="bg-card text-black" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">WhatsApp</Label>
        <Input id="phone" name="phone" type="tel" required className="bg-card text-black" />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id="cgu" checked={cgu} onCheckedChange={(v) => setCgu(v === true)} />
        <Label htmlFor="cgu" className="text-sm font-normal">
          CGU acceptées —{" "}
          <Link href="/cgu" className="text-gold underline" target="_blank">
            voir
          </Link>
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Checkbox id="paid" checked={paid} onCheckedChange={(v) => setPaid(v === true)} />
        <Label htmlFor="paid" className="font-normal">
          Encaissé en espèces (activer)
        </Label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading || !cgu}>
        {loading ? "Création…" : "Créer l'abonnement"}
      </Button>
    </form>
    </>
  );
}
