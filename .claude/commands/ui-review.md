# UI Review — Cohérence UI/UX

Vérifie la cohérence visuelle et fonctionnelle des composants Vue modifiés ou créés.

## Quand l'utiliser

Avant d'ouvrir une PR contenant des changements de composants ou de vues.

## Étapes

1. **Identifier les fichiers UI modifiés**
   ```bash
   git diff main...HEAD --name-only -- 'src/components/**' 'src/views/**'
   ```

2. **Lire chaque fichier modifié** et analyser sur ces axes :

   **États async obligatoires**
   Tout composant affichant de la donnée Supabase doit gérer les 3 états :
   - `loading` → skeleton ou spinner visible
   - `error` → message d'erreur lisible par l'utilisateur (pas le message d'erreur technique)
   - `empty` → état vide explicite (pas un composant vide silencieux)

   **Mobile-first**
   - Les layouts sont-ils pensés pour 390px de large en premier ?
   - Pas de largeurs fixes en px sur les éléments principaux
   - Les zones tactiles font au moins 44px de haut

   **Cohérence des patterns**
   - Les composants de liste utilisent-ils la même structure que les autres listes existantes ?
   - Les formulaires ont-ils la même gestion d'erreur (champ par champ, pas juste un message global) ?
   - Les CTA principaux sont-ils cohérents en style et positionnement ?

   **Nomenclature**
   - Les composants sont-ils en PascalCase (`QuestCard.vue`, `ProfileAvatar.vue`) ?
   - Les props sont-elles typées explicitement (pas de `defineProps<any>()`) ?
   - Les événements émis sont-ils préfixés par un verbe (`onValidate`, `onJoin`) ?

   **Accessibilité de base**
   - Les images ont-elles un `alt`?
   - Les boutons sans texte visible ont-ils un `aria-label` ?
   - Les formulaires ont-ils des `<label>` associés ?

3. **Produire un rapport :**
   - ✅ Composants conformes
   - ⚠️ Points à améliorer (non bloquants pour le POC)
   - ❌ Problèmes bloquants (état manquant, layout cassé sur mobile)

4. **Si des ❌ sont détectés**, proposer les corrections et demander confirmation avant d'appliquer.
