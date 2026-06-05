import Link from "next/link";
import { VenueContactBlock, VenueServicesList } from "@/components/venue-info";
import { VENUE_BUFFET_NOTE, VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-gold/20 bg-black-deep text-white",
        className
      )}
    >
      <div className="container-app py-10 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div>
            <p className="font-display text-2xl font-semibold text-gold">
              {VENUE_NAME}
            </p>
            <p className="mt-2 text-sm text-white/70">{VENUE_BUFFET_NOTE}</p>
            <VenueServicesList
              className="mt-5"
              chipClassName="border-gold/25 bg-gold/10 text-gold-soft"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold/80">
              Contact & informations
            </p>
            <VenueContactBlock variant="dark" className="mt-4" />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
            <Link href="/formules" className="hover:text-gold">
              Formules
            </Link>
            <Link href="/client" className="hover:text-gold">
              Espace client
            </Link>
            <Link href="/cgu" className="hover:text-gold">
              CGU
            </Link>
            <Link href="/staff" className="hover:text-gold">
              Caisse
            </Link>
            <Link href="/login" className="hover:text-gold">
              Admin
            </Link>
          </nav>
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} {VENUE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
