"use client";

import { useEffect, useState } from "react";
import { getPushStatus, subscribeToPush } from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing } from "lucide-react";

export function ClientPushButton() {
  const [status, setStatus] = useState<
    "loading" | "ok" | "ready" | "unsupported" | "denied" | "unconfigured"
  >("loading");
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
    const result = await subscribeToPush();
    setStatus(result === "ok" ? "ok" : result === "error" ? "ready" : result);
    setLoading(false);
  }

  if (status === "loading" || status === "unconfigured") {
    return null;
  }

  if (status === "ok") {
    return (
      <p className="flex items-center gap-2 text-xs text-success">
        <BellRing className="h-3 w-3" />
        Alertes activées (promotion liste d&apos;attente)
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => void enable()}
      disabled={loading || status === "unsupported"}
    >
      {status === "denied" ? (
        <>
          <BellOff className="mr-2 h-4 w-4" />
          Notifications refusées
        </>
      ) : (
        <>
          <Bell className="mr-2 h-4 w-4" />
          {loading ? "…" : "Alertes liste d'attente"}
        </>
      )}
    </Button>
  );
}
