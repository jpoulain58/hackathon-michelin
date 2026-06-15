# Michelin Trust Wheels — *La preuve par la route*

> La communauté qui transforme les riders Michelin en **prescripteurs**, et leurs kilomètres en **preuve sociale** que personne ne peut égaler.

**Hackathon ESGI 2026 — Réseau Skolae × Michelin LB 2 Wheels** · 15–20 juin 2026
Product Owner : Abdellatif Ghachi (Global Account Manager E-retail 2W)

---

## Le problème (recadré par le PO)

Cible = le **client final** (le cycliste), pas le retailer. Dans le vélo, **le prescripteur, c'est le pair** : on choisit ses pneus sur la recommandation d'autres cyclistes. Or Michelin est absent de cette couche — quand Michelin a **1 avis, Continental en a 100**. Pas de preuve sociale → pas de considération → pas de ventes.

**On ne veut pas un site e-commerce. On veut créer de l'émulation autour de Michelin.**

## La solution

Une **app mobile** (B2C) en 2 parties + un club :

1. **Trouve ton pneu + Comparateur** — connexion **Strava/Garmin** → sélection perso, et un **comparateur transparent incluant les concurrents**. Bouton « Voir où acheter » = **renvoi revendeur** (pas de checkout).
2. **Communauté & émulation** — compteurs collectifs, **pneus des pros**, **avis vérifiés** (adossés aux vrais km), **balades de la semaine**, statut/parrainage.
3. **Club PROOF** — abonnement : pneus, chambres à air, goodies (fidélité).

Go-to-market : newsletter, mini-série YouTube, influenceurs TikTok/Insta, caravane Tour de France. PROOF crée **le moteur d'achat** (utilité + preuve + renvoi traçable), pas la transaction.

## Maquettes (Figma — source de vérité)

**Fichier Figma : [Michelin PROOF — Maquettes app](https://www.figma.com/design/daN2uwneqR5ci6PG7YA6AZ)** (calques 100 % éditables).
Écrans : Onboarding · **Trouve ton pneu** · **Comparateur** (concurrents inclus) · Communauté & pneus des pros · Balades de la semaine · Club.
_Anciennes maquettes SVG du 1ᵉʳ concept conservées dans [`exports/figma/`](exports/figma/) à titre d'archive._

## Stack cible (voir [architecture](docs/03-architecture.md))

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Prisma · NestJS (API) · Strava OAuth · Docker · GitHub Actions (CI/CD) · Vitest + Playwright. **Pas de paiement.**

## Équipe

> _Jérémy POULAIN / Axel ROUQUETTE / Hugo RIVAUX / Léo LIMOUSIN_

---

**Confidentialité** : catalogue, charte et dealer book Michelin sont confidentiels → non versionnés en clair. Voir [`.gitignore`](.gitignore).
_Nom de dépôt historique `michelin-grip` ; produit renommé **Michelin PROOF** (le dossier peut être renommé `michelin-proof`)._
