// Génère des profils de test (faux auth users + profiles) pour que l'admin
// puisse assigner 4 participants à une jaunt. Réservé à l'admin.
import { corsHeaders, json } from '../_shared/http.ts'
import { supabaseAdmin, supabaseForUser } from '../_shared/clients.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    // Vérifie que l'appelant est admin.
    const userClient = supabaseForUser(authHeader)
    const { data: { user }, error: uErr } = await userClient.auth.getUser()
    if (uErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: isAdmin } = await userClient.rpc('is_admin')
    if (!isAdmin) return json({ error: 'Forbidden' }, 403)

    const body = await req.json().catch(() => ({}))
    const count = Math.min(Math.max(Number(body.count) || 3, 1), 3)

    const admin = supabaseAdmin()
    const created: { id: string; nickname: string }[] = []

    for (let i = 0; i < count; i++) {
      const suffix = crypto.randomUUID().slice(0, 6)
      const nickname = `Testeur ${suffix}`

      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: `testeur-${suffix}@jaunt.test`,
        password: crypto.randomUUID(),
        email_confirm: true,
      })
      if (createErr || !newUser.user) {
        return json({ error: createErr?.message ?? 'createUser failed' }, 500)
      }

      const { error: profErr } = await admin
        .from('profile')
        .insert({ id: newUser.user.id, nickname })
      if (profErr) return json({ error: profErr.message }, 500)

      created.push({ id: newUser.user.id, nickname })
    }

    return json({ created })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
