import Image from "next/image";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { getServerAuthSession } from "@/lib/auth";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { VENUE_ADDRESS, VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/formules", label: "Formules" },
  { href: "/client/qr", label: "Mon QR" },
  { href: "/client", label: "Mon espace" },
  { href: "/cgu", label: "CGU" },
];

function isLinkActive(href: string, activePath?: string): boolean {
  if (!activePath) return false;
  if (href === "/formules") {
    return activePath === "/formules" || activePath.startsWith("/subscribe/");
  }
  if (href === "/") return activePath === "/";
  if (href === "/client/qr") {
    return (
      activePath === "/client/qr" ||
      activePath.startsWith("/client/subscription/")
    );
  }
  return activePath === href || activePath.startsWith(`${href}/`);
}

export async function SiteHeader({
  activePath,
}: {
  activePath?: string;
}) {
  const session = await getServerAuthSession();
  const clientPhone = await getClientPhoneFromCookies();
  const staffHref =
    session?.user.role === "ADMIN" ? "/admin" : "/staff";

  return (
    <header className="sticky top-0 z-50 border-b border-gold/30 bg-black-deep text-white shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="container-app flex h-14 items-center gap-3 sm:h-16">
        <AppSidebar
          staffHref={staffHref}
          hasStaffSession={!!session}
          clientLoggedIn={!!clientPhone}
        />

        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <Image
            src="/logo.svg"
            alt={VENUE_NAME}
            width={40}
            height={40}
            className="hidden rounded-full ring-1 ring-gold/50 sm:block sm:h-11 sm:w-11"
            priority
          />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold leading-tight text-gold sm:text-lg">
              {VENUE_NAME}
            </p>
            <p className="truncate text-[10px] text-white/75 sm:text-[11px]">
              {VENUE_ADDRESS.city} · Abonnements repas
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
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

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link
            href={staffHref}
            className="rounded-lg border border-gold/50 px-3 py-2 text-xs font-semibold text-gold transition-colors hover:bg-gold/15"
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
    </header>
  );
}
