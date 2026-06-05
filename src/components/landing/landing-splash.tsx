import Image from "next/image";
import { IndeterminateBar } from "@/components/ui/loading-state";
import { VENUE_NAME } from "@/lib/venue";
import { cn } from "@/lib/utils";

export function LandingSplash({
  progress,
  className,
}: {
  progress?: number;
  className?: string;
}) {
  const showDeterminate = typeof progress === "number";

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6",
        className
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative animate-scale-in">
          <div
            className="absolute -inset-8 rounded-full bg-gold/15 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -inset-2 rounded-full ring-1 ring-gold/20"
            aria-hidden
          />
          <Image
            src="/logo.svg"
            alt={VENUE_NAME}
            width={120}
            height={120}
            priority
            className="relative h-28 w-28 drop-shadow-lg sm:h-32 sm:w-32"
          />
        </div>
      </div>

      <div className="safe-bottom-splash w-full max-w-xs space-y-4 text-center">
        <p className="font-display text-base font-medium tracking-wide text-muted-foreground">
          {VENUE_NAME} — Abonnements repas
        </p>
        <div className="space-y-2">
          {showDeterminate ? (
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Chargement"
            >
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep transition-[width] duration-300 ease-out",
                  progress >= 100 && "shadow-gold"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : (
            <IndeterminateBar className="h-2" />
          )}
        </div>
      </div>
    </div>
  );
}
