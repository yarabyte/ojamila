import { LoadingState } from "@/components/ui/loading-state";

export default function ClientQrLoading() {
  return (
    <LoadingState
      message="Préparation de votre QR…"
      detail="Génération du code repas."
    />
  );
}
