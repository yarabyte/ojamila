import Link from "next/link";
import { ClientLoginForm } from "@/components/client/client-login-form";
import { ClientLogoutButton } from "@/components/client/client-logout-button";
import { ClientPushButton } from "@/components/client/client-push-button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { prisma } from "@/lib/db";
import { subscriptionService } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";
import { SubscriptionStatus } from "@prisma/client";
import { ChevronRight, QrCode } from "lucide-react";

export default async function ClientPage() {
  const phone = await getClientPhoneFromCookies();

  if (!phone) {
    return (
      <>
        <PageHeader
          title="Mon espace client"
          description="Recevez un code par WhatsApp pour accéder à vos abonnements et QR codes."
        />
        <Card className="mx-auto mt-8 max-w-md shadow-card">
          <CardContent className="pt-6">
            <ClientLoginForm redirectTo="/client/qr" />
          </CardContent>
        </Card>
      </>
    );
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      subscriptions: {
        include: { formula: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const subs = user?.subscriptions ?? [];
  const activeSub = subs.find((s) => s.status === SubscriptionStatus.ACTIVE);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={`Bonjour${user?.name ? `, ${user.name}` : ""}`}
          description={phone}
        />
        <ClientLogoutButton />
      </div>

      {activeSub && (
        <Button asChild className="mb-6 w-full gap-2 sm:w-auto" size="lg">
          <Link href="/client/qr">
            <QrCode className="h-5 w-5" />
            Voir mon QR maintenant
          </Link>
        </Button>
      )}

      <div className="mb-6">
        <ClientPushButton />
      </div>

      {subs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Aucun abonnement.</p>
            <Button asChild className="mt-4">
              <Link href="/">Découvrir les formules</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {subs.map((sub) => (
            <li key={sub.id}>
              <Link href={`/client/subscription/${sub.id}`}>
                <Card className="transition-shadow hover:shadow-soft active:scale-[0.99]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base sm:text-lg">
                      {sub.formula.name}
                    </CardTitle>
                    <StatusBadge status={sub.status} />
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <div className="min-w-0 text-sm text-muted-foreground">
                      <p>{formatFcfa(sub.formula.priceFcfa)}</p>
                      <p className="mt-1 font-medium text-success">
                        {subscriptionService.mealsRemaining(sub)} repas restants
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gold-deep" />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
