import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function IndeterminateBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Chargement en cours"
    >
      <div className="indeterminate-progress-bar h-full w-1/3 rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep" />
    </div>
  );
}

export function LoadingState({
  message = "Chargement…",
  detail,
  variant = "page",
  className,
}: {
  message?: string;
  detail?: string;
  variant?: "page" | "card" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" aria-hidden />
        <span className="text-muted-foreground">{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 py-10 text-center",
        variant === "card" && "rounded-2xl border border-border bg-card py-12 shadow-card",
        className
      )}
      aria-busy="true"
    >
      {variant === "page" && (
        <Image
          src="/logo.svg"
          alt=""
          width={40}
          height={40}
          className="mb-1 h-10 w-10 opacity-80"
          aria-hidden
        />
      )}
      <Loader2 className="h-10 w-10 animate-spin text-gold" aria-hidden />
      <div className="w-full max-w-xs space-y-3">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        {detail && (
          <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
        )}
        <IndeterminateBar />
      </div>
    </div>
  );
}

export function ActionOverlay({
  open,
  message,
  detail,
}: {
  open: boolean;
  message: string;
  detail?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-busy="true"
      aria-live="polite"
      aria-label={message}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gold/25 bg-card p-6 shadow-gold">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-gold" aria-hidden />
        <p className="mt-4 text-center text-sm font-semibold text-foreground">{message}</p>
        {detail && (
          <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
            {detail}
          </p>
        )}
        <div className="mt-4">
          <IndeterminateBar />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 w-2/3 rounded-lg bg-gold-soft/50" />
      <div className="h-4 w-full rounded bg-muted/80" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-gold-soft/30" />
      ))}
    </div>
  );
}
