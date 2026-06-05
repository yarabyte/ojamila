"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileText,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  QrCode,
  Store,
  X,
} from "lucide-react";
import { VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
};

function isActive(pathname: string, href: string, custom?: (p: string) => boolean) {
  if (custom) return custom(pathname);
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  staffHref,
  hasStaffSession,
  clientLoggedIn,
}: {
  staffHref: string;
  hasStaffSession: boolean;
  clientLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navItems: NavItem[] = [
    {
      href: "/client/qr",
      label: "Mon QR",
      icon: QrCode,
      match: (p) =>
        p === "/client/qr" || p.startsWith("/client/subscription/"),
    },
    {
      href: "/client",
      label: "Mes abonnements",
      icon: LayoutGrid,
      match: (p) => p === "/client",
    },
    { href: "/", label: "Formules", icon: Home },
    { href: "/cgu", label: "CGU", icon: FileText },
    {
      href: staffHref,
      label: hasStaffSession ? "Tableau de bord" : "Caisse",
      icon: Store,
    },
  ];

  if (!hasStaffSession) {
    navItems.push({ href: "/login", label: "Connexion staff", icon: LogIn });
  }

  async function logout() {
    await fetch("/api/client/logout", { method: "POST" });
    setOpen(false);
    router.push("/client");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-gold transition-colors hover:bg-white/15 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col bg-black-deep shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.svg"
                  alt={VENUE_NAME}
                  width={40}
                  height={40}
                  className="rounded-full ring-1 ring-gold/50"
                />
                <div>
                  <p className="font-display text-base font-semibold text-gold">
                    {VENUE_NAME}
                  </p>
                  <p className="text-[11px] text-white/60">Menu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map(({ href, label, icon: Icon, match }) => {
                const active = isActive(pathname, href, match);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-semibold transition-colors",
                      active
                        ? "bg-gold text-black shadow-md"
                        : "text-white hover:bg-white/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        active ? "text-black" : "text-gold"
                      )}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {clientLoggedIn && (
              <div className="border-t border-white/10 p-3">
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-white/80 transition-colors hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5 text-gold" />
                  Déconnexion
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
