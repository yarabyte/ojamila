"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const startProgress = useCallback(() => {
    clearTimers();
    setVisible(true);
    setWidth(12);

    timersRef.current.push(
      setTimeout(() => setWidth(45), 80),
      setTimeout(() => setWidth(72), 220),
      setTimeout(() => setWidth(92), 480),
      setTimeout(() => {
        setWidth(100);
        timersRef.current.push(
          setTimeout(() => {
            setVisible(false);
            setWidth(0);
          }, 180)
        );
      }, 620)
    );
  }, [clearTimers]);

  useEffect(() => {
    startProgress();
    return clearTimers;
  }, [pathname, startProgress, clearTimers]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }
      startProgress();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startProgress]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-0 z-[100] h-1 overflow-hidden bg-transparent transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-gold-deep via-gold to-gold-deep shadow-[0_0_12px_rgba(214,203,114,0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
