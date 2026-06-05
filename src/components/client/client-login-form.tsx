"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeInput } from "@/components/client/otp-code-input";
import { extractOtpFromClipboard } from "@/lib/otp-clipboard";
import { CheckCircle2, ClipboardPaste } from "lucide-react";

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
  const [autoSent, setAutoSent] = useState(false);
  const [codeInApp, setCodeInApp] = useState(false);
  const [pasteHint, setPasteHint] = useState<string | null>(null);

  const tryFillFromClipboard = useCallback(async (silent = false) => {
    if (!navigator.clipboard?.readText) return false;
    try {
      const text = await navigator.clipboard.readText();
      const digits = extractOtpFromClipboard(text);
      if (digits) {
        setCode(digits);
        if (!silent) setPasteHint("Code collé.");
        setError(null);
        return true;
      }
      if (!silent) {
        setPasteHint("Copiez le message à 6 chiffres dans WhatsApp, puis réessayez.");
      }
    } catch {
      if (!silent) {
        setPasteHint("Impossible de lire le presse-papiers — saisissez le code à la main.");
      }
    }
    return false;
  }, []);

  useEffect(() => {
    if (step !== "code" || codeInApp) return;

    function onVisible() {
      if (document.visibilityState === "visible") {
        void tryFillFromClipboard(true);
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [step, codeInApp, tryFillFromClipboard]);

  async function verifyWithCode(codeValue: string) {
    const res = await fetch("/api/client/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: codeValue }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Code invalide");
      return false;
    }
    router.push(data.redirectTo ?? redirectTo);
    router.refresh();
    return true;
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAutoSent(false);
    setCodeInApp(false);
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

      if (data.autoSent) setAutoSent(true);

      if (data.code) {
        setCode(data.code);
        setCodeInApp(true);
        setStep("code");
        return;
      }

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
      setCode("");
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyWithCode(code);
    } finally {
      setLoading(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        {codeInApp ? (
          <div className="flex gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="font-semibold text-foreground">Code rempli dans l&apos;application</p>
              <p className="mt-1 text-muted-foreground">
                Également envoyé sur WhatsApp au <strong>{phone}</strong>.
                Touchez <strong>Valider</strong> pour continuer.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {autoSent
                ? "Code envoyé sur WhatsApp au "
                : "Ouvrez WhatsApp pour le code envoyé au "}
              <strong>{phone}</strong>.
            </p>
            <div className="rounded-xl border border-gold/30 bg-gold-soft/40 px-3 py-3 text-sm leading-relaxed text-muted-foreground">
              Copiez le message à <strong>6 chiffres seuls</strong>, puis
              utilisez <strong>Coller le code</strong> ci-dessous.
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Code à 6 chiffres</Label>
          <OtpCodeInput value={code} onChange={setCode} disabled={loading} />
        </div>

        {!codeInApp && (
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
        )}

        {pasteHint && <p className="text-xs text-success">{pasteHint}</p>}
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
            setCodeInApp(false);
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
        Le code s&apos;affichera ici et sera envoyé sur votre WhatsApp.
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
