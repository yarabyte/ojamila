"use client";

import { useState } from "react";
import { subscribeToPush } from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export function ClientPushButton() {
  const [status, setStatus] = useState<
    "idle" | "ok" | "unsupported" | "denied" | "unconfigured"
  >("idle");
  const [loading, setLoading] = useState(false);

  async function enable() {
    setLoading(true);
    const result = await subscribeToPush();
    setStatus(result);
    setLoading(false);
  }

  if (status === "ok") {
    return (
      <p className="flex items-center gap-2 text-xs text-success">
        <Bell className="h-3 w-3" />
        Alertes activées (promotion liste d&apos;attente)
      </p>
    );
  }

  if (status === "unconfigured") {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full"
      onClick={enable}
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
