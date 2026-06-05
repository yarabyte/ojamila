import { LoadingState } from "@/components/ui/loading-state";

export default function ClientLoading() {
  return (
    <LoadingState
      message="Ouverture de votre espace…"
      detail="Chargement de vos abonnements et de votre QR."
    />
  );
}
