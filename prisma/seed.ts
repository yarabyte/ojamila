import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CGU = `CONDITIONS GÉNÉRALES D'UTILISATION ET DE VENTE — O'JAMILA Abonnements

1. Objet
Les présentes CGU régissent la souscription aux formules d'abonnement repas buffet midi du restaurant O'JAMILA (Bonapriso, Douala).

2. Validité
Chaque abonnement est valable 6 mois (180 jours) à compter de la date d'activation après paiement en espèces à la caisse.

3. Consommation
Un maximum d'un (1) repas par jour et par abonnement est autorisé, sauf paramétrage différent affiché lors de la souscription.

4. Caractère personnel
L'abonnement est nominatif, non cessible et non remboursable.

5. Paiement
Le paiement s'effectue uniquement en espèces au restaurant. L'activation intervient après encaissement confirmé par le staff.

6. Liste d'attente
En cas de plafond atteint pour une formule, le client peut rejoindre une liste d'attente sans garantie de place.

7. Acceptation
La souscription implique l'acceptation intégrale des présentes CGU.`;

const FORMULAS = [
  {
    name: "Starter",
    mealsIncluded: 15,
    bonusMeals: 1,
    priceFcfa: 90_000,
    salesTarget: 25,
    hardCap: 35,
    sortOrder: 1,
  },
  {
    name: "Confort",
    mealsIncluded: 25,
    bonusMeals: 3,
    priceFcfa: 150_000,
    salesTarget: 20,
    hardCap: 30,
    sortOrder: 2,
  },
  {
    name: "Premium",
    mealsIncluded: 50,
    bonusMeals: 8,
    priceFcfa: 300_000,
    salesTarget: 12,
    hardCap: 20,
    sortOrder: 3,
  },
  {
    name: "VIP Fondateur",
    mealsIncluded: 100,
    bonusMeals: 20,
    priceFcfa: 600_000,
    salesTarget: 3,
    hardCap: 5,
    sortOrder: 4,
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("jamila2025", 10);

  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      cguText: DEFAULT_CGU,
      cguVersion: "1.0",
      whatsappMessageTemplate:
        "Bonjour {{name}} ! Votre abonnement JAMILA est prêt. Consultez votre QR ici : {{qrLink}} — Code secours : {{shortCode}}",
      dailyMealLimitDefault: 1,
      validityDaysDefault: 180,
      fundraisingGoalFcfa: 10_000_000,
    },
    update: {
      cguText: DEFAULT_CGU,
    },
  });

  for (const formula of FORMULAS) {
    await prisma.formula.upsert({
      where: { id: `seed-${formula.name.toLowerCase().replace(/\s+/g, "-")}` },
      create: {
        id: `seed-${formula.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...formula,
        validityDays: 180,
        active: true,
      },
      update: {
        ...formula,
        active: true,
      },
    });
  }

  await prisma.user.upsert({
    where: { phone: "+237600000001" },
    create: {
      name: "Mme Amina",
      phone: "+237600000001",
      email: "admin@ojamila.cm",
      passwordHash,
      role: "ADMIN",
      active: true,
    },
    update: {
      passwordHash,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { phone: "+237600000002" },
    create: {
      name: "Staff Démo",
      phone: "+237600000002",
      email: "staff@ojamila.cm",
      passwordHash,
      role: "STAFF",
      active: true,
    },
    update: {
      passwordHash,
      active: true,
    },
  });

  console.log("Seed OK — admin/staff : jamila2025");
  console.log("  admin@ojamila.cm ou +237600000001");
  console.log("  staff@ojamila.cm ou +237600000002");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
