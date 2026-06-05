import Image from "next/image";
import Link from "next/link";
import { VENUE_ADDRESS, VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";
import { Lock, UserCircle, UtensilsCrossed } from "lucide-react";

const menuItems = [
  {
    href: "/formules",
    title: "Souscrire à une formule partenaire",
    description: "Découvrez les offres et réservez votre abonnement repas.",
    icon: UtensilsCrossed,
    accent: "from-gold-soft to-gold/30",
  },
  {
    href: "/client",
    title: "Se connecter comme client",
    description: "Accédez à vos abonnements, QR codes et repas offerts.",
    icon: UserCircle,
    accent: "from-white to-gold-soft/60",
  },
  {
    href: "/login",
    title: "Accès administrateur",
    description: "Espace caisse et gestion pour le staff Ô JAMILA.",
    icon: Lock,
    accent: "from-black-deep/5 to-gold-soft/40",
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
      <header className="border-b border-gold/20 bg-black-deep px-4 py-5 text-white sm:px-6">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Image
            src="/logo.svg"
            alt={VENUE_NAME}
            width={48}
            height={48}
            className="rounded-full ring-1 ring-gold/50"
            priority
          />
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold text-gold">
              {VENUE_NAME}
            </h1>
            <p className="truncate text-xs text-white/70">
              {VENUE_ADDRESS.city} · Abonnements repas
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Choisissez une action pour continuer
        </p>

        <div className="flex flex-1 flex-col gap-4">
          {menuItems.map(({ href, title, description, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group card-elevated flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
            >
              <span
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner",
                  accent
                )}
              >
                <Icon className="h-7 w-7 text-gold-deep transition-transform group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block font-display text-base font-semibold leading-snug text-foreground sm:text-lg">
                  {title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
