import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
  dark = false,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-2xl font-semibold sm:text-3xl",
              dark ? "text-gold" : "text-foreground"
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "mt-1 max-w-2xl text-sm sm:text-base",
                dark ? "text-white/60" : "text-muted-foreground"
              )}
            >
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
