"use client";

import { useState } from "react";
import { upsertFormula } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Formula } from "@prisma/client";

export function FormulaForm({ formula }: { formula?: Formula }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await upsertFormula(
      new FormData(e.currentTarget),
      formula?.id
    );
    setLoading(false);
    if (!result.success) setError(result.error);
    else window.location.href = "/admin/formulas";
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" defaultValue={formula?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mealsIncluded">Repas inclus</Label>
          <Input
            id="mealsIncluded"
            name="mealsIncluded"
            type="number"
            defaultValue={formula?.mealsIncluded ?? 15}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bonusMeals">Bonus</Label>
          <Input
            id="bonusMeals"
            name="bonusMeals"
            type="number"
            defaultValue={formula?.bonusMeals ?? 0}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="priceFcfa">Prix FCFA</Label>
        <Input
          id="priceFcfa"
          name="priceFcfa"
          type="number"
          defaultValue={formula?.priceFcfa}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salesTarget">Objectif vente</Label>
          <Input
            id="salesTarget"
            name="salesTarget"
            type="number"
            defaultValue={formula?.salesTarget}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hardCap">Plafond</Label>
          <Input
            id="hardCap"
            name="hardCap"
            type="number"
            defaultValue={formula?.hardCap}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dailyMealLimit">Limite/jour (vide = global)</Label>
          <Input
            id="dailyMealLimit"
            name="dailyMealLimit"
            type="number"
            defaultValue={formula?.dailyMealLimit ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validityDays">Validité (jours)</Label>
          <Input
            id="validityDays"
            name="validityDays"
            type="number"
            defaultValue={formula?.validityDays ?? 180}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Ordre</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={formula?.sortOrder ?? 0}
        />
      </div>
      {formula && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={formula.active} />
          Active
        </label>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "…" : formula ? "Enregistrer" : "Créer"}
      </Button>
    </form>
  );
}
