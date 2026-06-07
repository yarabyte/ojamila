"use client";

import { useEffect, useState } from "react";
import {
  getPushStatus,
  subscribeToPush,
  type PushSubscribeResult,
} from "@/lib/push-client";
import { sendTestPushAction } from "@/app/actions/push";
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
  const [testLoading, setTestLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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
    setFeedback(null);
    try {
      const result = await subscribeToPush();
      if (result === "ok") {
        setStatus("ok");
        setFeedback("Alertes activées sur cet appareil.");
      } else if (result === "unconfigured") {
        setFeedback("Clés VAPID absentes sur le serveur — vérifiez Vercel puis redéployez.");
        setStatus("ready");
      } else if (result === "unsupported") {
        setFeedback("Navigateur incompatible (utilisez Chrome ou installez l'app PWA).");
        setStatus("unsupported");
      } else if (result === "denied") {
        setFeedback("Permission refusée — autorisez les notifications dans les réglages.");
        setStatus("denied");
      } else {
        setFeedback("Échec d'activation. Réessayez ou installez l'app depuis l'écran d'accueil.");
        setStatus("ready");
      }
    } catch {
      setFeedback("Erreur réseau lors de l'activation.");
      setStatus("ready");
    } finally {
      setLoading(false);
    }
  }

  async function sendTest() {
    setTestLoading(true);
    setFeedback(null);
    const result = await sendTestPushAction();
    setTestLoading(false);
    if (result.success) {
      setFeedback(
        `Notification test envoyée (${result.data.sent} appareil${result.data.sent > 1 ? "s" : ""}).`
      );
    } else {
      setFeedback(result.error);
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
    const enabledBlock = (
      <>
        {variant === "card" ? (
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
        ) : (
          <span className="flex items-center gap-1 text-xs text-success">
            <BellRing className="h-3 w-3" />
            Alertes activées
          </span>
        )}
        {variant === "card" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={testLoading}
            onClick={() => void sendTest()}
          >
            {testLoading ? "Envoi…" : "Envoyer une notification test"}
          </Button>
        )}
        {feedback && (
          <p className="text-xs text-muted-foreground" role="status">
            {feedback}
          </p>
        )}
      </>
    );

    return variant === "card" ? (
      <div className="space-y-2">{enabledBlock}</div>
    ) : (
      enabledBlock
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
        {feedback && (
          <p className="px-1 text-xs text-danger" role="alert">
            {feedback}
          </p>
        )}
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
