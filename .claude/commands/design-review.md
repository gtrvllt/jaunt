# Design Review — Revue de conception globale

Analyse la cohérence architecturale et métier des changements récents par rapport aux fondations du projet.

## Contexte

- Produit : voir [README.md](../../README.md)
- Règles : voir [CLAUDE.md](../../CLAUDE.md)
- Stack : Vue 3 + TypeScript + Pinia + Supabase + Vercel

## Étapes

1. **Lire le diff depuis main**
   ```bash
   git diff main...HEAD
   ```
   Si sur main, lire le dernier commit :
   ```bash
   git diff HEAD~1 HEAD
   ```

2. **Analyser la cohérence sur ces 4 axes :**

   **Modèle de données**
   - Les entités manipulées correspondent-elles au schéma BDD (`profile`, `jaunt`, `participation`, `quest`, `review`, etc.) ?
   - Les types utilisés viennent-ils de `src/types/supabase.ts` ?
   - Y a-t-il des champs inventés côté client qui n'existent pas en BDD ?

   **Architecture**
   - La logique métier est-elle dans des composables (`src/composables/`) et non dans les composants Vue ?
   - Le state partagé passe-t-il par Pinia et non par `provide/inject` ?
   - Chaque route a-t-elle un seul composant dans `src/views/` ?

   **Règles CLAUDE.md**
   - Pas de `any` TypeScript ?
   - Pas de `console.log` ?
   - Les états chargement / vide / erreur sont-ils gérés pour toute donnée async ?

   **Sécurité**
   - La logique sensible (matching, XP, validation de quête) est-elle côté Edge Function et non côté client ?
   - Aucune clé secrète exposée ?

3. **Produire un rapport concis :**
   - ✅ Points conformes
   - ⚠️ Points à surveiller (pas bloquants)
   - ❌ Problèmes à corriger avant push

4. **Si des problèmes ❌ sont détectés**, proposer les corrections et demander confirmation avant de les appliquer.
