import {
  createStaffAccountAction,
  toggleStaffActive,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { staffService } from "@/lib/services";

export default async function AdminStaffPage() {
  const staff = await staffService.listStaff();

  return (
    <div className="space-y-8 pb-16">
      <h1 className="font-display text-2xl font-semibold">Comptes staff</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau compte</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createStaffAccountAction} className="grid max-w-md gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" type="tel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optionnel)</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            <Button type="submit">Créer</Button>
          </form>
        </CardContent>
      </Card>

      <ul className="space-y-3">
        {staff.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-xl border p-4"
          >
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">
                {s.phone} {s.email && `· ${s.email}`}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await toggleStaffActive(s.id, !s.active);
              }}
            >
              <Button
                type="submit"
                size="sm"
                variant={s.active ? "destructive" : "default"}
              >
                {s.active ? "Désactiver" : "Réactiver"}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
