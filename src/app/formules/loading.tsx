import { SiteHeader } from "@/components/site-header";
import { LoadingState } from "@/components/ui/loading-state";

export default function FormulesLoading() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col">
      <SiteHeader activePath="/formules" />
      <main className="page-main flex flex-1 items-center justify-center">
        <LoadingState
          message="Chargement des formules…"
          detail="Récupération des offres partenaires."
        />
      </main>
    </div>
  );
}
