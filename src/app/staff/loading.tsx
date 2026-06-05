import { LoadingState } from "@/components/ui/loading-state";

export default function StaffLoading() {
  return (
    <main className="staff-page-main flex min-h-[50vh] items-center justify-center">
      <LoadingState
        message="Chargement caisse…"
        detail="Préparation de l'espace staff."
      />
    </main>
  );
}
