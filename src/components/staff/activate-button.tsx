"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { activateSubscription } from "@/app/actions/staff";
import { WhatsAppButton } from "@/components/subscription/whatsapp-button";
import { ActionOverlay } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function ActivateButton({
  subscriptionId,
  clientName,
}: {
  subscriptionId: string;
  clientName?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function activate() {
    setLoading(true);
    setError(null);
    try {
      const result = await activateSubscription(subscriptionId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur lors de l'activation"
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {clientName ? `${clientName} — ` : ""}
          Abonnement activé
        </p>
        <p className="text-xs text-muted-foreground">
          Envoyez le QR en image sur le WhatsApp du client (partage ou envoi
          automatique si l&apos;API est configurée) :
        </p>
        <WhatsAppButton subscriptionId={subscriptionId} />
      </div>
    );
  }

  return (
    <>
    <ActionOverlay
      open={loading}
      message="Activation de l'abonnement…"
      detail="Génération du QR et mise à jour du statut."
    />
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        onClick={activate}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Activation…" : "Confirmer encaissement espèces"}
      </Button>
      {error && (
        <p
          className="rounded-xl bg-danger/15 px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
    </>
  );
}
