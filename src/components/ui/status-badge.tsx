import { SubscriptionStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const labels: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: "Paiement en attente",
  ACTIVE: "Actif",
  WAITLIST: "Liste d'attente",
  EXPIRED: "Expiré",
  CANCELLED: "Annulé",
};

const styles: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: "badge-warning",
  ACTIVE: "badge-success",
  WAITLIST: "badge-gold",
  EXPIRED: "badge-muted",
  CANCELLED: "badge-danger",
};

export function StatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  return (
    <span className={cn(styles[status], className)}>{labels[status]}</span>
  );
}
