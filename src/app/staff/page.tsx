import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardLinkGrid, type DashboardLink } from "@/components/dashboard/link-grid";
import { StaffDashboardHero } from "@/components/staff/staff-dashboard-hero";
import { StaffSection } from "@/components/staff/staff-section";
import { StaffStatRow } from "@/components/staff/staff-stat-row";
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
  UtensilsCrossed,
  UserCheck,
} from "lucide-react";

export default async function StaffDashboardPage() {
  const session = await getServerAuthSession();
  const isAdmin = session?.user.role === "ADMIN";
  const userName = session?.user.name ?? "Équipe";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pendingCount, waitlistCount, activeCount, mealsToday] =
    await Promise.all([
      prisma.subscription.count({
        where: { status: SubscriptionStatus.PENDING_PAYMENT },
      }),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.WAITLIST },
      }),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      prisma.consumption.count({
        where: { consumedAt: { gte: startOfDay } },
      }),
    ]);

  const staffLinks: DashboardLink[] = [
    {
      href: "/staff/pending",
      label: "Paiements à encaisser",
      description: "Confirmer les espèces — inscriptions en ligne",
      icon: CreditCard,
      badge: pendingCount,
      variant: pendingCount > 0 ? "highlight" : "default",
    },
    {
      href: "/staff/subscribe",
      label: "Nouvelle souscription",
      description: "Comptoir + encaissement immédiat",
      icon: UserPlus,
    },
    {
      href: "/staff/waitlist",
      label: "Liste d'attente",
      description: "Promouvoir ou retirer un client",
      icon: ClipboardList,
      badge: waitlistCount,
    },
    {
      href: "/staff/scan",
      label: "Scanner un repas",
      description: "QR ou code secours",
      icon: Camera,
    },
  ];

  const publicLinks: DashboardLink[] = [
    {
      href: "/",
      label: "Site public",
      description: "Formules et souscription en ligne",
      icon: Home,
    },
    {
      href: "/client",
      label: "Espace client",
      description: "Aperçu du parcours client",
      icon: LayoutDashboard,
    },
  ];

  const adminLinks: DashboardLink[] = [
    {
      href: "/admin",
      label: "Dashboard admin",
      description: "KPIs et statistiques",
      icon: LayoutDashboard,
      variant: "admin",
    },
    {
      href: "/admin/subscriptions?status=PENDING_PAYMENT",
      label: "Tous les abonnements",
      description: "Recherche, filtres, export",
      icon: List,
      variant: "admin",
    },
    {
      href: "/admin/formulas",
      label: "Formules",
      description: "Prix et plafonds",
      icon: Package,
      variant: "admin",
    },
    {
      href: "/admin/settings",
      label: "Paramètres",
      description: "CGU, WhatsApp, limites",
      icon: Settings,
      variant: "admin",
    },
    {
      href: "/admin/staff",
      label: "Comptes staff",
      description: "Gestion de l'équipe",
      icon: Users,
      variant: "admin",
    },
  ];

  return (
    <main className="staff-page-main">
      <StaffDashboardHero name={userName} pendingCount={pendingCount} />

      <StaffStatRow
        stats={[
          {
            label: "Repas aujourd'hui",
            value: mealsToday,
            icon: UtensilsCrossed,
            tone: "success",
          },
          {
            label: "Abonnements actifs",
            value: activeCount,
            icon: UserCheck,
            tone: "gold",
          },
          {
            label: "Paiements en attente",
            value: pendingCount,
            icon: CreditCard,
            tone: pendingCount > 0 ? "warning" : "default",
          },
          {
            label: "Liste d'attente",
            value: waitlistCount,
            icon: ClipboardList,
            tone: waitlistCount > 0 ? "warning" : "default",
          },
        ]}
      />

      <StaffSection title="Caisse & service" subtitle="Actions du jour">
        <DashboardLinkGrid links={staffLinks} />
      </StaffSection>

      {isAdmin && (
        <StaffSection title="Administration" variant="admin">
          <DashboardLinkGrid links={adminLinks} />
        </StaffSection>
      )}

      <StaffSection title="Liens utiles">
        <div className="staff-links-compact">
          {publicLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="staff-link-chip">
              <Icon className="h-4 w-4 text-gold/80" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </StaffSection>
    </main>
  );
}
