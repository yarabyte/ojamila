"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeInput } from "@/components/client/otp-code-input";
import { extractOtpFromClipboard } from "@/lib/otp-clipboard";
import { ClipboardPaste } from "lucide-react";

type Step = "phone" | "code";

export function ClientLoginForm({
  redirectTo = "/client/qr",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [autoSent, setAutoSent] = useState(false);
  const [pasteHint, setPasteHint] = useState<string | null>(null);

  const tryFillFromClipboard = useCallback(async (silent = false) => {
    if (!navigator.clipboard?.readText) return false;
    try {
      const text = await navigator.clipboard.readText();
      const digits = extractOtpFromClipboard(text);
      if (digits) {
        setCode(digits);
        if (!silent) setPasteHint("Code collé.");
        else setPasteHint("Code détecté depuis WhatsApp.");
        setError(null);
        return true;
      }
      if (!silent) {
        setPasteHint(
          "Copiez le 2e message WhatsApp (6 chiffres seuls), puis réessayez."
        );
      }
    } catch {
      if (!silent) {
        setPasteHint(
          "Ouvrez WhatsApp → copiez le message avec uniquement 6 chiffres → revenez ici → Coller."
        );
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (step !== "code") return;

    function onVisible() {
      if (document.visibilityState === "visible") {
        void tryFillFromClipboard(true);
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [step, tryFillFromClipboard]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDevCode(null);
    setAutoSent(false);
    setPasteHint(null);
    try {
      const res = await fetch("/api/client/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      if (data.devCode) setDevCode(data.devCode);
      if (data.autoSent) {
        setAutoSent(true);
      } else if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
      setCode("");
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function copyDevCode() {
    if (!devCode) return;
    try {
      await navigator.clipboard.writeText(devCode);
      setCode(devCode);
      setPasteHint("Code copié.");
    } catch {
      setPasteHint("Copiez le code affiché ci-dessus.");
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/client/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Code invalide");
        return;
      }
      router.push(data.redirectTo ?? redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {autoSent
            ? "Deux messages WhatsApp envoyés au "
            : "Code envoyé sur WhatsApp au "}
          <strong>{phone}</strong>.
        </p>
        <div className="rounded-xl border border-gold/30 bg-gold-soft/40 px-3 py-3 text-sm leading-relaxed">
          <p className="font-semibold text-foreground">1. Ouvrez WhatsApp</p>
          <p className="mt-1 text-muted-foreground">
            Le <strong>2e message</strong> ne contient que{" "}
            <strong>6 chiffres</strong> (ex.{" "}
            <span className="font-mono">854610</span>). Appui long → Copier.
          </p>
          <p className="mt-2 font-semibold text-foreground">
            2. Revenez ici
          </p>
          <p className="mt-1 text-muted-foreground">
            Le code peut se remplir tout seul, ou touchez{" "}
            <strong>Coller le code</strong>.
          </p>
        </div>
        {devCode && (
          <button
            type="button"
            onClick={copyDevCode}
            className="w-full rounded-xl bg-gold-soft px-3 py-3 text-left text-sm transition-colors hover:bg-gold-soft/80"
          >
            Mode dev — code :{" "}
            <strong className="font-mono text-lg tracking-widest">{devCode}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              Toucher pour copier
            </span>
          </button>
        )}
        <div className="space-y-2">
          <Label>Code à 6 chiffres</Label>
          <OtpCodeInput value={code} onChange={setCode} disabled={loading} />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          onClick={() => void tryFillFromClipboard(false)}
          disabled={loading}
        >
          <ClipboardPaste className="h-4 w-4" />
          Coller le code
        </Button>
        {pasteHint && (
          <p className="text-xs text-success">{pasteHint}</p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading || code.length < 6}
        >
          {loading ? "…" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setStep("phone");
            setCode("");
            setPasteHint(null);
          }}
        >
          Changer de numéro
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Nous vous enverrons un code de connexion par WhatsApp.
      </p>
      <div className="space-y-2">
        <Label htmlFor="phone">Numéro WhatsApp</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="6XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "…" : "Recevoir mon code"}
      </Button>
    </form>
  );
}
