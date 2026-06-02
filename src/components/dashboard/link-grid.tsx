import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export type DashboardLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: number;
  variant?: "default" | "highlight" | "admin";
};

export function DashboardLinkGrid({
  links,
  className,
  dark = false,
}: {
  links: DashboardLink[];
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {links.map(
        ({ href, label, description, icon: Icon, badge, variant = "default" }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex items-center gap-4 rounded-2xl border p-4 transition-all active:scale-[0.99]",
              dark && "shadow-[0_2px_12px_rgba(0,0,0,0.25)]",
              variant === "highlight" &&
                (dark
                  ? "border-warning/40 bg-warning/10 hover:border-warning/50 hover:bg-warning/15"
                  : "border-warning/40 bg-warning/5 hover:bg-warning/10"),
              variant === "admin" &&
                (dark
                  ? "border-gold/30 bg-gold/5 hover:border-gold/40 hover:bg-gold/10"
                  : "border-gold/40 bg-gold-soft/40 hover:bg-gold-soft/70"),
              variant === "default" &&
                (dark
                  ? "border-white/10 bg-white/[0.04] hover:border-gold/35 hover:bg-white/[0.07]"
                  : "card-elevated hover:border-gold/40")
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                variant === "highlight" &&
                  (dark
                    ? "bg-warning/20 text-amber-200 ring-warning/25"
                    : "bg-warning/20 text-warning ring-warning/20"),
                variant === "admin" &&
                  (dark
                    ? "bg-gold/20 text-gold ring-gold/25"
                    : "bg-gold/25 text-black-deep ring-gold/30"),
                variant === "default" &&
                  (dark
                    ? "bg-gold/15 text-gold ring-gold/20"
                    : "bg-gold/25 text-black-deep ring-gold/20")
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "font-semibold leading-tight",
                    dark
                      ? "text-white group-hover:text-gold"
                      : "text-foreground"
                  )}
                >
                  {label}
                </p>
                {badge !== undefined && badge > 0 && (
                  <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-0.5 line-clamp-2 text-xs leading-relaxed",
                  dark ? "text-white/55" : "text-muted-foreground"
                )}
              >
                {description}
              </p>
            </div>
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-opacity",
                dark
                  ? "text-white/25 group-hover:text-gold/70"
                  : "text-muted-foreground/50 group-hover:text-muted-foreground"
              )}
            />
          </Link>
        )
      )}
    </div>
  );
}
