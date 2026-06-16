# 🧭 Jaunt — Exploration Urbaine Spontanée

Jaunt est une application mobile-first d'exploration urbaine gamifiée et immersive. Le concept repose sur l'**éphémère et la spontanéité** : pas de système d'amis permanents, uniquement des rencontres réelles immédiates dans la vraie vie.

> **Statut actuel : POC** — les sorties sont des marches découverte à Paris.

---

## Le Concept

### 1. Inscription & Centres d'intérêt
À l'inscription, chaque utilisateur sélectionne des **centres d'intérêt** (`Interest`) qui serviront de base au matching.

### 2. Matching Éphémère
L'algorithme apparie des profils en attente pour former des **groupes exclusifs de 4 participants** partageant les mêmes intérêts.

### 3. La Jaunt (l'aventure)
Le groupe est propulsé dans un **scénario minuté** articulé autour d'un thème spécifique (`JauntTheme`). Pour le POC : marche découverte dans Paris.

### 4. Les Quêtes (le jeu)
Pour réussir leur sortie, les 4 participants doivent **collaborer, se déplacer physiquement** et valider une suite de **3 quêtes géolocalisées** (`Quest`) grâce à des indices textuels et visuels.

### 5. Fidélisation & Confiance
- Les utilisateurs accumulent des **points d'expérience** (`xpPoints`)
- Ils débloquent des **succès** (`Achievement`)
- Ils s'évaluent mutuellement à la fin de chaque aventure (`Review`) pour garantir la sécurité au sein du club

---

## Modèle de données (entités clés)

| Entité | Rôle |
|---|---|
| `User` | Profil utilisateur avec centres d'intérêt et XP |
| `Interest` | Centres d'intérêt communs servant au matching |
| `JauntTheme` | Thème scénaristique d'une aventure |
| `Quest` | Quête géolocalisée avec indices (texte + visuel) |
| `Achievement` | Succès débloquables |
| `Review` | Évaluation entre participants post-aventure |

---

## Stack technique

| Couche | Techno |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite |
| State | Pinia |
| Routing | Vue Router |
| Backend / BDD | Supabase (Postgres + Auth + Realtime + Storage) |
| Edge functions | Supabase Edge Functions (Deno) |
| Déploiement | Vercel |

---

## Développement local

```sh
npm install
npm run dev
```

---

## Évolution prévue

Le POC se concentre sur les **marches découverte à Paris**. À terme, la génération d'activités Jaunt pourra couvrir plusieurs types de sorties urbaines (culture, food, sport…).

---

## Design

Les maquettes sont dans [`design/`](./design/) au format Penpot (`.pen`) avec les assets visuels associés dans [`design/images/`](./design/images/).
