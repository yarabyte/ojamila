"use client";

import { useState } from "react";
import { subscribeToPush } from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export function PushSubscribeButton() {
  const [status, setStatus] = useState<"idle" | "ok" | "unsupported" | "denied">(
    "idle"
  );
  const [loading, setLoading] = useState(false);

  async function enable() {
    setLoading(true);
    try {
      const result = await subscribeToPush();
      setStatus(result === "ok" ? "ok" : result === "denied" ? "denied" : "unsupported");
    } catch {
      setStatus("denied");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ok") {
    return (
      <span className="flex items-center gap-1 text-xs text-success">
        <Bell className="h-3 w-3" />
        Alertes activées
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 text-xs text-muted-foreground"
      onClick={enable}
      disabled={loading}
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
