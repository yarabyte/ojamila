"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function ClientLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/client/logout", { method: "POST" });
    router.push("/client");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1.5 text-xs text-muted-foreground"
      onClick={logout}
      disabled={loading}
    >
      <LogOut className="h-3.5 w-3.5" />
      {loading ? "…" : "Déconnexion"}
    </Button>
  );
}
