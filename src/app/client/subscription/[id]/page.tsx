import { notFound, redirect } from "next/navigation";
import { ClientQrView } from "@/components/client/client-qr-view";
import { prisma } from "@/lib/db";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { subscriptionService } from "@/lib/services";

export default async function ClientSubscriptionPage({
  params,
}: {
  params: { id: string };
}) {
  const phone = await getClientPhoneFromCookies();
  const sub = await subscriptionService.getById(params.id);
  if (!sub) notFound();

  if (phone && sub.client.phone !== phone) {
    redirect("/client");
  }

  const consumptions = await prisma.consumption.findMany({
    where: { subscriptionId: sub.id },
    orderBy: { consumedAt: "desc" },
    take: 20,
  });

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <ClientQrView sub={sub} showBackLink />

      <section className="card-elevated p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Historique</h2>
        {consumptions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun repas consommé.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {consumptions.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-gold/20 px-3 py-2.5 text-sm"
              >
                {c.consumedAt.toLocaleString("fr-FR")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
