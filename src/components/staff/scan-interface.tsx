"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScanPreview } from "@/lib/services";
import { enqueueConsume } from "@/lib/offline/scan-queue";
import { OfflineQueueBanner } from "@/components/staff/offline-queue-banner";
import { cn } from "@/lib/utils";
import {
  Camera,
  CheckCircle2,
  Keyboard,
  Loader2,
  ScanLine,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square max-h-[42vh] items-center justify-center bg-black text-sm text-white/70">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-gold" />
        Ouverture caméra…
      </div>
    ),
  }
);

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

function ScanStatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        online
          ? "bg-success/15 text-success"
          : "bg-warning/15 text-warning"
      )}
    >
      {online ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          En ligne
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          Hors ligne
        </>
      )}
    </span>
  );
}

function ScanValidationPanel({
  preview,
  loading,
  onConsume,
  onReset,
}: {
  preview: ScanPreview;
  loading: boolean;
  onConsume: () => void;
  onReset: () => void;
}) {
  const initial = preview.clientName.trim().charAt(0).toUpperCase() || "?";
  const usedPercent =
    preview.totalMeals > 0
      ? Math.round((preview.mealsConsumed / preview.totalMeals) * 100)
      : 0;
  const remainingPercent = 100 - usedPercent;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-2">
      <div className="staff-card overflow-hidden">
        <div className="border-b border-border bg-gold-soft/50 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-xl font-bold text-black-deep">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-2xl font-semibold text-foreground">
                {preview.clientName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {preview.formulaName}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Repas restants
            </p>
            <p className="mt-1 font-display text-5xl font-semibold tabular-nums text-foreground">
              {preview.mealsRemaining}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              sur {preview.totalMeals} repas
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{preview.mealsConsumed} consommés</span>
              <span>{remainingPercent}% restant</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </div>

          {preview.expiresAt && (
            <p className="text-center text-sm text-muted-foreground">
              Expire le{" "}
              <strong className="text-foreground">
                {new Date(preview.expiresAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </p>
          )}

          {preview.blockReason ? (
            <div className="flex items-start gap-2 rounded-xl bg-danger/15 px-4 py-3 text-sm text-danger">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {preview.blockReason}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Repas autorisé aujourd&apos;hui
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto grid gap-3 pb-2">
        <Button
          size="lg"
          onClick={onConsume}
          disabled={!preview.canConsume || loading}
          className="w-full gap-2 text-base"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Validation…
            </>
          ) : (
            <>
              <UtensilsCrossed className="h-5 w-5" />
              Valider le repas
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          disabled={loading}
          className="w-full gap-2"
        >
          <ScanLine className="h-4 w-4" />
          Scanner un autre client
        </Button>
      </div>
    </div>
  );
}

export function ScanInterface() {
  const [preview, setPreview] = useState<ScanPreview | null>(null);
  const [shortCode, setShortCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [scanPaused, setScanPaused] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const lookup = useCallback(
    async (body: Record<string, string>) => {
      if (!online) {
        setMessage({
          type: "error",
          text: "Hors ligne — saisissez le code secours puis validez (file d'attente)",
        });
        return;
      }
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch("/api/scan/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setPreview(null);
          setMessage({ type: "error", text: data.error ?? "Erreur scan" });
          return;
        }
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(40);
        }
        setPreview(data as ScanPreview);
        setScanPaused(true);
      } catch (e) {
        if (isNetworkError(e)) {
          setMessage({ type: "error", text: "Réseau indisponible" });
        }
      } finally {
        setLoading(false);
      }
    },
    [online]
  );

  const onScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (scanPaused || loading || !result[0]?.rawValue) return;
      lookup({ qrToken: result[0].rawValue });
    },
    [lookup, loading, scanPaused]
  );

  async function consume() {
    if (!preview) return;
    setLoading(true);
    setMessage(null);

    try {
      if (!navigator.onLine) {
        enqueueConsume({
          subscriptionId: preview.subscriptionId,
          clientName: preview.clientName,
          formulaName: preview.formulaName,
        });
        setMessage({
          type: "success",
          text: "Repas enregistré localement — sync au retour du réseau",
        });
        setPreview(null);
        setScanPaused(false);
        setShortCode("");
        return;
      }

      const res = await fetch("/api/scan/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: preview.subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Refusé" });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
      setMessage({
        type: "success",
        text: `Repas validé — ${data.mealsRemaining} restant(s)`,
      });
      setPreview(null);
      setScanPaused(false);
      setShortCode("");
    } catch (e) {
      if (isNetworkError(e) && preview) {
        enqueueConsume({
          subscriptionId: preview.subscriptionId,
          clientName: preview.clientName,
          formulaName: preview.formulaName,
        });
        setMessage({
          type: "success",
          text: "Repas mis en file d'attente (hors ligne)",
        });
        setPreview(null);
        setScanPaused(false);
        setShortCode("");
      } else {
        setMessage({ type: "error", text: "Erreur réseau" });
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setScanPaused(false);
    setMessage(null);
    setShortCode("");
  }

  function submitShortCode(e: React.FormEvent) {
    e.preventDefault();
    if (!shortCode.trim()) return;
    lookup({ shortCode: shortCode.trim() });
  }

  return (
    <div className="scan-page">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">
            Scanner un repas
          </h1>
          <p className="text-xs text-muted-foreground">
            QR client ou code secours à 6 caractères
          </p>
        </div>
        <ScanStatusBadge online={online} />
      </div>

      <OfflineQueueBanner />

      {message && (
        <div
          className={cn(
            "mx-4 mb-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
            message.type === "success"
              ? "bg-success/15 text-success"
              : "bg-danger/15 text-danger"
          )}
          role="alert"
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {!preview ? (
        <>
          <div className="scan-camera-shell">
            <div className="relative aspect-square max-h-[42vh] w-full overflow-hidden">
              <Scanner
                onScan={onScan}
                paused={scanPaused || loading}
                sound
                scanDelay={1500}
                constraints={{ facingMode: "environment" }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { objectFit: "cover" },
                }}
              />
              <div className="scan-overlay">
                <div className="scan-target">
                  <span className="scan-corner scan-corner-tl" />
                  <span className="scan-corner scan-corner-tr" />
                  <span className="scan-corner scan-corner-bl" />
                  <span className="scan-corner scan-corner-br" />
                  {!loading && <span className="scan-line" aria-hidden />}
                </div>
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                  <div className="flex items-center gap-2 rounded-xl bg-black/70 px-4 py-3 text-sm text-white">
                    <Loader2 className="h-5 w-5 animate-spin text-gold" />
                    Vérification…
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-black/80 px-4 py-2.5 text-xs text-white/75">
              <Camera className="h-3.5 w-3.5 text-gold" />
              Cadrez le QR dans la zone dorée
            </div>
          </div>

          <div className="mx-4 mt-4 staff-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-soft">
                <Keyboard className="h-4 w-4 text-gold-deep" />
              </span>
              <div>
                <p className="font-semibold text-foreground">Code secours</p>
                <p className="text-xs text-muted-foreground">
                  Si la caméra ou le réseau pose problème
                </p>
              </div>
            </div>
            <form onSubmit={submitShortCode} className="flex gap-2">
              <Input
                value={shortCode}
                onChange={(e) =>
                  setShortCode(e.target.value.toUpperCase().replace(/\s/g, ""))
                }
                placeholder="Ex. A3K9M2"
                className="font-mono text-lg tracking-widest uppercase"
                maxLength={8}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={!shortCode || loading}
                className="shrink-0 px-5"
              >
                OK
              </Button>
            </form>
          </div>
        </>
      ) : (
        <ScanValidationPanel
          preview={preview}
          loading={loading}
          onConsume={consume}
          onReset={reset}
        />
      )}
    </div>
  );
}
