# Create a Vue composable

Scaffold a typed Vue 3 composable for the Jaunt project.

## Steps

1. The composable name is provided in $ARGUMENTS (e.g. `useProfile`). If not provided, ask.

2. Create the file `src/composables/<name>.ts` following these rules:
   - Composition API only — no Options API
   - Import `supabase` from `@/lib/supabase`
   - Import types from `@/types/supabase` using the `Tables` and `Enums` helpers
   - Use `ref` / `computed` from Vue for reactive state
   - Expose three standard refs: `data`, `loading`, `error`
   - No business logic in the template — all logic lives here
   - No `any` types

3. Typical structure:
```ts
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/supabase'

export function use<Name>() {
  const data = ref<Tables<'<table>'> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch<Name>() {
    loading.value = true
    error.value = null
    const { data: result, error: err } = await supabase
      .from('<table>')
      .select('*')
    if (err) error.value = err.message
    else data.value = result
    loading.value = false
  }

  return { data, loading, error, fetch<Name> }
}
```

4. Run `npm run type-check` to verify.
