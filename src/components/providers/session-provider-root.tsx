"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const AuthSessionProvider = dynamic(
  () =>
    import("@/components/providers/session-provider").then(
      (m) => m.AuthSessionProvider
    ),
  { ssr: false }
);

export function AuthSessionProviderRoot({ children }: { children: ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
