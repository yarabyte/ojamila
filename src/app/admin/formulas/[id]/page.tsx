import { notFound } from "next/navigation";
import { FormulaForm } from "@/components/admin/formula-form";
import { formulaService } from "@/lib/services";

export default async function EditFormulaPage({
  params,
}: {
  params: { id: string };
}) {
  let formula;
  try {
    formula = await formulaService.getById(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6 pb-16">
      <h1 className="font-display text-2xl font-semibold">
        Modifier — {formula.name}
      </h1>
      <FormulaForm formula={formula} />
    </div>
  );
}
