import { AppError } from "@/lib/errors";

export function formatActionError(e: unknown, fallback: string): string {
  if (e instanceof AppError) return e.message;

  if (e instanceof Error) {
    if (e.message === "UNAUTHORIZED") {
      return "Session expirée — reconnectez-vous";
    }
    if (e.message === "FORBIDDEN") {
      return "Accès non autorisé";
    }
    if (e.message.includes("AppSettings singleton missing")) {
      return "Configuration manquante — exécutez le seed de la base";
    }
    if (
      e.message.includes("connection pool") ||
      e.message.includes("Timed out fetching a new connection")
    ) {
      return "Base de données occupée — réessayez dans quelques secondes";
    }
    if (e.message.includes("Transaction API error")) {
      return "Erreur base de données — réessayez";
    }
    return e.message;
  }

  return fallback;
}
