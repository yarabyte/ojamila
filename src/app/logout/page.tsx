"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { ActionOverlay, LoadingState } from "@/components/ui/loading-state";
import { VENUE_NAME } from "@/lib/venue";
import { CheckCircle2, LogOut, X } from "lucide-react";

function LogoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/login";
  const [loading, setLoading] = useState(false);

  async function confirmSignOut() {
    setLoading(true);
    await signOut({ callbackUrl });
  }

  return (
    <>
      <ActionOverlay
        open={loading}
        message="Déconnexion en cours…"
        detail="Fermeture de votre session équipe."
      />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gold/25 bg-card shadow-gold">
          <div className="border-b border-gold/20 bg-gradient-to-b from-gold-soft/80 to-gold-soft/30 px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/70 ring-2 ring-gold/40 shadow-sm">
              <LogOut className="h-8 w-8 text-gold-deep" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Déconnexion
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Session équipe · {VENUE_NAME}
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous
              reconnecter pour accéder à la caisse ou à l&apos;administration.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                className="w-full gap-2"
                size="lg"
                disabled={loading}
                onClick={() => void confirmSignOut()}
              >
                <CheckCircle2 className="h-5 w-5" />
                {loading ? "Déconnexion…" : "Confirmer"}
              </Button>
              <Button
                type="button"
                className="w-full gap-2"
                size="lg"
                variant="outline"
                disabled={loading}
                onClick={() => router.back()}
              >
                <X className="h-5 w-5" />
                Annuler
              </Button>
            </div>

            <p className="text-center text-sm">
              <Link
                href="/"
                className="font-medium text-gold-deep hover:underline"
              >
                ← Retour au site public
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <LoadingState message="Chargement…" variant="inline" />
        </main>
      }
    >
      <LogoutContent />
    </Suspense>
  );
}
