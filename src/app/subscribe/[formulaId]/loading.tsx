import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LoadingState } from "@/components/ui/loading-state";

export default function SubscribeLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader activePath="/" />
      <main className="page-main flex flex-1 items-center justify-center">
        <LoadingState
          message="Préparation du formulaire…"
          detail="Vérification des places disponibles."
        />
      </main>
      <SiteFooter />
    </div>
  );
}
