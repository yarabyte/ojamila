import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LoadingState } from "@/components/ui/loading-state";

export default function ConfirmationLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/client" />
      <main className="page-main flex flex-1 items-center justify-center">
        <LoadingState
          message="Confirmation en cours…"
          detail="Récupération des détails de votre souscription."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
