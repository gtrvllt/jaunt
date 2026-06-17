# Test Coverage — Couverture de tests sur les fonctions métier

Génère des tests Vitest pour chaque nouvelle fonction métier identifiée dans le diff.

## Quand l'utiliser

Après avoir écrit ou modifié un composable, une Edge Function, ou une fonction utilitaire métier.

## Étapes

1. **Identifier les fonctions métier à tester**
   ```bash
   git diff main...HEAD -- 'src/composables/**' 'src/stores/**' 'src/utils/**' 'supabase/functions/**'
   ```
   Ne pas tester : composants Vue, fichiers de config, types, assets.

2. **Pour chaque fonction identifiée, vérifier si un test existe déjà**
   ```bash
   find src -name '*.test.ts' -o -name '*.spec.ts'
   ```

3. **Générer les tests manquants** dans `src/__tests__/` avec cette structure :
   ```ts
   import { describe, it, expect, vi, beforeEach } from 'vitest'

   describe('<nom de la fonction>', () => {
     it('<comportement attendu>', () => {
       // arrange
       // act
       // assert
     })
   })
   ```

   Priorités de test par ordre décroissant :
   - Algorithme de matching (logique de groupe de 4)
   - Calcul et attribution de XP
   - Validation de quête (proximité GPS)
   - Transitions de statut (`jaunt_status`, `participation_status`)
   - Guards d'authentification

4. **Règles pour les tests Jaunt**
   - Mocker `supabase` avec `vi.mock('@/lib/supabase')`
   - Ne pas faire d'appels réseau réels dans les tests unitaires
   - Tester les cas limites : groupe incomplet (< 4), quête déjà validée, utilisateur non authentifié

5. **Lancer les tests**
   ```bash
   npm run test
   ```
   Si la commande n'existe pas encore, l'ajouter dans `package.json` :
   ```json
   "test": "vitest run",
   "test:watch": "vitest"
   ```
   Et installer Vitest si nécessaire (vérifier la date de publication avant).

6. **Reporter** : nombre de fonctions testées, couverture estimée, cas limites manquants identifiés.
