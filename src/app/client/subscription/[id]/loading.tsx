import { LoadingState } from "@/components/ui/loading-state";

export default function ClientSubscriptionLoading() {
  return (
    <LoadingState
      message="Chargement de l'abonnement…"
      detail="Affichage du QR et de l'historique."
    />
  );
}
