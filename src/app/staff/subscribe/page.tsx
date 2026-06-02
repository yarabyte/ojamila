import { subscriptionService } from "@/lib/services";
import { CounterSubscribeForm } from "@/components/staff/counter-subscribe-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function StaffSubscribePage() {
  const formulas = await subscriptionService.listFormulasAvailability();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <PageHeader
        title="Nouvelle souscription"
        description="Comptoir — paiement espèces"
      />
      <div className="staff-card p-4">
        <CounterSubscribeForm formulas={formulas} />
      </div>
    </main>
  );
}
