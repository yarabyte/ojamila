import Link from "next/link";
import {
  APP_NAME,
  APP_TAGLINE,
  VENUE_ADDRESS,
  VENUE_EMAIL,
  VENUE_LEGAL,
  VENUE_NAME,
  VENUE_PHONES,
  VENUE_SERVICES,
} from "@/lib/venue";
import { cn } from "@/lib/utils";
import { Mail, MapPin, Phone } from "lucide-react";

export function VenueServicesList({
  className,
  chipClassName,
}: {
  className?: string;
  chipClassName?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {VENUE_SERVICES.map((service) => (
        <li
          key={service}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            chipClassName
          )}
        >
          {service}
        </li>
      ))}
    </ul>
  );
}

export function VenueContactBlock({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const muted =
    variant === "dark" ? "text-white/65" : "text-muted-foreground";
  const text = variant === "dark" ? "text-white/90" : "text-foreground";
  const link =
    variant === "dark"
      ? "text-gold-soft hover:text-gold"
      : "text-gold-deep hover:underline";

  return (
    <div className={cn("space-y-4 text-sm", className)}>
      <div className={cn("flex items-start gap-2", text)}>
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <div>
          <p className="font-medium">{VENUE_ADDRESS.city}</p>
          <p className={muted}>{VENUE_ADDRESS.street}</p>
        </div>
      </div>

      <div className={cn("flex items-start gap-2", text)}>
        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p>
          {VENUE_PHONES.map((phone, i) => (
            <span key={phone.tel}>
              {i > 0 && " · "}
              <Link href={`tel:${phone.tel}`} className={link}>
                {phone.display}
              </Link>
            </span>
          ))}
        </p>
      </div>

      <div className={cn("flex items-start gap-2", text)}>
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <Link href={`mailto:${VENUE_EMAIL}`} className={link}>
          {VENUE_EMAIL}
        </Link>
      </div>

      <p className={cn("text-xs leading-relaxed", muted)}>
        RCCM : {VENUE_LEGAL.rccm} · NIU : {VENUE_LEGAL.niu}
      </p>
    </div>
  );
}

export function VenueAboutSection({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "border-t",
        isDark
          ? "border-gold/20 bg-black-deep text-white"
          : "border-border bg-gold-soft/30"
      )}
    >
      <div className="container-app py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-deep">
              {VENUE_NAME}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
              Cuisine du monde à Bonapriso
            </h2>
            <p
              className={cn(
                "mt-3 max-w-xl text-sm leading-relaxed sm:text-base",
                isDark ? "text-white/70" : "text-muted-foreground"
              )}
            >
              {VENUE_NAME} vous accueille à Douala pour une expérience
              gastronomique variée : restaurant, lounge, traiteur, plats à
              emporter, livraison et location d&apos;espace pour vos événements.
            </p>
            <VenueServicesList
              className="mt-5"
              chipClassName={
                isDark
                  ? "border-gold/30 bg-gold/10 text-gold-soft"
                  : "border-gold/40 bg-card text-foreground"
              }
            />
          </div>
          <div
            className={cn(
              "rounded-2xl border p-5 sm:p-6",
              isDark
                ? "border-white/10 bg-white/5"
                : "border-border bg-card shadow-card"
            )}
          >
            <h3 className="font-display text-lg font-semibold">Contact</h3>
            <VenueContactBlock variant={variant} className="mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function VenueBrandLine({
  showApp = true,
  className,
}: {
  showApp?: boolean;
  className?: string;
}) {
  return (
    <p className={className}>
      <span className="font-display font-semibold text-gold">{VENUE_NAME}</span>
      {showApp && (
        <span className="text-muted-foreground">
          {" "}
          · {APP_NAME} {APP_TAGLINE.toLowerCase()}
        </span>
      )}
    </p>
  );
}
