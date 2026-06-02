"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateSettingsAction, type ActionResult } from "@/app/actions/admin";
import { ResetTestDataButton } from "@/components/admin/reset-test-data-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppSettings } from "@prisma/client";
import { CheckCircle2, XCircle } from "lucide-react";

function toDatetimeLocalValue(date: Date | null | undefined): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
        Paramètres enregistrés avec succès.
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

export function SettingsForm({
  settings,
  showReset,
}: {
  settings: AppSettings;
  showReset: boolean;
}) {
  const [state, formAction] = useFormState(updateSettingsAction, null);

  return (
    <div className="space-y-6">
      {showReset && settings.testPeriodEndsAt && (
        <ResetTestDataButton testPeriodEndsAt={settings.testPeriodEndsAt} />
      )}

      <FormFeedback state={state} />

      <form action={formAction} className="grid max-w-2xl gap-4">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="font-semibold">Période de test</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Définissez la date de fin du pilote. Le bouton de réinitialisation
              apparaît automatiquement après cette date.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="testPeriodEndsAt">Fin de la période de test</Label>
            <Input
              id="testPeriodEndsAt"
              name="testPeriodEndsAt"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(settings.testPeriodEndsAt)}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide si vous n&apos;êtes pas en phase de test.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dailyMealLimitDefault">Repas max / jour</Label>
            <Input
              id="dailyMealLimitDefault"
              name="dailyMealLimitDefault"
              type="number"
              defaultValue={settings.dailyMealLimitDefault}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validityDaysDefault">Validité défaut (jours)</Label>
            <Input
              id="validityDaysDefault"
              name="validityDaysDefault"
              type="number"
              defaultValue={settings.validityDaysDefault}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fundraisingGoalFcfa">Objectif levée (FCFA)</Label>
          <Input
            id="fundraisingGoalFcfa"
            name="fundraisingGoalFcfa"
            type="number"
            defaultValue={settings.fundraisingGoalFcfa}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cguVersion">Version CGU</Label>
          <Input
            id="cguVersion"
            name="cguVersion"
            defaultValue={settings.cguVersion}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsappMessageTemplate">Template WhatsApp</Label>
          <Textarea
            id="whatsappMessageTemplate"
            name="whatsappMessageTemplate"
            defaultValue={settings.whatsappMessageTemplate}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Variables : {"{{name}}"}, {"{{qrLink}}"}, {"{{formulaName}}"},{" "}
            {"{{shortCode}}"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cguText">Texte CGU</Label>
          <Textarea
            id="cguText"
            name="cguText"
            defaultValue={settings.cguText}
            rows={12}
            required
          />
        </div>
        <SaveButton />
      </form>
    </div>
  );
}
