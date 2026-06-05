"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeInput } from "@/components/client/otp-code-input";
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

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDevCode(null);
    setAutoSent(false);
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

  async function pasteFromClipboard() {
    setPasteHint(null);
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, "").slice(0, 6);
      if (digits.length === 6) {
        setCode(digits);
        setPasteHint("Code collé.");
        return;
      }
      setPasteHint("Presse-papiers sans code à 6 chiffres — copiez la ligne du code dans WhatsApp.");
    } catch {
      setPasteHint(
        "Collez manuellement : appui long sur le code dans WhatsApp → Copier, puis touchez une case ci-dessus."
      );
    }
  }

  async function copyDevCode() {
    if (!devCode) return;
    try {
      await navigator.clipboard.writeText(devCode);
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
            ? "Code envoyé sur WhatsApp au "
            : "Code envoyé sur WhatsApp au "}
          <strong>{phone}</strong>.
        </p>
        <p className="rounded-xl bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Dans WhatsApp, le code est sur une <strong>ligne seule</strong> — appui
          long dessus → <strong>Copier</strong>, puis utilisez le bouton
          ci-dessous ou collez dans les cases.
        </p>
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
          onClick={pasteFromClipboard}
          disabled={loading}
        >
          <ClipboardPaste className="h-4 w-4" />
          Coller le code
        </Button>
        {pasteHint && (
          <p className="text-xs text-muted-foreground">{pasteHint}</p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading || code.length < 6}>
          {loading ? "…" : "Valider"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setStep("phone");
            setCode("");
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
