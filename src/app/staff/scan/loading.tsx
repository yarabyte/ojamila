import { LoadingState } from "@/components/ui/loading-state";

export default function StaffScanLoading() {
  return (
    <LoadingState
      message="Ouverture du scanner…"
      detail="Préparation de la caméra et de la validation repas."
      variant="inline"
      className="justify-center py-16"
    />
  );
}
