"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getPendingConsumes,
  removePendingConsume,
  type PendingConsume,
} from "@/lib/offline/scan-queue";
import { CloudOff, RefreshCw } from "lucide-react";

export function OfflineQueueBanner() {
  const [queue, setQueue] = useState<PendingConsume[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  const refresh = useCallback(() => {
    setQueue(getPendingConsumes());
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, [refresh]);

  async function syncQueue() {
    const pending = getPendingConsumes();
    if (pending.length === 0) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/scan/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pending }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        for (const r of data.results as { localId: string; success: boolean }[]) {
          if (r.success) removePendingConsume(r.localId);
        }
      }
    } finally {
      setSyncing(false);
      refresh();
    }
  }

  useEffect(() => {
    if (online && queue.length > 0) {
      syncQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  if (queue.length === 0 && online) return null;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <div className="flex items-start gap-2">
        {!online ? (
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        ) : (
          <RefreshCw className={`mt-0.5 h-4 w-4 shrink-0 ${syncing ? "animate-spin" : ""}`} />
        )}
        <div className="flex-1">
          {!online ? (
            <p className="font-medium text-warning">
              Hors ligne — {queue.length} repas en attente de sync
            </p>
          ) : (
            <p className="font-medium text-warning">
              {queue.length} repas à synchroniser
            </p>
          )}
          <ul className="mt-1 text-xs text-muted-foreground">
            {queue.slice(0, 3).map((q) => (
              <li key={q.localId}>
                {q.clientName ?? q.subscriptionId.slice(0, 8)}
              </li>
            ))}
          </ul>
        </div>
        {online && queue.length > 0 && (
          <Button size="sm" variant="secondary" onClick={syncQueue} disabled={syncing}>
            Sync
          </Button>
        )}
      </div>
    </div>
  );
}
