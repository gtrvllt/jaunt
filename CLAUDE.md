# CLAUDE.md — Jaunt

## Contexte du projet

Voir [README.md](./README.md) pour la description complète du produit.

Jaunt est une app mobile-first d'exploration urbaine gamifiée : matching éphémère de 4 utilisateurs, quêtes géolocalisées, XP et reviews. POC ciblé sur des marches découverte à Paris.

---

## Stack technique

| Couche | Techno |
|---|---|
| Frontend | Vue 3 (Composition API) + TypeScript |
| State | Pinia |
| Routing | Vue Router |
| Backend / BDD | Supabase (Postgres + Auth + Realtime + Storage) |
| Edge functions | Supabase Edge Functions (Deno) |
| Déploiement | Vercel |

---

## Règles générales

- Ne jamais modifier plusieurs systèmes à la fois : un changement de schéma BDD = un PR dédié, un changement UI = un PR dédié
- Pas de `any` TypeScript — `strict: true` dans `tsconfig.json`
- Pas de `console.log` dans le code livré (ESLint règle `no-console`)
- Pas de logique métier dans les composants Vue — dans des composables (`use*.ts`)
- Chaque route = un seul composant dans `src/views/`, pas de logique inline dans le router
- Tout écran affichant de la donnée async doit gérer les états : chargement, vide, erreur

---

## Vue.js

- **Composition API uniquement** — pas d'Options API
- **Pinia** pour tout state partagé entre composants — pas de `provide/inject` ou store maison
- Les composables sont dans `src/composables/` et préfixés `use` (ex: `useJaunt.ts`)
- Props typées explicitement, jamais de `defineProps<any>()`
- Éviter les watchers profonds (`deep: true`) — préférer des computed ou des actions Pinia

---

## Supabase

- **RLS activé sur toutes les tables sans exception** dès leur création
- Les types sont générés via `supabase gen types typescript` — ne jamais les écrire à la main
- Toute logique métier sensible (matching, calcul XP, validation de quête) vit dans des **Edge Functions**, pas côté client
- Le client Supabase est instancié une seule fois dans `src/lib/supabase.ts`
- Seule la clé `anon` publique est exposée côté client — jamais la `service_role`
- Les migrations SQL sont versionnées dans `supabase/migrations/` et commitées

---

## Vercel

- Variables d'environnement gérées **exclusivement via le dashboard Vercel** — jamais hardcodées dans le code
- Le fichier `.env.local` est dans `.gitignore` et ne contient que des valeurs de développement local
- Les **Preview Deployments** sont activés : chaque PR génère une URL de preview à valider avant merge
- Pas de merge sur `main` sans que la preview ait été testée

---

## Sécurité & supply chain

- **Aucun paquet npm installé s'il a été publié il y a moins de 7 jours** — vérifier la date sur npmjs.com avant tout `npm install`
- Le lockfile (`package-lock.json` ou `pnpm-lock.yaml`) est toujours commité et jamais dans `.gitignore`
- Lancer `npm audit` avant chaque ajout de dépendance
- Ne jamais commiter de secrets, clés API ou tokens — utiliser `.env.local` localement et les variables Vercel en prod
- Pas de dépendances inutiles : préférer du code natif ou des APIs browser/Supabase déjà disponibles

---

## Git & workflow

- Branches nommées `feat/`, `fix/`, `chore/` selon la nature du changement
- Messages de commit en anglais, format conventionnel : `feat: add quest geolocation validator`
- Un PR = une fonctionnalité ou un fix — pas de PR fourre-tout
- Pas de merge sans review (même en solo : relire la diff avant de merger)
