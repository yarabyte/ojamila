import Image from "next/image";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { VENUE_ADDRESS, VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Formules" },
  { href: "/client/qr", label: "Mon QR" },
  { href: "/client", label: "Mon espace" },
  { href: "/cgu", label: "CGU" },
];

function isLinkActive(href: string, activePath?: string): boolean {
  if (!activePath) return false;
  if (href === "/") return activePath === "/";
  return activePath === href || activePath.startsWith(`${href}/`);
}

export async function SiteHeader({
  activePath,
  /** Masque la barre d'onglets mobile (zone client avec nav basse) */
  compactMobile = false,
}: {
  activePath?: string;
  compactMobile?: boolean;
}) {
  const session = await getServerAuthSession();
  const staffHref =
    session?.user.role === "ADMIN" ? "/admin" : "/staff";

  return (
    <header className="sticky top-0 z-50 border-b border-gold/30 bg-black-deep text-white shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="container-app flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
          <Image
            src="/logo.svg"
            alt={VENUE_NAME}
            width={40}
            height={40}
            className="rounded-full ring-1 ring-gold/50 sm:h-11 sm:w-11"
            priority
          />
          <div className={cn(compactMobile ? "block min-w-0" : "hidden sm:block")}>
            <p className="truncate font-display text-base font-semibold leading-tight text-gold sm:text-lg">
              {VENUE_NAME}
            </p>
            <p className="truncate text-[10px] text-white/75 sm:text-[11px]">
              {VENUE_ADDRESS.city} · Abonnements repas
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {publicLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm font-semibold text-white/85 transition-colors hover:text-gold",
                isLinkActive(href, activePath) && "text-gold"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={staffHref}
            className="hidden rounded-lg border border-gold/50 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/15 sm:inline-flex"
          >
            {session ? "Tableau de bord" : "Caisse"}
          </Link>
          {!session && (
            <Link
              href="/login"
              className="rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-gold-deep"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>

      {!compactMobile && (
        <nav
          className="flex gap-1.5 overflow-x-auto border-t border-white/10 bg-black-deep px-3 py-2.5 md:hidden"
          aria-label="Navigation principale"
        >
          {publicLinks.map(({ href, label }) => {
            const active = isLinkActive(href, activePath);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-gold text-black shadow-sm"
                    : "bg-white/10 text-white hover:bg-white/15"
                )}
              >
                {label}
              </Link>
            );
          })}
          <Link
            href={staffHref}
            className="shrink-0 rounded-full border border-gold/50 bg-transparent px-4 py-2 text-sm font-semibold text-gold"
          >
            Caisse
          </Link>
        </nav>
      )}
    </header>
  );
}
