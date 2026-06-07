import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerAuthSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { PushSubscribeButton } from "@/components/staff/push-subscribe-button";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Suspense fallback={<aside className="hidden w-60 bg-black-deep md:block" />}>
        <AdminNav />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gold/20 bg-black-deep px-4 py-3 text-white md:px-6">
          <p className="text-sm text-gold-soft md:hidden">
            <span className="font-display font-semibold text-gold">JAMILA</span> Admin
          </p>
          <p className="hidden text-sm text-gold-soft md:block">
            Connecté · <span className="text-white">{session.user.name}</span>
          </p>
          <div className="flex items-center gap-2">
            <PushSubscribeButton />
            <Link
              href="/logout?callbackUrl=/login"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gold-soft transition-colors hover:bg-white/10 hover:text-gold"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>

      <Suspense fallback={null}>
        <AdminMobileNav />
      </Suspense>
    </div>
  );
}
