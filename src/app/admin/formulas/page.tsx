import Link from "next/link";
import { deactivateFormula } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formulaService } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";

export default async function AdminFormulasPage() {
  const formulas = await formulaService.listAll();

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Formules</h1>
        <Button asChild>
          <Link href="/admin/formulas/new">Nouvelle formule</Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {formulas.map((f) => (
          <Card key={f.id} className={!f.active ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>{f.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {f.mealsIncluded}+{f.bonusMeals} repas · {formatFcfa(f.priceFcfa)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/admin/formulas/${f.id}`}>Modifier</Link>
                </Button>
                {f.active && (
                  <form
                    action={async () => {
                      "use server";
                      await deactivateFormula(f.id);
                    }}
                  >
                    <Button size="sm" variant="destructive" type="submit">
                      Désactiver
                    </Button>
                  </form>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Objectif {f.salesTarget} · Plafond {f.hardCap}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
