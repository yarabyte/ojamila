import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { subscriptionService } from "@/lib/services";
import { VENUE_NAME } from "@/lib/venue";
import { SubscriptionStatus } from "@prisma/client";
import { WhatsAppButton } from "@/components/subscription/whatsapp-button";
import { QrCode } from "lucide-react";

export default async function ConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const sub = await subscriptionService.getById(params.id);
  if (!sub) notFound();

  const isWaitlist = sub.status === SubscriptionStatus.WAITLIST;
  const isPending = sub.status === SubscriptionStatus.PENDING_PAYMENT;
  const isActive = sub.status === SubscriptionStatus.ACTIVE;

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col">
      <SiteHeader activePath="/client" />
      <main className="page-main flex-1">
        <Card className="mx-auto w-full max-w-md shadow-card">
          <CardHeader>
            <CardTitle className="text-success">
              {isWaitlist
                ? "Inscrit en liste d'attente"
                : "Souscription enregistrée"}
            </CardTitle>
            <CardDescription>
              {sub.client.name} — {sub.formula.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isWaitlist && (
              <p className="rounded-xl bg-warning/10 p-4 text-sm text-warning">
                La formule est complète. Vous êtes en position{" "}
                <strong>{sub.waitlistPosition}</strong> sur la liste
                d&apos;attente. Nous vous contacterons par WhatsApp si une place
                se libère.
              </p>
            )}
            {isPending && (
              <p className="rounded-xl bg-gold-soft p-4 text-sm">
                <strong>Prochaine étape :</strong> présentez-vous à la caisse
                d&apos;{VENUE_NAME} pour régler{" "}
                <strong>
                  {sub.formula.priceFcfa.toLocaleString("fr-FR")} FCFA
                </strong>{" "}
                en espèces et activer votre abonnement.
              </p>
            )}
            {isActive && (
              <p className="rounded-xl bg-success/10 p-4 text-sm text-success">
                Votre abonnement est actif. Votre QR est disponible à tout moment
                dans l&apos;application.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {isActive ? (
                <Button asChild className="w-full gap-2" size="lg">
                  <Link href="/client/qr">
                    <QrCode className="h-5 w-5" />
                    Voir mon QR
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full" size="lg">
                  <Link href={`/client/subscription/${sub.id}`}>
                    Suivre mon abonnement
                  </Link>
                </Button>
              )}
              {isActive && <WhatsAppButton subscriptionId={sub.id} />}
              <Button variant="secondary" asChild className="w-full">
                <Link href="/">Menu</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
