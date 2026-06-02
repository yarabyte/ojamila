"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Une erreur est survenue
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "Rechargez la page ou revenez à l&apos;accueil."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Réessayer
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Accueil</Link>
        </Button>
      </div>
    </div>
  );
}
