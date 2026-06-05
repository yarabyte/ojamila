import { SiteHeader } from "@/components/site-header";
import { LoadingState } from "@/components/ui/loading-state";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="page-main flex flex-1 items-center justify-center">
        <LoadingState
          message="Chargement de JAMILA…"
          detail="Récupération des formules et des informations."
        />
      </main>
    </div>
  );
}
