import Link from "next/link";
import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StaffNav } from "@/components/staff/staff-nav";
import { PushSubscribeButton } from "@/components/staff/push-subscribe-button";
import { VENUE_NAME } from "@/lib/venue";
import { LogOut } from "lucide-react";
import Image from "next/image";
import type { Viewport } from "next";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#FBFAED",
};

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login?callbackUrl=/staff");

  const pendingCount = await prisma.subscription.count({
    where: { status: SubscriptionStatus.PENDING_PAYMENT },
  });

  return (
    <div className="staff-shell safe-bottom min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/staff" className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt=""
              width={32}
              height={32}
              className="rounded-full ring-1 ring-gold/50"
            />
            <div>
              <p className="font-display text-sm font-semibold leading-none text-gold-deep">
                Caisse {VENUE_NAME}
              </p>
              <p className="mt-0.5 max-w-[10rem] truncate text-[11px] text-muted-foreground">
                {session.user.name}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <PushSubscribeButton />
            <Link
              href="/logout?callbackUrl=/login"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gold-soft hover:text-foreground"
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>
      <div className="min-h-[calc(100vh-8rem)]">{children}</div>
      <StaffNav pendingCount={pendingCount} />
    </div>
  );
}
