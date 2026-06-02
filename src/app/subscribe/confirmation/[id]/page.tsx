import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
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

export default async function ConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const sub = await subscriptionService.getById(params.id);
  if (!sub) notFound();

  const isWaitlist = sub.status === SubscriptionStatus.WAITLIST;
  const isPending = sub.status === SubscriptionStatus.PENDING_PAYMENT;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-8">
        <Card>
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
                <strong>{sub.formula.priceFcfa.toLocaleString("fr-FR")} FCFA</strong>{" "}
                en espèces et activer votre abonnement.
              </p>
            )}
            {sub.status === SubscriptionStatus.ACTIVE && (
              <p className="text-sm text-muted-foreground">
                Votre abonnement est actif. Consultez votre QR dans votre espace
                client.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/client/subscription/${sub.id}`}>
                  Voir mon abonnement
                </Link>
              </Button>
              {sub.status === SubscriptionStatus.ACTIVE && (
                <WhatsAppButton subscriptionId={sub.id} />
              )}
              <Button variant="secondary" asChild>
                <Link href="/">Accueil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
