"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "jamila-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPad|iPhone|iPod|Mobile/i.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (isStandalone()) return;
    if (!isMobile()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    if (isIos()) {
      setIosMode(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const timer = window.setTimeout(() => {
      if (!isStandalone() && isMobile()) {
        setVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      } else {
        localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  }, [installEvent]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-labelledby="pwa-install-title"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-gold/30 bg-black-deep p-4 text-white shadow-2xl">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt=""
            width={48}
            height={48}
            className="shrink-0 rounded-xl ring-1 ring-gold/40"
          />
          <div className="min-w-0 flex-1">
            <p
              id="pwa-install-title"
              className="font-display text-base font-semibold text-gold"
            >
              Installer Ô JAMILA
            </p>
            <p className="mt-1 text-sm text-white/75">
              {iosMode
                ? "Ajoutez l'app sur votre écran d'accueil pour un accès rapide aux abonnements et au scan."
                : "Installez l'application pour un accès rapide, hors ligne partiel et raccourcis sur votre téléphone."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {iosMode ? (
          <ol className="space-y-1 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Share className="h-4 w-4 shrink-0 text-gold" />
              Appuyez sur <strong className="text-white">Partager</strong> en bas
              de Safari
            </li>
            <li>
              Puis <strong className="text-white">Sur l&apos;écran d&apos;accueil</strong>
            </li>
          </ol>
        ) : (
          <Button
            type="button"
            className="w-full gap-2"
            onClick={install}
            disabled={!installEvent || installing}
          >
            <Download className="h-4 w-4" />
            {installing
              ? "Installation…"
              : installEvent
                ? "Installer l'application"
                : "Préparation de l'installation…"}
          </Button>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="text-center text-xs text-white/45 hover:text-white/70"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
