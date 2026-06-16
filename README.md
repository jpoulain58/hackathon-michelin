# Michelin Trust Wheels — *La preuve par la route*

> La communauté qui transforme les riders Michelin en **prescripteurs**, et leurs kilomètres en **preuve sociale** que personne ne peut égaler.

**Hackathon ESGI 2026 — Réseau Skolae × Michelin LB 2 Wheels** · 15–20 juin 2026
Product Owner : Abdellatif Ghachi (Global Account Manager E-retail 2W)

> Ce dépôt contient **le code** de l'application. Les livrables documentaires (compréhension du brief, concept, architecture, maquettes) sont déposés sur la plateforme HackPilot.

---

## Le problème (recadré par le PO)

Cible = le **client final** (le cycliste), pas le retailer. Dans le vélo, **le prescripteur, c'est le pair** : on choisit ses pneus sur la recommandation d'autres cyclistes. Or Michelin est absent de cette couche — quand Michelin a **1 avis, Continental en a 100**. Pas de preuve sociale → pas de considération → pas de ventes.

**On ne veut pas un site e-commerce. On veut créer de l'émulation autour de Michelin.**

## La solution

Une **app** (B2C) en 2 parties + un club :

1. **Trouve ton pneu + Comparateur** — connexion **Strava/Garmin** → sélection perso, et un **comparateur transparent incluant les concurrents**. Bouton « Voir où acheter » = **renvoi revendeur** (pas de checkout).
2. **Communauté & émulation** — compteurs collectifs, **pneus des pros**, **avis vérifiés** (adossés aux vrais km), **balades de la semaine**, statut/parrainage.
3. **Club Trust Wheels** — abonnement : pneus, chambres à air, goodies (fidélité).

Michelin Trust Wheels crée **le moteur d'achat** (utilité + preuve + renvoi traçable), pas la transaction.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind (charte Michelin) · NestJS · Expo Go · Strava OAuth *(à venir)* · PostgreSQL + Prisma *(à venir)* · Docker · GitHub Actions (CI/CD). **Pas de paiement in-app.**

## Structure du monorepo

```
.
├── api/                     # NestJS — health, tyres/recommend, community
├── web/                     # Next.js 15 — landing, Trouve ton pneu, Communauté, Balades (charte Michelin)
├── mobile/                  # Expo Go — application mobile
├── packages/
│   └── recommender/         # moteur de recommandation (cœur métier, zéro dépendance, testé)
├── prisma/schema.prisma     # modèle de données cible (Postgres) — câblage à l'itération suivante
├── docker-compose.yml       # web + api + mobile + postgres
└── .github/workflows/ci.yml # lint + tests + build
```

## Démarrer (développement)

Prérequis : **Node ≥ 20.19.4**.

```bash
npm install        # installe tous les workspaces
npm test           # tests unitaires (recommender + api)
npm run build      # build api (tsc) + web (next build)

# en dev, dans 3 terminaux :
npm run dev:api    # API NestJS  ->  http://localhost:3001/api
npm run dev:web    # Front Next  ->  http://localhost:3000
npm run dev:mobile # Expo Go    ->  QR code dans le terminal
```

Au besoin : `cp .env.example .env`.

### Authentification Supabase

Le web et le mobile utilisent Supabase Auth avec :

- Strava en connexion mise en avant (`custom:strava`)
- Google (`google`)
- Garmin (`custom:garmin`)
- Email via magic link

Google et email sont supportes nativement par Supabase. Strava et Garmin doivent etre
crees dans Supabase Dashboard comme Custom OAuth/OIDC Providers avec les identifiants
`custom:strava` et `custom:garmin`.

Pour que Strava fonctionne sur mobile Expo Go, Supabase redirige vers le callback
web, qui renvoie ensuite vers l'app mobile (`mtw://` ou `exp://`) :

- `SUPABASE_SERVICE_ROLE_KEY` est obligatoire cote API pour synchroniser `public.riders`.
- Executer `supabase/riders.sql` dans Supabase SQL Editor.
- Dans le provider Supabase `custom:strava`, configurer l'attribute mapping :
  `sub -> id`, `name -> username`, `given_name -> firstname`,
  `family_name -> lastname`, `picture -> profile`.
- Dans Supabase Auth > URL Configuration > Redirect URLs, ajouter
  `http://localhost:3000/auth/callback`. Sur Android Emulator, ajouter aussi
  `http://10.0.2.2:3000/auth/callback`. Sur telephone physique, ajouter
  `http://<IP_LAN>:3000/auth/callback`. Utiliser `.../auth/callback**` si votre
  projet Supabase exige une wildcard pour les query params.
- Sur Android Emulator, remplacer `localhost` par `10.0.2.2` dans
  `EXPO_PUBLIC_API_URL` et `EXPO_PUBLIC_WEB_AUTH_CALLBACK_URL`. Sur iOS Simulator,
  `localhost` fonctionne generalement.

### Endpoints API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Statut du service |
| GET | `/api/tyres/options` | Disciplines & priorités (alimente le wizard) |
| GET | `/api/tyres?discipline=road&limit=12` | Catalogue filtré |
| GET | `/api/tyres/recommend?discipline=gravel&priority=puncture&ebike=true&limit=5` | Recommandation scorée + justifications |
| GET | `/api/community/stats` | Compteurs collectifs (preuve sociale) |
| GET | `/api/community/reviews?tyre=power%20cup` | Avis vérifiés (adossés aux km Strava) |
| GET | `/api/community/pros` | Pneus des pros |
| GET | `/api/auth/me` | Vérifie le JWT Supabase envoyé en `Authorization: Bearer ...` |
| POST | `/api/auth/sync` | Cree/met a jour le profil `public.riders` depuis la session Supabase |

## Docker

```bash
docker compose up --build   # db (postgres) + api + web + mobile Expo
```

Pour scanner le QR Expo Go depuis un téléphone physique avec Docker, renseigner
`REACT_NATIVE_PACKAGER_HOSTNAME` dans `.env` avec l'adresse IP locale de la machine
avant de lancer Compose.

## Données & confidentialité

Le moteur tourne sur `packages/recommender/data/products.sample.json` (échantillon **anonymisé**, versionné). Le **catalogue réel** Michelin est confidentiel : il n'est **jamais commité** (`.gitignore`) et peut être branché en local via la variable `CATALOG_PATH`.

## Maquettes (Figma)

**[Michelin Trust Wheels — Maquettes app](https://www.figma.com/design/daN2uwneqR5ci6PG7YA6AZ)**

## Équipe

Jérémy POULAIN · Axel ROUQUETTE · Hugo RIVAUX · Léo LIMOUSIN
