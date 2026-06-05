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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold/25 bg-black-deep/95 pb-[env(safe-area-inset-bottom)] text-white backdrop-blur-md"
      aria-label="Navigation client"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
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
                "relative flex min-h-[60px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-t-xl px-1 py-2 text-[11px] font-semibold transition-colors",
                active ? "text-gold" : "text-white/65"
              )}
            >
              {active && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gold" />
              )}
              <Icon className={cn("h-6 w-6", active && "text-gold")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
