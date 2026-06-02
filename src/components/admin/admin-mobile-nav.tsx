"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Camera,
  CreditCard,
  LayoutDashboard,
  List,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Accueil", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/subscriptions?status=PENDING_PAYMENT",
    label: "Paiements",
    icon: CreditCard,
    match: "pending" as const,
  },
  { href: "/admin/subscriptions", label: "Liste", icon: List, match: "subscriptions" as const },
  { href: "/admin/waitlist", label: "Attente", icon: ClipboardList },
  { href: "/staff/scan", label: "Scan", icon: Camera },
];

function isActive(
  link: (typeof links)[number],
  pathname: string,
  status: string | null
) {
  if (link.exact) return pathname === "/admin";
  if (link.match === "pending") {
    return pathname.startsWith("/admin/subscriptions") && status === "PENDING_PAYMENT";
  }
  if (link.match === "subscriptions") {
    return pathname.startsWith("/admin/subscriptions") && status !== "PENDING_PAYMENT";
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold/30 bg-black-deep pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex justify-around px-1 pt-1">
        {links.map((link) => {
          const { href, label, icon: Icon } = link;
          const active = isActive(link, pathname, status);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-[56px] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium",
                active ? "text-gold" : "text-gold-soft"
              )}
            >
              {active && (
                <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-gold" />
              )}
              <Icon className={cn("h-5 w-5", !active && "opacity-80")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
