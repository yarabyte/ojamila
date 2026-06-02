import { FormulaForm } from "@/components/admin/formula-form";

export default function NewFormulaPage() {
  return (
    <div className="space-y-6 pb-16">
      <h1 className="font-display text-2xl font-semibold">Nouvelle formule</h1>
      <FormulaForm />
    </div>
  );
}
