"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  promoteWaitlist,
  removeWaitlistEntry,
} from "@/app/actions/staff";
import { Button } from "@/components/ui/button";

export function WaitlistActions({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function promote() {
    setLoading(true);
    const result = await promoteWaitlist(subscriptionId);
    setLoading(false);
    if (result.success && result.data.whatsappUrl) {
      window.open(result.data.whatsappUrl, "_blank");
    }
    router.refresh();
  }

  async function remove() {
    if (!confirm("Retirer de la liste d'attente ?")) return;
    setLoading(true);
    await removeWaitlistEntry(subscriptionId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={promote} disabled={loading}>
        Promouvoir
      </Button>
      <Button size="sm" variant="destructive" onClick={remove} disabled={loading}>
        Retirer
      </Button>
    </div>
  );
}
