# Create Supabase migration

Create a new SQL migration for the Jaunt project and apply it to Supabase.

## Steps

1. Ask the user to describe the schema change if not already specified in $ARGUMENTS.

2. Generate the migration filename using the format `YYYYMMDDHHMMSS_<snake_case_description>.sql` with today's date and time.

3. Write the SQL file to `supabase/migrations/<filename>.sql`. Follow these rules:
   - Always include `alter table <name> enable row level security;` for any new table
   - Always add RLS policies for every new table
   - Use `snake_case` for all table and column names
   - Use `uuid` primary keys with `gen_random_uuid()` default
   - Add `created_at timestamptz not null default now()` on every table that doesn't have one
   - Never use `drop` or `truncate` without explicit user confirmation
   - Add the migration after all existing tables so foreign key references resolve correctly

4. Apply the migration using the Supabase MCP tool `apply_migration` with project_id `yigfkbrwzagwfabszbtm`.

5. Regenerate TypeScript types by calling the Supabase MCP tool `generate_typescript_types` and update `src/types/supabase.ts`.

6. Run `npm run type-check` to verify nothing is broken.

7. Stage and commit:
   ```
   git add supabase/migrations/<filename>.sql src/types/supabase.ts
   git commit -m "feat: <description of the migration>"
   ```
