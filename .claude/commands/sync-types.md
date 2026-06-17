# Sync Supabase TypeScript types

Regenerate `src/types/supabase.ts` from the current Supabase schema and verify the project still compiles.

## Steps

1. Call the Supabase MCP tool `generate_typescript_types` with project_id `yigfkbrwzagwfabszbtm`.

2. Overwrite `src/types/supabase.ts` with the generated output. Keep only the types relevant to the `public` schema — strip PostGIS internal functions to keep the file readable. Always expose the `Tables` and `Enums` convenience helpers at the bottom:
```ts
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
```

3. Run `npm run type-check` to verify nothing is broken.

4. If type errors appear, report them — do not attempt auto-fixes that change the schema.

5. Commit:
```
git add src/types/supabase.ts
git commit -m "chore: sync Supabase TypeScript types"
```
