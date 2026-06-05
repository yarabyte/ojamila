"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeInput } from "@/components/client/otp-code-input";
import { Loader2 } from "lucide-react";

type Step = "phone" | "code" | "connecting";

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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
    setStatusMessage(null);
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

      if (!data.code) {
        setError("Impossible d'obtenir le code. Réessayez.");
        return;
      }

      setCode(data.code);
      setStep("connecting");
      setStatusMessage(
        data.autoSent
          ? "Connexion en cours… (code aussi envoyé sur WhatsApp)"
          : "Connexion en cours…"
      );

      const ok = await verifyWithCode(data.code);
      if (!ok) {
        setStep("code");
        setStatusMessage(
          "Saisissez le code ci-dessous. Ne quittez pas cette page pour coller dans WhatsApp."
        );
      }
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

  if (step === "connecting") {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
        <p className="text-sm font-medium text-foreground">{statusMessage}</p>
        <p className="text-xs text-muted-foreground">
          Restez sur cette page — ne passez pas par WhatsApp.
        </p>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <p className="rounded-xl bg-warning/10 px-3 py-3 text-sm text-warning">
          La connexion automatique a échoué. Saisissez le code affiché dans les
          cases ci-dessous (pas dans WhatsApp).
        </p>
        {statusMessage && (
          <p className="text-xs text-muted-foreground">{statusMessage}</p>
        )}
        <div className="space-y-2">
          <Label>Code à 6 chiffres</Label>
          <OtpCodeInput value={code} onChange={setCode} disabled={loading} />
        </div>
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
            setError(null);
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
        <strong>Restez sur cette page.</strong> Après validation, vous serez
        connecté automatiquement — inutile d&apos;ouvrir WhatsApp.
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
          autoComplete="tel"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
