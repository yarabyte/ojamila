import Image from "next/image";
import Link from "next/link";
import { VENUE_ADDRESS, VENUE_BUFFET_NOTE, VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";
import { ChevronRight, Lock, UserCircle, UtensilsCrossed } from "lucide-react";

const menuItems = [
  {
    href: "/formules",
    title: "Souscrire à une formule partenaire",
    description: "Découvrez les offres et réservez votre abonnement repas.",
    icon: UtensilsCrossed,
  },
  {
    href: "/client",
    title: "Se connecter comme client",
    description: "Accédez à vos abonnements, QR codes et repas offerts.",
    icon: UserCircle,
  },
  {
    href: "/login",
    title: "Accès administrateur",
    description: "Espace caisse et gestion pour le staff Ô JAMILA.",
    icon: Lock,
  },
] as const;

export function HomeMenu({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col bg-background",
        className
      )}
    >
      <header className="border-b border-gold/30 bg-black-deep px-4 py-4 text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] sm:px-6">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Image
            src="/logo.svg"
            alt={VENUE_NAME}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full ring-1 ring-gold/50"
            priority
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold text-gold sm:text-xl">
              {VENUE_NAME}
            </h1>
            <p className="truncate text-[11px] text-white/75 sm:text-xs">
              {VENUE_ADDRESS.city} · Abonnements repas
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Choisissez une action pour continuer
        </p>

        <div className="animate-stagger flex flex-1 flex-col gap-4">
          {menuItems.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card-interactive group flex items-center gap-4 p-5 sm:p-6"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-soft via-gold/25 to-gold-soft/60 shadow-inner">
                <Icon className="h-7 w-7 text-gold-deep transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-semibold leading-snug text-foreground sm:text-lg">
                  {title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gold-deep/60 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-deep" />
            </Link>
          ))}
        </div>

        <p className="safe-bottom-splash mt-8 border-t border-gold/20 pt-6 text-center text-xs text-muted-foreground">
          {VENUE_BUFFET_NOTE}
        </p>
      </main>
    </div>
  );
}
