import { LoadingState } from "@/components/ui/loading-state";

export default function LoginLoading() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <LoadingState message="Ouverture de la connexion…" variant="card" />
    </main>
  );
}
