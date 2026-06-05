"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VENUE_NAME } from "@/lib/venue";
import { ActionOverlay } from "@/components/ui/loading-state";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/staff";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      login: form.get("login") as string,
      password: form.get("password") as string,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants incorrects");
      return;
    }
    const session = await getSession();
    const dest =
      session?.user.role === "ADMIN" && !callbackUrl.startsWith("/staff")
        ? "/admin"
        : callbackUrl;
    router.push(dest);
    router.refresh();
  }

  return (
    <>
      <ActionOverlay
        open={loading}
        message="Connexion en cours…"
        detail="Vérification de vos identifiants staff."
      />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft">
              <Lock className="h-6 w-6 text-gold-deep" />
            </div>
            <CardTitle>Connexion équipe</CardTitle>
            <CardDescription>
              Staff caisse ou administrateur {VENUE_NAME}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Email ou téléphone</Label>
                <Input
                  id="login"
                  name="login"
                  placeholder="admin@ojamila.cm"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p
                  className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/" className="font-medium text-gold-deep hover:underline">
                ← Retour au site public
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
