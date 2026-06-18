# Déploiement — Michelin Trust Wheels

Le monorepo a 3 cibles distinctes + la base managée :

| Brique | Techno | Hébergeur | Déploiement |
|--------|--------|-----------|-------------|
| `web/` | Next.js | **Vercel** | push `main` = prod, PR = preview |
| `api/` | NestJS (Docker) | **Render** | push `main` = prod (auto-deploy) |
| `mobile/` | Expo / RN | EAS / Expo Go | hors web (build EAS) |
| base | PostgreSQL | **Supabase** (managé) | migrations SQL manuelles |

## Modèle de branches
- `develop` = branche d'intégration (on tire les features dessus).
- `main` = **production**, **protégée** (push direct interdit, PR + CI `build-test` verte obligatoires).
- Flux : `feature/*` → PR vers `develop` → PR `develop` → `main` → déploiement prod.

## 1. Supabase (déjà hébergé)
Rien à dockeriser : le projet est managé. Exécuter une fois les migrations dans **SQL Editor** :
`supabase/riders.sql`, `garage.sql`, `tyre_test_reservations.sql`, `articles.sql`, `article_products.sql`, `products.sql`, `retailers.sql`, `rides.sql`.
Récupérer les valeurs dans **Project Settings → API** : `URL`, clé `publishable/anon`, clé `service_role` (secrète).

## 2. API NestJS → Render (Docker)
1. Render → **New → Blueprint** → sélectionner ce repo (il lit [`render.yaml`](render.yaml)).
2. Renseigner les variables (onglet Environment) — **les secrets se saisissent ici, pas dans le repo** :
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`
   - `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`
   - `WEB_ORIGIN` = URL Vercel du front
   - `API_PUBLIC_URL` + `STRAVA_REDIRECT_URI` = `https://<api>.onrender.com` (+ `/api/auth/strava/callback`)
3. Render build l'image (`api/Dockerfile`), health check sur `/api/health`. `autoDeploy: true` → chaque push sur `main` redéploie.

> Render n'injecte pas `PORT` dans le code : l'app écoute déjà `process.env.PORT`. Ne pas le forcer.

## 3. Web Next.js → Vercel
1. Vercel → **Add New → Project** → importer le repo (autorise l'app GitHub).
2. **Root Directory = `web`** (monorepo). Framework détecté : Next.js.
3. Variables d'environnement (**les saisir dans Vercel**) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_API_URL` = URL Render de l'API
4. Production Branch = `main`. Résultat : **push/merge sur `main` = déploiement prod**, chaque PR = déploiement preview.

## 4. Mobile Expo
Pas sur Vercel. Variables `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_URL`.
Build via EAS (`eas build`) ou test via Expo Go (`npm run start -w mobile`).

## 5. Après le 1er déploiement (relier les URLs)
- Vercel : `NEXT_PUBLIC_API_URL` → URL Render.
- Render : `WEB_ORIGIN` → URL Vercel ; `API_PUBLIC_URL` / `STRAVA_REDIRECT_URI` → URL Render.
- Strava (dashboard developers) : ajouter l'`Authorization Callback Domain` = domaine de l'API Render.
- Supabase → Auth → URL Configuration : ajouter les URLs Vercel autorisées (redirections).

> Note sécurité : les clés/secrets ne sont **jamais** committés. Ils vivent uniquement dans les dashboards Vercel / Render / Supabase (et en local dans les `.env` ignorés par git).
