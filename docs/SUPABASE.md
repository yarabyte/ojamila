# Basculer sur Supabase

## 1. Créer le projet Supabase

1. [supabase.com](https://supabase.com) → **New project**
2. Région proche des utilisateurs (ex. **Frankfurt** ou **Paris** si disponible)
3. Mot de passe **postgres** : notez-le (ou réinitialisez dans *Project Settings → Database*)

## 2. Récupérer les URLs de connexion

**Project Settings → Database → Connection string → URI**

| Variable | Mode Supabase | Port | Usage |
|----------|---------------|------|--------|
| `DATABASE_URL` | **Transaction** pooler | `6543` | App Next.js / Vercel |
| `DIRECT_URL` | **Session** pooler ou **Direct** | `5432` | `prisma migrate deploy`, seed |

Exemple (remplacez `[ref]`, `[PASSWORD]`, `[host]`) :

```env
# App (pooler — obligatoire sur Vercel)
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Migrations (connexion directe ou session)
DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

> Si Supabase affiche `db.[ref].supabase.co:5432` pour *Direct*, utilisez cette URL pour `DIRECT_URL`.

## 3. Configurer `.env` (local)

Copiez les deux URLs dans votre `.env` (ne commitez jamais ce fichier).

Conservez le reste (`NEXTAUTH_*`, `JWT_QR_SECRET`, VAPID, etc.).

## 4. Appliquer le schéma et les données démo

```bash
npm run db:verify    # teste DATABASE_URL + DIRECT_URL
npm run db:deploy    # migrations
npm run db:seed      # comptes admin/staff + formules
```

## 5. Vercel

Dans **Project → Settings → Environment Variables** (Production) :

- `DATABASE_URL` — URI Transaction pooler (`6543` + `pgbouncer=true`)
- `DIRECT_URL` — URI Session/Direct (`5432`)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `JWT_QR_SECRET`, `NEXT_PUBLIC_APP_URL`

Puis **Redeploy**.

Les migrations ne tournent pas automatiquement au build Vercel : lancez `npm run db:deploy` depuis votre machine (avec les URLs Supabase dans `.env`) après chaque nouvelle migration.

## 6. Vérifier

- Supabase **Table Editor** : `User`, `Formula`, `Subscription`, `AppSettings`, …
- Connexion admin : `admin@ojamila.cm` / `jamila2025` (après seed)

## Migrer les données locales (optionnel)

Si vous aviez déjà des données en Postgres local :

```bash
pg_dump -h localhost -U shakemill -d jamila --no-owner --no-acl -f jamila_backup.sql
psql "$DIRECT_URL" -f jamila_backup.sql
```

Sinon, un simple `db:deploy` + `db:seed` sur une base Supabase vide suffit.

## Dépannage

| Erreur | Solution |
|--------|----------|
| `Can't reach database server` | Vérifier mot de passe, IP allowlist (Supabase : *Allow all* en dev) |
| `prepared statement already exists` | Ajouter `?pgbouncer=true` à `DATABASE_URL` |
| `Unknown argument` Prisma | `npx prisma generate` puis redémarrer le serveur |
| Trop de connexions sur Vercel | Utiliser le pooler (`6543`), pas le port direct pour `DATABASE_URL` |
