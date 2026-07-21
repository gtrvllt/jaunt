// Crée une session Stripe Billing Portal : l'user y change de formule,
// annule, ou met à jour sa carte. Stripe gère toute la mécanique.
import { corsHeaders, json } from '../_shared/http.ts'
import { stripe, supabaseAdmin, supabaseForUser } from '../_shared/clients.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const { data: { user }, error: uErr } = await supabaseForUser(authHeader).auth.getUser()
    if (uErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: sub } = await supabaseAdmin()
      .from('subscription')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!sub?.stripe_customer_id) return json({ error: 'No Stripe customer for this member' }, 400)

    const appUrl = Deno.env.get('APP_URL') ?? req.headers.get('origin') ?? ''
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${appUrl}/profile`,
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
