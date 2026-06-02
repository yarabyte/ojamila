import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClientLoginForm } from "@/components/client/client-login-form";
import { ClientPushButton } from "@/components/client/client-push-button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientPhoneFromCookies } from "@/lib/client-session";
import { prisma } from "@/lib/db";
import { subscriptionService } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export default async function ClientPage() {
  const phone = await getClientPhoneFromCookies();

  if (!phone) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader activePath="/client" />
        <main className="page-main flex-1">
          <PageHeader
            title="Mon espace client"
            description="Recevez un code par WhatsApp pour accéder à vos abonnements et QR codes."
          />
          <Card className="mx-auto mt-8 max-w-md shadow-card">
            <CardContent className="pt-6">
              <ClientLoginForm />
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/client" />
      <main className="page-main flex-1">
        <PageHeader
          title={`Bonjour${user?.name ? `, ${user.name}` : ""}`}
          description={phone}
        />

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
                  <Card className="transition-shadow hover:shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg">{sub.formula.name}</CardTitle>
                      <StatusBadge status={sub.status} />
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>{formatFcfa(sub.formula.priceFcfa)}</p>
                        <p className="mt-1 font-medium text-success">
                          {subscriptionService.mealsRemaining(sub)} repas restants
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gold-deep" />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
