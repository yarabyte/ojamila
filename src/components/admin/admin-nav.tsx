"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  Users,
  ClipboardList,
  CreditCard,
  List,
  ScanLine,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/formulas", label: "Formules", icon: Package },
  { href: "/admin/subscriptions", label: "Abonnements", icon: List, match: "subscriptions" as const },
  {
    href: "/admin/subscriptions?status=PENDING_PAYMENT",
    label: "Paiements",
    icon: CreditCard,
    match: "pending" as const,
  },
  { href: "/admin/waitlist", label: "Liste d'attente", icon: ClipboardList },
  { href: "/admin/thank-you", label: "Remerciements", icon: Heart },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

function isLinkActive(
  link: (typeof links)[number],
  pathname: string,
  status: string | null
): boolean {
  if (link.exact) return pathname === "/admin";
  if (link.match === "pending") {
    return (
      pathname.startsWith("/admin/subscriptions") &&
      status === "PENDING_PAYMENT"
    );
  }
  if (link.match === "subscriptions") {
    return (
      pathname.startsWith("/admin/subscriptions") &&
      status !== "PENDING_PAYMENT"
    );
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-gold/25 bg-black-deep md:flex">
      <div className="border-b border-gold/20 px-4 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt=""
            width={40}
            height={40}
            className="rounded-full ring-1 ring-gold/50"
          />
          <div>
            <p className="font-display text-lg font-semibold leading-tight text-gold">
              JAMILA
            </p>
            <p className="text-[11px] font-medium text-gold-soft">Administration</p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gold/60">
          Gestion
        </p>
        {links.map((link) => {
          const active = isLinkActive(link, pathname, status);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "nav-admin-item",
                active && "nav-admin-item-active"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-black-deep" : "text-gold"
                )}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gold/20 p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gold/60">
          Caisse
        </p>
        <Link href="/staff" className="nav-admin-item">
          <ScanLine className="h-[18px] w-[18px] shrink-0 text-gold" />
          <span>Espace staff</span>
        </Link>
        <Link href="/" className="nav-admin-item mt-0.5">
          <span className="text-gold">↗</span>
          <span>Site public</span>
        </Link>
      </div>
    </aside>
  );
}
