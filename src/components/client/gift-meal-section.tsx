import { GiftMealForm } from "@/components/client/gift-meal-form";
import { giftService } from "@/lib/services";
import { Gift } from "lucide-react";

export async function GiftMealSection({
  subscriptionId,
  mealsRemaining,
}: {
  subscriptionId: string;
  mealsRemaining: number;
}) {
  const pendingGifts = await giftService.listPendingGifts(subscriptionId);

  return (
    <section className="card-elevated space-y-4 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-soft">
          <Gift className="h-4 w-4 text-gold-deep" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold">Offrir un repas</h2>
          <p className="text-xs text-muted-foreground">
            QR à usage unique envoyé par WhatsApp
          </p>
        </div>
      </div>

      <GiftMealForm
        subscriptionId={subscriptionId}
        mealsRemaining={mealsRemaining}
      />

      {pendingGifts.length > 0 && (
        <div className="border-t border-gold/15 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Repas offerts en attente
          </p>
          <ul className="space-y-2">
            {pendingGifts.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between rounded-xl border border-gold/20 px-3 py-2 text-sm"
              >
                <span className="truncate text-muted-foreground">
                  {g.recipientPhone}
                </span>
                <span className="shrink-0 font-mono text-xs text-foreground">
                  {g.shortCode}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
