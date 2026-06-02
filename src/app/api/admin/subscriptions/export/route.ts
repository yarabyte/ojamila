import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subscriptionService } from "@/lib/services";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const subs = await prisma.subscription.findMany({
    include: { client: true, formula: true },
    orderBy: { createdAt: "desc" },
  });

  const header =
    "id,client,phone,formula,status,totalMeals,mealsConsumed,remaining,shortCode,createdAt,expiresAt\n";
  const rows = subs
    .map((s) => {
      const remaining = subscriptionService.mealsRemaining(s);
      return [
        s.id,
        `"${s.client.name.replace(/"/g, '""')}"`,
        s.client.phone,
        `"${s.formula.name}"`,
        s.status,
        s.totalMeals,
        s.mealsConsumed,
        remaining,
        s.shortCode,
        s.createdAt.toISOString(),
        s.expiresAt?.toISOString() ?? "",
      ].join(",");
    })
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="abonnements-jamila.csv"',
    },
  });
}
