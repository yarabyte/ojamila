import Link from "next/link";
import { Camera, CreditCard, ChevronRight } from "lucide-react";
import { VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatTodayFr(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function StaffDashboardHero({
  name,
  pendingCount,
}: {
  name: string;
  pendingCount: number;
}) {
  const firstName = name.split(/\s+/)[0] ?? name;

  return (
    <section className="staff-hero">
      <div className="staff-hero-glow" aria-hidden />
      <div className="relative space-y-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-deep">
            {VENUE_NAME} · Caisse
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            {getGreeting()},{" "}
            <span className="text-gold-deep">{firstName}</span>
          </h1>
          <p className="mt-1.5 text-sm capitalize text-muted-foreground">
            {formatTodayFr()}
          </p>
        </div>

        <Link href="/staff/scan" className="staff-cta-primary group">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40 ring-1 ring-gold/30">
            <Camera className="h-6 w-6 text-black-deep" />
          </span>
          <span className="flex-1 text-left">
            <span className="block font-semibold text-black-deep">
              Scanner un repas
            </span>
            <span className="block text-xs font-medium text-black-deep/65">
              QR client ou code secours
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-black-deep/50 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {pendingCount > 0 && (
          <Link
            href="/staff/pending"
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
              "border-warning/40 bg-warning/10 hover:bg-warning/15"
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15">
              <CreditCard className="h-4 w-4 text-warning" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-warning">
                {pendingCount} paiement{pendingCount > 1 ? "s" : ""} à encaisser
              </span>
              <span className="text-xs text-warning/80">
                Confirmer les espèces en caisse
              </span>
            </span>
            <span className="staff-pulse-dot" aria-hidden />
            <ChevronRight className="h-4 w-4 shrink-0 text-warning/70" />
          </Link>
        )}
      </div>
    </section>
  );
}
