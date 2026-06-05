import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubscribeForm } from "@/components/subscription/subscribe-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { subscriptionService } from "@/lib/services";
import { formatFcfa } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SubscribePage({
  params,
}: {
  params: { formulaId: string };
}) {
  let availability;
  try {
    availability = await subscriptionService.getFormulaAvailability(
      params.formulaId
    );
  } catch {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/" />
      <main className="page-main flex-1">
        <Button variant="ghost" asChild className="-ml-2 mb-2">
          <Link href="/" className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Formules
          </Link>
        </Button>
        <PageHeader
          title="Finaliser la souscription"
          description={`${availability.name} · ${availability.totalMeals} repas · ${formatFcfa(availability.priceFcfa)}`}
        />
        <Card className="mx-auto mt-6 max-w-md shadow-card">
          <CardContent className="pt-6">
            <SubscribeForm formula={availability} />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
