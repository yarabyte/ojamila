"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/client/qr", label: "Mon QR", icon: QrCode, exact: false },
  { href: "/client", label: "Abonnements", icon: LayoutGrid, exact: true },
  { href: "/", label: "Formules", icon: Home, exact: true },
];

export function ClientNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold/30 bg-black-deep pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-6px_28px_rgba(0,0,0,0.45)]"
      aria-label="Navigation client"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active =
            href === "/client/qr"
              ? pathname === "/client/qr" ||
                pathname.startsWith("/client/subscription/")
              : exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-h-[62px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-t-xl px-1 py-2 text-xs font-bold transition-colors sm:text-[13px]",
                active ? "text-gold" : "text-white/80"
              )}
            >
              {active && (
                <span className="absolute inset-x-4 top-0 h-1 rounded-full bg-gold" />
              )}
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-gold/20" : "bg-white/5"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-gold")} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
