# JAMILA — Abonnements O'JAMILA

PWA de prévente d'abonnements repas pour **O'JAMILA** (Bonapriso, Douala).

## Installation

```bash
npm install
cp .env.example .env
# DATABASE_URL, DIRECT_URL (Supabase ou local), NEXTAUTH_SECRET, JWT_QR_SECRET, NEXT_PUBLIC_APP_URL

# Supabase : voir docs/SUPABASE.md
npm run db:verify && npm run db:setup

npm run dev
```

## Comptes démo

| Rôle  | Connexion          | Mot de passe |
|-------|--------------------|--------------|
| Admin | `admin@ojamila.cm` | `jamila2025` |
| Staff | `staff@ojamila.cm` | `jamila2025` |

## Parcours

### Client (public)
- `/` — formules et disponibilité
- `/subscribe/[formulaId]` — souscription + CGU
- `/subscribe/confirmation/[id]` — consigne paiement espèces
- `/cgu` — conditions générales
- `/client` — espace client (numéro WhatsApp)
- `/client/subscription/[id]` — QR, solde, historique

### Staff (`/staff/*`)
- `/staff/scan` — scan QR / code secours, validation repas
- `/staff/subscribe` — souscription comptoir + encaissement
- `/staff/waitlist` — liste d'attente, promotion

### Admin (`/admin/*`)
- Dashboard KPIs, trésorerie 80/20, graphique
- CRUD formules, paramètres globaux, CGU
- Abonnements (filtres, détail, export CSV)
- Liste d'attente, gestion comptes staff

## PWA (installable sur mobile)

- `public/manifest.json` — icônes 192/512, raccourcis (Formules, Espace client, Scan)
- `public/sw.js` — cache + notifications push
- En production (HTTPS) : service worker + bannière d'installation automatique
- **Android Chrome** : bouton « Installer l'application » natif
- **iPhone Safari** : guide « Partager → Sur l'écran d'accueil »
- Icônes PNG : `npm run pwa:icons` (depuis `public/logo.svg`)

> Les navigateurs exigent une action utilisateur pour l'installation (tap sur le bouton). L'app s'affiche ensuite en plein écran avec l'icône Ô JAMILA sur l'écran d'accueil.

## Base Supabase (au lieu de Postgres local)

Guide détaillé : **[docs/SUPABASE.md](docs/SUPABASE.md)**

1. Créer un projet sur [supabase.com](https://supabase.com) (plan gratuit suffit).
2. **Project Settings → Database** :
   - Noter le mot de passe `postgres` (ou le réinitialiser).
   - **Connection string → URI** :
     - **Transaction pooler** (port `6543`) → `DATABASE_URL` (ajouter `?pgbouncer=true&connection_limit=1` si absent).
     - **Session pooler** ou **Direct** (port `5432`) → `DIRECT_URL`.
3. Dans `.env` (local) et sur **Vercel → Environment Variables** (Production) :
   ```env
   DATABASE_URL="postgresql://postgres.[ref]:[MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://postgres.[ref]:[MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   ```
4. Appliquer le schéma et les données initiales :
   ```bash
   npm run db:verify
   npm run db:setup
   ```
5. Vérifier dans Supabase **Table Editor** : tables `User`, `Formula`, `Subscription`, etc.
6. Redéployer sur Vercel si vous venez d’ajouter les variables.

> **Migrations** : `prisma migrate deploy` utilise `DIRECT_URL`. L’app en prod utilise `DATABASE_URL` (pooler) pour éviter d’épuiser les connexions sur Vercel.

## Déploiement Vercel (`ojamila.vercel.app`)

1. Importer le repo sur [Vercel](https://vercel.com)
2. Variables d'environnement :
   - `DATABASE_URL` + `DIRECT_URL` — Supabase (voir section ci-dessus)
   - `NEXTAUTH_URL` = `https://ojamila.vercel.app`
   - `NEXTAUTH_SECRET`, `JWT_QR_SECRET`
   - `NEXT_PUBLIC_APP_URL` = `https://ojamila.vercel.app`
3. Migrations + seed (avec les URLs Supabase dans `.env` ou en ligne de commande) :
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
4. Domaine : renommer le projet en `ojamila` → URL `https://ojamila.vercel.app`
5. Tester sur mobile : ouvrir l'URL → bannière PWA → installer → icône sur l'écran d'accueil

## API scan (staff authentifié)

- `POST /api/scan/lookup` — `{ qrToken }` ou `{ shortCode }`
- `POST /api/scan/consume` — `{ subscriptionId }` ou QR/code

## Logo

Remplacez `public/logo.svg` par `public/logo.png` et adaptez `SiteHeader` si besoin.

## Fonctionnalités avancées

### Connexion client par OTP WhatsApp
1. `/client` → saisir le numéro
2. Ouvrir WhatsApp (lien `wa.me` avec le code) ou utiliser le code affiché en **dev**
3. Saisir le code à 6 chiffres

### Scan hors ligne (staff)
- Si le réseau coupe lors de « Valider le repas », la consommation est stockée en **localStorage**
- Synchronisation auto via `POST /api/scan/sync` au retour en ligne
- Bannière orange sur l'écran scan

### Notifications push (optionnel)
```bash
npm run vapid:generate
# Copier les clés dans .env : NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
```
- Staff/Admin : bouton « Alertes » dans l'en-tête
- Client connecté : alerte promotion liste d'attente
- Nouvelle souscription → notif admin
