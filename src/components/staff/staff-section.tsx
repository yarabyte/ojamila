import { cn } from "@/lib/utils";

export function StaffSection({
  title,
  subtitle,
  variant = "default",
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  variant?: "default" | "admin";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.15em]",
              variant === "admin" ? "text-gold-deep" : "text-muted-foreground"
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
