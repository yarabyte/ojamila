import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getAppSettings } from "@/lib/settings";
import { VENUE_NAME } from "@/lib/venue";

export default async function CguPage() {
  const settings = await getAppSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/cgu" />
      <main className="page-main flex-1">
        <PageHeader
          title="Conditions Générales"
          description={`Version ${settings.cguVersion} — ${VENUE_NAME} Abonnements`}
        />
        <article className="card-elevated mt-8 max-w-none p-6 sm:p-8">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground">
            {settings.cguText}
          </div>
        </article>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Voir les formules</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/client/qr">Mon QR</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
