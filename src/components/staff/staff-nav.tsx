"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/staff", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/staff/scan", label: "Scan", icon: Camera },
  {
    href: "/staff/pending",
    label: "Paiements",
    icon: CreditCard,
    badgeKey: "pending" as const,
  },
  { href: "/staff/subscribe", label: "Souscrire", icon: UserPlus },
  { href: "/staff/waitlist", label: "Attente", icon: ClipboardList },
];

export function StaffNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(35,31,32,0.08)]">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-0.5 pt-0.5">
        {links.map(({ href, label, icon: Icon, exact, badgeKey }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          const badge =
            badgeKey === "pending" && pendingCount > 0 ? pendingCount : 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-t-lg px-0.5 py-2 text-[10px] font-semibold transition-colors",
                active ? "nav-staff-item-active" : "nav-staff-item"
              )}
            >
              {active && (
                <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-gold" />
              )}
              <span className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-gold-deep" : "text-muted-foreground"
                  )}
                />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
