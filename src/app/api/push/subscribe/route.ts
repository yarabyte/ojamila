import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { prisma } from "@/lib/db";
import { pushService } from "@/lib/services";
import { z } from "zod";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

async function resolveUserId(): Promise<string | null> {
  const session = await getServerAuthSession();
  if (session?.user?.id) return session.user.id;

  const phone = await getClientPhoneFromCookies();
  if (!phone) return null;

  const user = await prisma.user.findUnique({ where: { phone } });
  return user?.id ?? null;
}

export async function POST(req: Request) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!pushService.isConfigured()) {
    return NextResponse.json(
      { error: "Push non configuré (clés VAPID manquantes)" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Subscription invalide" }, { status: 400 });
    }

    await pushService.saveSubscription(userId, parsed.data);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
