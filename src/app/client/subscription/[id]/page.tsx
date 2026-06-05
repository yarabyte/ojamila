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

  const [consumptions, pendingGifts] = await Promise.all([
    prisma.consumption.findMany({
      where: { subscriptionId: sub.id },
      include: { mealGift: true },
      orderBy: { consumedAt: "desc" },
      take: 20,
    }),
    prisma.mealGift.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <ClientQrView sub={sub} showBackLink />

      <section className="card-elevated p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold">Historique</h2>
        {consumptions.length === 0 && pendingGifts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun repas consommé.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pendingGifts
              .filter((g) => g.status === "PENDING")
              .map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl border border-gold/30 bg-gold-soft/30 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium">Offert à {g.recipientPhone}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    En attente — expire le{" "}
                    {g.expiresAt.toLocaleDateString("fr-FR")}
                  </span>
                </li>
              ))}
            {consumptions.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-gold/20 px-3 py-2.5 text-sm"
              >
                {c.mealGift
                  ? `Repas offert utilisé — ${c.consumedAt.toLocaleString("fr-FR")}`
                  : c.consumedAt.toLocaleString("fr-FR")}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
