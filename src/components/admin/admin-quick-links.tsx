import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DashboardLinkGrid, type DashboardLink } from "@/components/dashboard/link-grid";
import {
  Camera,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  List,
  Package,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

export async function AdminQuickLinks() {
  const [pendingCount, waitlistCount] = await Promise.all([
    prisma.subscription.count({
      where: { status: SubscriptionStatus.PENDING_PAYMENT },
    }),
    prisma.subscription.count({
      where: { status: SubscriptionStatus.WAITLIST },
    }),
  ]);

  const links: DashboardLink[] = [
    {
      href: "/admin/subscriptions?status=PENDING_PAYMENT",
      label: "Paiements à encaisser",
      description: "Valider les espèces — souscriptions en ligne",
      icon: CreditCard,
      badge: pendingCount,
      variant: pendingCount > 0 ? "highlight" : "default",
    },
    {
      href: "/admin/waitlist",
      label: "Liste d'attente",
      description: "Promouvoir quand une place se libère",
      icon: ClipboardList,
      badge: waitlistCount,
    },
    {
      href: "/admin/subscriptions",
      label: "Abonnements",
      description: "Liste complète, recherche, export CSV",
      icon: List,
    },
    {
      href: "/admin/formulas",
      label: "Formules",
      description: "CRUD prix, plafonds, bonus",
      icon: Package,
    },
    {
      href: "/admin/staff",
      label: "Comptes staff",
      description: "Créer ou désactiver",
      icon: Users,
    },
    {
      href: "/admin/settings",
      label: "Paramètres",
      description: "CGU, WhatsApp, objectif levée",
      icon: Settings,
    },
    {
      href: "/staff",
      label: "Espace caisse (staff)",
      description: "Scan, comptoir, paiements",
      icon: LayoutDashboard,
      variant: "admin",
    },
    {
      href: "/staff/scan",
      label: "Scanner repas",
      description: "Validation consommation",
      icon: Camera,
    },
    {
      href: "/staff/subscribe",
      label: "Souscription comptoir",
      description: "Nouveau client + espèces",
      icon: UserPlus,
    },
    {
      href: "/",
      label: "Site public",
      description: "Page d'accueil formules",
      icon: Home,
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">Accès rapide</h2>
      <DashboardLinkGrid links={links} />
    </section>
  );
}
