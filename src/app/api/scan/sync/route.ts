import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { consumptionService } from "@/lib/services";
import { z } from "zod";

const itemSchema = z.object({
  localId: z.string(),
  subscriptionId: z.string(),
  giftId: z.string().optional(),
  queuedAt: z.string(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1).max(50),
});

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user || !["STAFF", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
    }

    const results: {
      localId: string;
      success: boolean;
      error?: string;
      mealsRemaining?: number;
    }[] = [];

    for (const item of parsed.data.items) {
      try {
        const result = await consumptionService.consumeMeal(
          item.giftId
            ? { giftId: item.giftId }
            : { subscriptionId: item.subscriptionId },
          session.user.id
        );
        results.push({
          localId: item.localId,
          success: true,
          mealsRemaining: result.mealsRemaining,
        });
      } catch (e) {
        results.push({
          localId: item.localId,
          success: false,
          error: e instanceof Error ? e.message : "Erreur",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
