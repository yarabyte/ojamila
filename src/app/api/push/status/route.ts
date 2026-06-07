import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { prisma } from "@/lib/db";
import { getVapidPublicKey, pushService } from "@/lib/services";

async function resolveUserId(): Promise<string | null> {
  const session = await getServerAuthSession();
  if (session?.user?.id) return session.user.id;

  const phone = await getClientPhoneFromCookies();
  if (!phone) return null;

  const user = await prisma.user.findUnique({ where: { phone } });
  return user?.id ?? null;
}

export async function GET() {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const configured = pushService.isConfigured();
  const subscribed = configured
    ? await pushService.hasSubscription(userId)
    : false;

  return NextResponse.json({
    configured,
    subscribed,
    publicKey: getVapidPublicKey(),
  });
}
