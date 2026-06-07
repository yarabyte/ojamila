"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js?v=7";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // En dev : pas de SW ni de reload auto (évite les boucles Next.js)
    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          void reg.unregister();
        }
      });
      return;
    }

    let reloaded = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register(SW_URL)
      .then((registration) => registration.update())
      .catch(console.error);
  }, []);

  return null;
}
