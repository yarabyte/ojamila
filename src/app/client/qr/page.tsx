import Link from "next/link";
import { ClientLoginForm } from "@/components/client/client-login-form";
import { ClientQrView } from "@/components/client/client-qr-view";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClientPrimarySubscription } from "@/lib/client-subscription";
import { getClientPhoneFromCookies } from "@/lib/client-session";

export const metadata = {
  title: "Mon QR — JAMILA",
};

export default async function ClientQrPage() {
  const phone = await getClientPhoneFromCookies();

  if (!phone) {
    return (
      <>
        <PageHeader
          title="Mon QR repas"
          description="Connectez-vous pour afficher votre QR à tout moment."
        />
        <Card className="mx-auto mt-6 max-w-md shadow-card">
          <CardContent className="pt-6">
            <ClientLoginForm redirectTo="/client/qr" />
          </CardContent>
        </Card>
      </>
    );
  }

  const sub = await getClientPrimarySubscription(phone);

  if (!sub) {
    return (
      <>
        <PageHeader
          title="Mon QR repas"
          description="Aucun abonnement actif pour le moment."
        />
        <Card className="mx-auto mt-6 max-w-md p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Souscrivez à une formule pour obtenir votre QR.
          </p>
          <Button asChild className="mt-4 w-full">
            <Link href="/formules">Voir les formules</Link>
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Mon QR repas"
        description={`${sub.formula.name} — présentez ce code à la caisse`}
      />
      <ClientQrView sub={sub} />
    </>
  );
}
