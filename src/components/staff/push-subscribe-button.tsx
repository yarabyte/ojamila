"use client";

import { useEffect, useState } from "react";
import {
  getPushStatus,
  subscribeToPush,
  type PushSubscribeResult,
} from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell, BellOff, BellRing, ChevronRight } from "lucide-react";

type AlertStatus = PushSubscribeResult | "loading" | "ready";

export function PushSubscribeButton({
  variant = "compact",
}: {
  variant?: "compact" | "card";
}) {
  const [status, setStatus] = useState<AlertStatus>("loading");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const pushStatus = await getPushStatus();
      if (cancelled) return;

      if (!pushStatus.configured) {
        setStatus("unconfigured");
        return;
      }

      if (pushStatus.subscribed && pushStatus.browserGranted) {
        setStatus("ok");
        return;
      }

      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "denied"
      ) {
        setStatus("denied");
        return;
      }

      setStatus("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setLoading(true);
    try {
      const result = await subscribeToPush();
      setStatus(result === "ok" ? "ok" : result);
    } catch {
      setStatus("denied");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return variant === "card" ? (
      <div className="h-16 animate-pulse rounded-xl bg-gold-soft/40" />
    ) : null;
  }

  if (status === "unconfigured") {
    return null;
  }

  if (status === "ok") {
    if (variant === "card") {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15">
            <BellRing className="h-4 w-4 text-success" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-success">Alertes activées</p>
            <p className="text-xs text-success/80">
              Souscriptions, paiements et liste d&apos;attente
            </p>
          </div>
        </div>
      );
    }

    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <BellRing className="h-3 w-3" />
        Alertes activées
      </span>
    );
  }

  if (variant === "card") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Alertes</p>
        </div>
        <button
          type="button"
          onClick={() => void enable()}
          disabled={loading || status === "denied" || status === "unsupported"}
          className={cn(
            "staff-cta-primary group w-full text-left",
            status === "denied" && "opacity-60"
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/40 ring-1 ring-gold/30">
            {status === "denied" ? (
              <BellOff className="h-6 w-6 text-black-deep" />
            ) : (
              <Bell className="h-6 w-6 text-black-deep" />
            )}
          </span>
          <span className="flex-1 text-left">
            <span className="block font-semibold text-black-deep">
              {loading
                ? "Activation…"
                : status === "denied"
                  ? "Notifications refusées"
                  : "Activer les alertes"}
            </span>
            <span className="block text-xs font-medium text-black-deep/65">
              {status === "denied"
                ? "Autorisez les notifications dans les réglages du téléphone"
                : "Nouvelles souscriptions, paiements et liste d'attente"}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-black-deep/50 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 text-xs text-muted-foreground"
      onClick={() => void enable()}
      disabled={loading || status === "denied" || status === "unsupported"}
    >
      {status === "denied" ? (
        <>
          <BellOff className="mr-1 h-3 w-3" />
          Refusé
        </>
      ) : (
        <>
          <Bell className="mr-1 h-3 w-3" />
          {loading ? "…" : "Alertes"}
        </>
      )}
    </Button>
  );
}
