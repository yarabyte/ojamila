import { LoadingState } from "@/components/ui/loading-state";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <LoadingState
        message="Chargement administration…"
        detail="Récupération des statistiques et données."
      />
    </div>
  );
}
