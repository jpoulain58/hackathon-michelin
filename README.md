# Michelin Trust Wheels — Documentation technique

Monorepo npm workspaces : API REST (NestJS), front web (Next.js 15), application mobile (Expo), moteur de recommandation pur JS, persistance Supabase (Postgres + Auth).

## Sommaire

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du monorepo](#structure-du-monorepo)
- [Démarrer en local](#démarrer-en-local)
- [Variables d'environnement](#variables-denvironnement)
- [API NestJS — documentation interactive (Swagger)](#api-nestjs-documentation-interactive-swagger)
- [Routes internes Next.js (BFF confidentiel)](#routes-internes-nextjs-bff-confidentiel)
- [Authentification](#authentification)
- [Modèle de données (Supabase)](#modèle-de-données-supabase)
- [Moteur de recommandation](#moteur-de-recommandation-packagesrecommender)
- [Tests](#tests)
- [Docker](#docker)
- [CI](#ci)
- [Conventions du projet](#conventions-du-projet)

## Architecture

```
┌──────────────┐      ┌──────────────────────────────────────┐
│  mobile/      │      │  web/ (Next.js 15, App Router)        │
│  Expo Go      │      │  ├─ pages/composants (SSR + client)   │
│  React Native │      │  └─ app/api/* — routes internes (BFF) │
└──────┬───────┘      └───────┬─────────────────┬──────────────┘
       │  EXPO_PUBLIC_API_URL  │ NEXT_PUBLIC_API_URL │ fetch interne (même origine)
       │  EXPO_PUBLIC_WEB_URL  │                     │
       ▼                       ▼                     ▼
┌─────────────────────────────────────┐   ┌────────────────────────────┐
│  api/ — NestJS, prefix /api           │   │  app/api/* (Next.js)        │
│  catalogue, recommandation, balades,  │   │  reviews, products, articles│
│  communauté, revendeurs, auth fédérée │   │  → lecture table `products` │
└──────────────┬────────────────────────┘   │    confidentielle (service   │
               │                              │    role, jamais exposée)    │
               │ @mtw/recommender             └──────────────┬──────────────┘
               ▼                                              │
┌──────────────────────────┐                                 │
│ packages/recommender      │                                 │
│ moteur pur JS, 0 dépendance│                                 │
└──────────────────────────┘                                 │
               │                                              │
               ▼                                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Supabase — Postgres (tables métier) + Auth (Google, email, Strava/ │
│ Garmin via callbacks backend dédiés) + Realtime (ws)                │
└──────────────────────────────────────────────────────────────────┘
```

Deux surfaces d'API distinctes, à ne pas confondre :

1. **API NestJS** (`api/`, port 3001, préfixe `/api`) — le service applicatif partagé par le web et le mobile : catalogue pneus, recommandation, balades, communauté, revendeurs, fédération d'auth Strava/Garmin. Documentée par Swagger (voir plus bas).
2. **Routes internes Next.js** (`web/app/api/*`) — un pattern *backend-for-frontend* : elles tournent côté serveur Next, utilisent le client Supabase `service_role` pour lire la table confidentielle `products` (catalogue réel Michelin) et ne sont jamais exposées comme une API publique. Le mobile les consomme via `EXPO_PUBLIC_WEB_URL` (cross-origin), le web via fetch relatif. Elles ne sont pas couvertes par Swagger — ce n'est pas une API au sens produit, mais un détail d'implémentation du front.

## Stack technique

| Composant | Techs |
|---|---|
| `api/` | NestJS 10, TypeScript 5.5 (strict), `@nestjs/swagger` 8, `@supabase/supabase-js`, `ws` (Realtime transport), `ts-node`/`tsx` en dev, `tsc` pour le build |
| `web/` | Next.js 15 (App Router), React 18, Tailwind CSS 3 + `tailwindcss-animate`, shadcn/ui (Radix primitives), `react-markdown` |
| `mobile/` | Expo 56 (Expo Go), React Native 0.85, React 19, `@supabase/supabase-js`, `expo-document-picker`/`expo-file-system` (import GPX) |
| `packages/recommender` | JS pur (CommonJS), zéro dépendance runtime — scoring de catalogue testé en isolation |
| Données | Supabase (Postgres managé + Auth + Realtime), SQL versionné dans `supabase/*.sql` (pas d'ORM/migration tool : exécution manuelle dans le SQL Editor) |
| Tests | Vitest (workspaces `api`, `packages/recommender`, `web`) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) : install → tests → typecheck → build |
| Conteneurs | Docker (`api/Dockerfile`, `web/Dockerfile`, `mobile/Dockerfile`) + `docker-compose.yml` (Postgres local + 3 services) |

Node ≥ 20.19.4 requis (`engines` du `package.json` racine).

## Structure du monorepo

```
.
├── api/                          # NestJS — service applicatif (port 3001, prefix /api)
│   └── src/
│       ├── auth/                 # Supabase JWT, fédération Strava + Garmin (OAuth2/PKCE)
│       ├── community/            # stats collectives, pneus des pros
│       ├── products/             # recherche catalogue confidentiel (autocomplete)
│       ├── retailers/            # revendeurs (CTA "voir où acheter")
│       ├── rides/                # balades publiques (Strava import / GPX upload)
│       ├── tags/                 # tags prédéfinis des balades
│       ├── tyres/                # catalogue + moteur de recommandation
│       ├── health/                # healthcheck
│       ├── env.ts                # chargement .env (process.loadEnvFile)
│       └── main.ts               # bootstrap Nest, CORS, Swagger
├── web/                          # Next.js 15 (App Router), charte Michelin
│   ├── app/                      # pages (RSC) + app/api/* (routes internes BFF)
│   ├── components/, lib/         # UI partagée, clients fetch vers l'API NestJS
├── mobile/                       # Expo Go
│   └── src/{screens,components,lib,data}/
├── packages/
│   └── recommender/              # moteur de recommandation (cœur métier, testé, 0 dépendance)
├── supabase/                     # schéma SQL versionné (à exécuter manuellement)
├── scripts/                      # seed catalogue produits (scripts/seed-products.mjs, scripts/seed-data/)
├── docker-compose.yml            # db (postgres) + api + web + mobile (Expo)
└── .github/workflows/ci.yml      # lint + tests + build
```

## Démarrer en local

Prérequis : **Node ≥ 20.19.4**, un projet Supabase (gratuit suffit).

```bash
npm install        # installe tous les workspaces (npm workspaces, lockfile unique à la racine)
npm test           # tests unitaires : recommender + api + web
npm run lint       # typecheck (tsc --noEmit) — pas d'ESLint/Prettier configuré sur ce repo
npm run build      # build api (tsc) + web (next build)

# en dev, dans 3 terminaux :
npm run dev:api    # API NestJS    -> http://localhost:3001/api  (Swagger : /api/docs)
npm run dev:web    # Next.js       -> http://localhost:3000
npm run dev:mobile # Expo Go       -> QR code dans le terminal
```

`cp .env.example .env` si le fichier existe, sinon créer un `.env` à la racine avec les variables listées ci-dessous (chargées par `api/src/env.ts` via `process.loadEnvFile`, et par Next.js/Expo nativement pour leurs propres `.env`).

Avant le premier lancement : exécuter le contenu de `supabase/*.sql` dans le SQL Editor du projet Supabase (voir [Modèle de données](#modèle-de-données-supabase)), puis lancer `node scripts/seed-products.mjs` pour peupler la table `products` depuis l'échantillon anonymisé si elle est vide (sinon les autocomplete pneu ne renvoient rien).

## Variables d'environnement

### API (`api/`, jamais exposées au client)

| Variable | Usage |
|---|---|
| `PORT` | Port d'écoute Nest (défaut `3001`) |
| `WEB_ORIGIN` | Liste d'origines autorisées en CORS (séparées par des virgules). `localhost`/`127.0.0.1` et `*.vercel.app` sont toujours autorisés (voir `main.ts`) |
| `API_PUBLIC_URL` | URL publique de l'API utilisée pour construire les redirect URIs OAuth (défaut `http://localhost:<PORT>`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Client Supabase côté serveur (service role) — requis pour `rides`, `products`, `retailers`, `tags`, et la synchro `riders`/`provider_connections` |
| `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`, `STRAVA_SCOPES` | OAuth2 Strava (flux backend dédié, Strava n'étant pas OIDC) |
| `STRAVA_AUTHORIZE_URL`, `STRAVA_TOKEN_URL`, `STRAVA_API_URL`, `STRAVA_ATHLETE_URL`, `STRAVA_ACTIVITIES_URL`, `STRAVA_STATS_URL` | Endpoints Strava (valeurs par défaut fournies, surchargeables) |
| `STRAVA_ACTIVITIES_PER_PAGE`, `STRAVA_PROFILE_DAYS`, `STRAVA_PROFILE_CACHE_SECONDS` | Réglages de pagination / fenêtre d'analyse / cache du profil Strava |
| `GARMIN_CLIENT_ID`, `GARMIN_CLIENT_SECRET`, `GARMIN_REDIRECT_URI` | OAuth 2.0 + PKCE Garmin |
| `GARMIN_AUTHORIZE_URL`, `GARMIN_TOKEN_URL`, `GARMIN_USER_API_URL` | Endpoints Garmin (valeurs par défaut fournies) |
| `CATALOG_PATH` | Chemin vers le catalogue réel (confidentiel, jamais commité) ; absent → fallback sur `packages/recommender/data/products.sample.json` |

### Web (`web/`, préfixe `NEXT_PUBLIC_*` exposé au navigateur)

| Variable | Usage |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL de l'API NestJS |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client Supabase Auth côté navigateur |
| `SUPABASE_SERVICE_ROLE_KEY` | Utilisé par les routes internes `app/api/*` (serveur Next uniquement) pour lire la table confidentielle `products` |

### Mobile (`mobile/`, préfixe `EXPO_PUBLIC_*` exposé au bundle)

| Variable | Usage |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL de l'API NestJS (remplacer `localhost` par `10.0.2.2` sur Android Emulator) |
| `EXPO_PUBLIC_WEB_URL` | Base URL du site web — consommée pour les routes internes BFF (`/api/reviews`, `/api/products`) |
| `EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL` | Callback web (`/auth/callback`) utilisé comme relais pour Strava/Garmin en Expo Go |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client Supabase Auth côté app |

### Configuration Supabase Auth (dashboard, pas une variable d'env)

Dans **Auth > URL Configuration > Redirect URLs**, ajouter `http://localhost:3000/auth/callback` (et `http://10.0.2.2:3000/auth/callback` sur Android Emulator, `http://<IP_LAN>:3000/auth/callback` sur téléphone physique). Côté Strava/Garmin Developer, configurer les callbacks sur `STRAVA_REDIRECT_URI`/`GARMIN_REDIRECT_URI` (par défaut `http://localhost:3001/api/auth/{strava,garmin}/callback`).

## API NestJS — documentation interactive (Swagger)

Une fois `npm run dev:api` lancé :

- **Swagger UI** : http://localhost:3001/api/docs
- **OpenAPI JSON brut** : http://localhost:3001/api/docs-json

Le schéma est généré depuis le code (`@nestjs/swagger`, décorateurs `@ApiTags`/`@ApiOperation`/`@ApiQuery`/`@ApiBody` sur les contrôleurs) — il reste donc à jour avec les routes réelles. L'authentification Bearer (JWT de session Supabase, `Authorization: Bearer <access_token>`) est déclarée comme schéma de sécurité `supabase-jwt` et utilisable directement depuis le bouton "Authorize" de Swagger UI.

Référence rapide des endpoints (groupés par tag Swagger) :

| Tag | Méthode | Route | Description |
|---|---|---|---|
| health | GET | `/api/health` | Statut du service |
| tyres | GET | `/api/tyres` | Catalogue filtrable (`discipline`, `limit`, `ids`) |
| tyres | GET | `/api/tyres/options` | Disciplines & priorités (alimente le wizard) |
| tyres | GET | `/api/tyres/recommend` | Recommandation scorée (`discipline`, `priority`, `ebike`, `limit`) |
| tyres | GET | `/api/tyres/recommend/from-strava` | Recommandation déduite des sorties Strava récentes (auth requise) |
| auth | GET | `/api/auth/me` | Vérifie le JWT Supabase fourni |
| auth | POST | `/api/auth/sync` | Crée/met à jour `public.riders` depuis la session Supabase (auth requise) |
| auth | GET | `/api/auth/profile` | Profil connecté + comptes liés + données Strava réelles (auth requise) |
| auth | GET | `/api/auth/garmin/start` | Démarre le flux Garmin OAuth2/PKCE |
| auth | GET | `/api/auth/garmin/callback` | Callback Garmin (redirection navigateur uniquement) |
| auth | GET | `/api/auth/strava/start` | Démarre le flux Strava OAuth2 |
| auth | GET | `/api/auth/strava/callback` | Callback Strava (redirection navigateur uniquement) |
| community | GET | `/api/community/stats` | Compteurs collectifs (preuve sociale) |
| community | GET | `/api/community/pros` | Pneus des pros |
| community | GET | `/api/community/pros/:slug` | Fiche d'un pro |
| rides | GET | `/api/rides` | Balades publiques (`terrain`, `difficulty`, `ambassador`) |
| rides | GET | `/api/rides/:id` | Détail d'une balade |
| rides | POST | `/api/rides/from-strava` | Publie une activité Strava comme balade (auth requise) |
| rides | POST | `/api/rides/from-gpx` | Publie une balade depuis un GPX (auth requise) |
| tags | GET | `/api/tags` | Tags prédéfinis pour les balades |
| products | GET | `/api/products/search` | Autocomplete pneus du catalogue confidentiel (`q`, `limit`) |
| retailers | GET | `/api/retailers` | Revendeurs (`country`, `limit`) |

## Routes internes Next.js (BFF confidentiel)

Non documentées par Swagger (pas une API publique), servies par `web/app/api/*` :

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/reviews?productId=` ou `?limit=` | Avis vérifiés (par produit ou les plus récents) |
| POST | `/api/reviews` | Publie/met à jour un avis (auth via header `Authorization`) |
| GET | `/api/products` | Liste minimale `{id, name}` pour le sélecteur "laisser un avis" |
| GET | `/api/articles/:slug/products` | Pneus liés à un article (table `article_products`) |

## Authentification

Supabase Auth gère nativement Google et le magic link email. Strava et Garmin ne sont pas des providers OIDC : ils passent par un flux OAuth2 backend dédié (`api/src/auth/strava.service.ts`, `garmin.service.ts`, PKCE pour Garmin) qui provisionne ou relie un compte Supabase existant. Les tokens OAuth sont stockés dans `public.provider_connections` via la service role — **jamais côté client**.

Sur mobile (Expo Go), Supabase redirige vers le callback web qui renvoie ensuite vers l'app via deep link (`mtw://` ou `exp://`).

## Modèle de données (Supabase)

Pas d'ORM/outil de migration : le schéma vit dans `supabase/*.sql`, à exécuter manuellement dans le SQL Editor du projet.

| Fichier | Contenu |
|---|---|
| `riders.sql` | Profils riders (`public.riders`), miroir de `auth.users` |
| `rides.sql` | Balades publiques (Strava ou GPX) |
| `rides_used_tyre.sql` | Lien balade ↔ pneu utilisé (`used_tyre_product_id`, note 1-5) |
| `tags.sql` | Tags prédéfinis (clé/label/icône) pour les balades |
| `products.sql` | Catalogue pneus (confidentiel — jamais lu par le client, accès service role uniquement) |
| `retailers.sql`, `retailers_seed.sql` | Revendeurs |
| `ambassador.sql` | Statut ambassadeur (calculé serveur, jamais fourni par le client) |
| `articles.sql`, `article_products.sql` | Actualités et pneus liés |
| `reviews.sql` | Avis vérifiés (adossés aux km Strava) |
| `tyre_test_reservations.sql` | Réservations d'essai pneu (Power Pulse) |

Le catalogue **réel** Michelin (table `products`) est confidentiel : jamais commité (`.gitignore`), peuplé via `node scripts/seed-products.mjs` à partir d'un export, ou en local via `CATALOG_PATH` pour le moteur de recommandation qui lit, lui, `packages/recommender/data/products.sample.json` (échantillon anonymisé, versionné) en l'absence de catalogue réel.

## Moteur de recommandation (`packages/recommender`)

Package CommonJS, zéro dépendance runtime, consommé par l'API via le workspace `@mtw/recommender` (`api/package.json` → `"@mtw/recommender": "*"`).

- `loadCatalog()/loadTyres()` — charge le catalogue (réel via `CATALOG_PATH`, sinon l'échantillon)
- `scoreProduct(product, discipline, priority, ebike)` — score un pneu pour un profil donné + justification (`why`)
- `recommend(products, profile)` — trie et limite le catalogue scoré
- `DISCIPLINES`, `PRIORITIES` — référentiels exposés par `GET /api/tyres/options`

Testé en isolation dans `packages/recommender/test/recommend.test.js`.

## Tests

```bash
npm test   # vitest --workspaces : packages/recommender, api, web
```

- `api/test/*.spec.ts` — services Nest (ex. `tyres.service`, `community.service`), `test/setup.ts` charge `reflect-metadata` avant les imports (requis par les décorateurs `@Injectable`)
- `packages/recommender/test/recommend.test.js` — moteur de scoring
- `web/lib/utils.test.ts` — utilitaires front

## Docker

```bash
docker compose up --build   # db (postgres) + api + web + mobile (Expo)
```

Pour scanner le QR Expo Go depuis un téléphone physique avec Docker, renseigner `REACT_NATIVE_PACKAGER_HOSTNAME` dans `.env` avec l'IP locale de la machine avant de lancer Compose.

## CI

`.github/workflows/ci.yml` : sur push `main` et sur chaque PR — install (`npm ci`) → `npm test` → `npm run lint` (typecheck) → `npm run build` (api + web), Node 20.19.4.

## Conventions du projet

- **Monorepo npm workspaces** (`api`, `web`, `mobile`, `packages/*`), un seul lockfile à la racine — ne pas créer de lockfile dans un sous-workspace.
- **TypeScript strict** partout. Pas d'ESLint/Prettier configuré sur ce repo : le script `lint` se limite à `tsc --noEmit` (typecheck). `web` n'a pas de script `lint` propre (le typecheck est fait par `next build`) ; `mobile` expose `npm run typecheck`.
- **Pattern NestJS par domaine** : chaque dossier sous `api/src/<domaine>/` regroupe `*.module.ts` (wiring DI), `*.controller.ts` (HTTP + décorateurs Swagger) et `*.service.ts` (logique + accès Supabase). Pour ajouter un domaine : suivre ce triptyque et l'enregistrer dans `app.module.ts`.
- **Accès aux données confidentielles** (catalogue `products` réel, statut ambassadeur) toujours via un client Supabase `service_role`, instancié côté serveur uniquement (`api/`, ou routes internes `web/app/api/*`) — jamais exposé au navigateur ni dérivé d'une entrée utilisateur.
- **Commentaires en français** expliquant le "pourquoi" (contraintes, contournements), identifiants de code en anglais.
- Le catalogue pneu réel ne doit **jamais** être commité ; seul l'échantillon anonymisé `packages/recommender/data/products.sample.json` est versionné.
