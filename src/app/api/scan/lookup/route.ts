import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { consumptionService } from "@/lib/services";
import { lookupSubscriptionSchema } from "@/lib/validators/consumption";

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user || !["STAFF", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = lookupSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const preview = await consumptionService.lookupForScan(parsed.data);
    return NextResponse.json(preview);
  } catch (e) {
    if (e instanceof AppError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.statusCode }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
