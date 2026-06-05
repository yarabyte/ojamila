"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import {
  getThankYouPreviewAction,
  sendThankYouBatchAction,
  updateThankYouSettingsAction,
} from "@/app/actions/thank-you";
import type { ActionResult } from "@/app/actions/admin";
import { ActionOverlay } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppSettings } from "@prisma/client";
import { CheckCircle2, Heart, MessageCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const BATCH_SIZE = 8;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}

function FormFeedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.success) {
    return (
      <p
        className="flex items-center gap-2 rounded-xl bg-success/15 px-4 py-3 text-sm font-medium text-success"
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        Paramètres enregistrés.
      </p>
    );
  }
  return (
    <p
      className="flex items-center gap-2 rounded-xl bg-danger/15 px-4 py-3 text-sm text-danger"
      role="alert"
    >
      <XCircle className="h-5 w-5 shrink-0" />
      {state.error}
    </p>
  );
}

type SendReport = {
  sent: number;
  failed: number;
  failures: { name: string; phone: string; error: string }[];
};

export function ThankYouForm({
  settings,
  subscriptionCount,
  whatsappConfigured,
  whatsappProvider,
}: {
  settings: AppSettings;
  subscriptionCount: number;
  whatsappConfigured: boolean;
  whatsappProvider: string | null;
}) {
  const [saveState, saveAction] = useFormState(updateThankYouSettingsAction, null);
  const [preview, setPreview] = useState<string>("");
  const [sampleName, setSampleName] = useState("");
  const [sampleFormula, setSampleFormula] = useState("");
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ processed: 0, total: 0 });
  const [sendReport, setSendReport] = useState<SendReport | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const router = useRouter();

  const refreshPreview = useCallback(async () => {
    const result = await getThankYouPreviewAction();
    if (result.success) {
      setPreview(result.data.message);
      setSampleName(result.data.sampleName);
      setSampleFormula(result.data.sampleFormula);
    }
  }, []);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview, saveState]);

  async function handleSendAll() {
    setSendError(null);
    setSendReport(null);

    if (!whatsappConfigured) {
      setSendError(
        "Configurez Wasender (ou un autre fournisseur WhatsApp) pour l'envoi groupé."
      );
      return;
    }

    if (!settings.thankYouDriveUrl.trim()) {
      setSendError("Enregistrez d'abord un lien Google Drive valide.");
      return;
    }

    if (subscriptionCount === 0) {
      setSendError("Aucun abonnement à contacter.");
      return;
    }

    const confirmed = window.confirm(
      `Vous allez envoyer un message WhatsApp à ${subscriptionCount} abonnement(s) (tous statuts).\n\nUn client avec plusieurs abonnements recevra plusieurs messages.\n\nContinuer ?`
    );
    if (!confirmed) return;

    const typed = window.prompt(
      `Pour confirmer, saisissez le nombre de destinataires : ${subscriptionCount}`
    );
    if (typed !== String(subscriptionCount)) {
      setSendError("Confirmation annulée — le nombre saisi ne correspond pas.");
      return;
    }

    setSending(true);
    setSendProgress({ processed: 0, total: subscriptionCount });

    let offset = 0;
    let totalSent = 0;
    let totalFailed = 0;
    const allFailures: SendReport["failures"] = [];

    try {
      while (true) {
        const result = await sendThankYouBatchAction(offset, BATCH_SIZE, totalSent);
        if (!result.success) {
          setSendError(result.error);
          break;
        }

        const { data } = result;
        totalSent += data.sent;
        totalFailed += data.failed;
        allFailures.push(...data.failures);
        setSendProgress({ processed: data.processed, total: data.total });

        if (!data.hasMore) {
          setSendReport({ sent: totalSent, failed: totalFailed, failures: allFailures });
          router.refresh();
          break;
        }
        offset = data.nextOffset;
      }
    } catch {
      setSendError("Erreur réseau lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <ActionOverlay
        open={sending}
        message="Envoi des remerciements…"
        detail={
          sendProgress.total > 0
            ? `${sendProgress.processed} / ${sendProgress.total} abonnements traités`
            : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            whatsappConfigured
              ? "bg-success/15 text-success"
              : "bg-danger/15 text-danger"
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp API : {whatsappConfigured ? (whatsappProvider ?? "configurée") : "non configurée"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {subscriptionCount} abonnement{subscriptionCount !== 1 ? "s" : ""}
        </span>
        {settings.thankYouLastSentAt && (
          <span className="text-xs text-muted-foreground">
            Dernier envoi :{" "}
            {new Date(settings.thankYouLastSentAt).toLocaleString("fr-FR")}
            {settings.thankYouLastSentCount != null &&
              ` (${settings.thankYouLastSentCount} message${settings.thankYouLastSentCount !== 1 ? "s" : ""})`}
          </span>
        )}
      </div>

      <FormFeedback state={saveState} />

      <form action={saveAction} className="grid max-w-2xl gap-4">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-gold" />
            <h2 className="font-semibold">Message de remerciement</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Ce message sera envoyé par WhatsApp à chaque abonnement.
          </p>
          <div className="space-y-2">
            <Label htmlFor="thankYouMessageTemplate">Message</Label>
            <Textarea
              id="thankYouMessageTemplate"
              name="thankYouMessageTemplate"
              defaultValue={settings.thankYouMessageTemplate}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Variables : {"{{name}}"}, {"{{driveLink}}"}, {"{{formulaName}}"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="thankYouDriveUrl">Lien Google Drive (photos)</Label>
            <Input
              id="thankYouDriveUrl"
              name="thankYouDriveUrl"
              type="url"
              placeholder="https://drive.google.com/drive/folders/…"
              defaultValue={settings.thankYouDriveUrl}
            />
            <p className="text-xs text-muted-foreground">
              Obligatoire pour l&apos;envoi. Partagez le dossier en « lien accessible ».
            </p>
          </div>
          <SaveButton />
        </div>
      </form>

      <div className="max-w-2xl space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-semibold">Aperçu</h2>
        <p className="text-xs text-muted-foreground">
          Exemple pour {sampleName || "…"} — formule {sampleFormula || "…"}
        </p>
        <pre className="whitespace-pre-wrap rounded-xl bg-muted/50 p-4 text-sm leading-relaxed">
          {preview || "Chargement…"}
        </pre>
      </div>

      <div className="max-w-2xl space-y-4 rounded-2xl border border-gold/30 bg-card p-4">
        <h2 className="font-semibold">Envoi groupé</h2>
        <p className="text-sm text-muted-foreground">
          Envoie le message à <strong>tous les abonnements</strong>, quel que soit leur
          statut. Un client avec plusieurs abonnements recevra un message par abonnement.
        </p>

        {sendError && (
          <p className="flex items-center gap-2 rounded-xl bg-danger/15 px-4 py-3 text-sm text-danger">
            <XCircle className="h-5 w-5 shrink-0" />
            {sendError}
          </p>
        )}

        {sendReport && (
          <div className="space-y-2 rounded-xl bg-success/10 px-4 py-3 text-sm">
            <p className="font-medium text-success">
              Campagne terminée — {sendReport.sent} envoyé{sendReport.sent !== 1 ? "s" : ""}
              {sendReport.failed > 0 && `, ${sendReport.failed} échec${sendReport.failed !== 1 ? "s" : ""}`}
            </p>
            {sendReport.failures.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {sendReport.failures.map((f, i) => (
                  <li key={i}>
                    {f.name} ({f.phone}) — {f.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {sending && sendProgress.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progression</span>
              <span>
                {sendProgress.processed} / {sendProgress.total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gold transition-all duration-300"
                style={{
                  width: `${Math.round((sendProgress.processed / sendProgress.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <Button
          type="button"
          onClick={() => void handleSendAll()}
          disabled={sending || subscriptionCount === 0}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          {sending ? "Envoi en cours…" : "Envoyer à tous les abonnements"}
        </Button>
      </div>
    </div>
  );
}
