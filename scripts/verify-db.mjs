/**
 * Vérifie DATABASE_URL et DIRECT_URL avant migrate deploy.
 * Usage: node scripts/verify-db.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const required = ["DATABASE_URL", "DIRECT_URL"];

for (const key of required) {
  if (!process.env[key]?.trim()) {
    console.error(`✗ ${key} manquant dans .env`);
    process.exit(1);
  }
}

const isSupabase =
  process.env.DATABASE_URL.includes("supabase") ||
  process.env.DIRECT_URL.includes("supabase");

if (isSupabase && !process.env.DATABASE_URL.includes("pgbouncer=true")) {
  console.warn(
    "⚠ DATABASE_URL Supabase : ajoutez ?pgbouncer=true (Transaction pooler, port 6543)"
  );
}

const prisma = new PrismaClient();

try {
  const [{ ok }] = await prisma.$queryRaw`SELECT 1 AS ok`;
  if (ok === 1) {
    console.log("✓ Connexion OK (DATABASE_URL)");
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('User', 'Formula', 'AppSettings')
    `;
    if (tables.length === 0) {
      console.log("  → Base vide : lancez npm run db:deploy && npm run db:seed");
    } else {
      console.log(`  → Tables présentes : ${tables.map((t) => t.tablename).join(", ")}`);
    }
  }
} catch (e) {
  console.error("✗ Connexion échouée :", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
