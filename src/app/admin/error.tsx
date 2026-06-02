"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="font-display text-xl font-semibold">Erreur admin</h2>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <div className="flex gap-3">
        <Button type="button" onClick={() => reset()}>
          Réessayer
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/admin">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
