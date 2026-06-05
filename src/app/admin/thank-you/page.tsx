import { ThankYouForm } from "@/components/admin/thank-you-form";
import { getThankYouPageData } from "@/app/actions/thank-you";

export default async function AdminThankYouPage() {
  const { settings, subscriptionCount, whatsappConfigured, whatsappProvider } =
    await getThankYouPageData();

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="font-display text-2xl font-semibold">Remerciements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Message personnalisé et lien vers les photos de l&apos;événement, envoyé par
          WhatsApp à tous les souscripteurs.
        </p>
      </div>
      <ThankYouForm
        settings={settings}
        subscriptionCount={subscriptionCount}
        whatsappConfigured={whatsappConfigured}
        whatsappProvider={whatsappProvider}
      />
    </div>
  );
}
