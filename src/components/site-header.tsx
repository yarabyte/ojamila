import Image from "next/image";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { VENUE_ADDRESS, VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Formules" },
  { href: "/client", label: "Mon espace" },
  { href: "/cgu", label: "CGU" },
];

export async function SiteHeader({
  activePath,
}: {
  activePath?: string;
}) {
  const session = await getServerAuthSession();
  const staffHref =
    session?.user.role === "ADMIN" ? "/admin" : "/staff";

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-black-deep/95 text-white backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/logo.svg"
            alt={VENUE_NAME}
            width={44}
            height={44}
            className="rounded-full ring-1 ring-gold/40"
            priority
          />
          <div className="hidden sm:block">
            <p className="font-display text-lg font-semibold leading-tight text-gold">
              {VENUE_NAME}
            </p>
            <p className="text-[11px] text-white/60">
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
                "text-sm font-medium text-gold-soft transition-colors hover:text-gold",
                activePath === href && "text-gold"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={staffHref}
            className="hidden rounded-lg border border-gold/40 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/10 sm:inline-flex"
          >
            {session ? "Tableau de bord" : "Caisse"}
          </Link>
          {!session && (
            <Link
              href="/login"
              className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-gold-deep"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {publicLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-gold-soft",
              activePath === href && "bg-gold/20 text-gold"
            )}
          >
            {label}
          </Link>
        ))}
        <Link
          href={staffHref}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-gold"
        >
          Caisse
        </Link>
      </nav>
    </header>
  );
}
