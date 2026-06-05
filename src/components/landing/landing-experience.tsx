"use client";

import { useEffect, useState } from "react";
import { HomeMenu } from "@/components/landing/home-menu";
import { LandingSplash } from "@/components/landing/landing-splash";
import { cn } from "@/lib/utils";

const SPLASH_KEY = "jamila_splash_seen";
const SPLASH_MS = 2200;

export function LandingExperience() {
  const [phase, setPhase] = useState<"splash" | "menu">("splash");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY) === "1") {
      setPhase("menu");
      return;
    }

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / SPLASH_MS) * 100));
      setProgress(pct);
      if (elapsed < SPLASH_MS) {
        requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem(SPLASH_KEY, "1");
        setPhase("menu");
      }
    };
    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          phase === "menu"
            ? "pointer-events-none absolute inset-0 -translate-y-4 opacity-0"
            : "opacity-100"
        )}
        aria-hidden={phase === "menu"}
      >
        <LandingSplash progress={progress} />
      </div>

      <div
        className={cn(
          "transition-all duration-500 ease-out",
          phase === "menu"
            ? "opacity-100"
            : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
        )}
      >
        <HomeMenu />
      </div>
    </div>
  );
}
