"use client";

import { useEffect, useState } from "react";
import { createMealGift } from "@/app/actions/gift";
import { ActionOverlay } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isContactPickerSupported,
  pickPhoneFromContacts,
} from "@/lib/contact-picker";
import { Contact, Gift } from "lucide-react";

export function GiftMealForm({
  subscriptionId,
  mealsRemaining,
}: {
  subscriptionId: string;
  mealsRemaining: number;
}) {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);
  const [contactsAvailable, setContactsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    shortCode: string;
    autoSent: boolean;
    waMeUrl?: string;
  } | null>(null);

  useEffect(() => {
    setContactsAvailable(isContactPickerSupported());
  }, []);

  async function pickContact() {
    setPickingContact(true);
    setError(null);
    try {
      const phone = await pickPhoneFromContacts();
      if (phone) setRecipientPhone(phone);
    } catch {
      setError("Impossible d'ouvrir les contacts de votre téléphone.");
    } finally {
      setPickingContact(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("subscriptionId", subscriptionId);
    formData.set("recipientPhone", recipientPhone);

    const result = await createMealGift(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess({
      shortCode: result.data.shortCode,
      autoSent: result.data.autoSent,
      waMeUrl: result.data.waMeUrl,
    });
    setRecipientPhone("");
  }

  if (mealsRemaining <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Plus de repas disponibles pour en offrir.
      </p>
    );
  }

  return (
    <>
      <ActionOverlay
        open={loading}
        message="Préparation du repas offert…"
        detail="Création du QR à usage unique et envoi WhatsApp."
      />

      {success ? (
        <div className="space-y-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
          <p className="font-medium text-success">
            {success.autoSent
              ? "Repas offert envoyé sur WhatsApp !"
              : "Repas offert créé — envoyez-le au destinataire."}
          </p>
          <p className="text-muted-foreground">
            Code secours : <strong className="font-mono">{success.shortCode}</strong>
            {" "}— valable 7 jours, usage unique.
          </p>
          {!success.autoSent && success.waMeUrl && (
            <Button asChild variant="secondary" className="w-full">
              <a href={success.waMeUrl} target="_blank" rel="noopener noreferrer">
                Ouvrir WhatsApp pour envoyer
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setSuccess(null)}
          >
            Offrir un autre repas
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Offrez un repas à un proche : un QR à usage unique sera envoyé sur
            son WhatsApp. Le repas sera déduit de votre solde à la validation en
            caisse.
          </p>
          <div className="space-y-2">
            <Label htmlFor="gift-phone">WhatsApp du destinataire</Label>
            <div className="flex gap-2">
              <Input
                id="gift-phone"
                name="recipientPhone"
                type="tel"
                inputMode="tel"
                required
                placeholder="6XX XXX XXX"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                autoComplete="tel"
                className="flex-1"
              />
              {contactsAvailable && (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-1.5 px-3"
                  onClick={pickContact}
                  disabled={loading || pickingContact}
                  aria-label="Choisir dans les contacts"
                >
                  <Contact className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Contacts</span>
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {contactsAvailable
                ? "Choisissez un contact ou saisissez le numéro WhatsApp."
                : "Saisissez le numéro WhatsApp (sur iPhone, collez depuis vos contacts si besoin)."}
            </p>
          </div>
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <Gift className="h-4 w-4" />
            {loading ? "Envoi…" : "Offrir un repas"}
          </Button>
        </form>
      )}
    </>
  );
}
