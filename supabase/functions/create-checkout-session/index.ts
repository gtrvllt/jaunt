// Crée une session Stripe Checkout pour souscrire à une formule.
// Appelé par le client authentifié depuis MembershipView.
import { corsHeaders, json } from '../_shared/http.ts'
import { stripe, supabaseAdmin, supabaseForUser } from '../_shared/clients.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const { data: { user }, error: uErr } = await supabaseForUser(authHeader).auth.getUser()
    if (uErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { plan_slug } = await req.json().catch(() => ({}))
    if (!plan_slug) return json({ error: 'plan_slug required' }, 400)

    const admin = supabaseAdmin()

    // Price Stripe rattaché à la formule.
    const { data: plan } = await admin
      .from('membership_plan')
      .select('stripe_price_id')
      .eq('slug', plan_slug)
      .single()
    if (!plan?.stripe_price_id) return json({ error: 'Unknown plan or missing Stripe price' }, 400)

    // Récupère (ou crée) le customer Stripe du membre.
    const { data: sub } = await admin
      .from('subscription')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { profile_id: user.id },
      })
      customerId = customer.id
      await admin
        .from('subscription')
        .upsert({ profile_id: user.id, stripe_customer_id: customerId }, { onConflict: 'profile_id' })
    }

    const appUrl = Deno.env.get('APP_URL') ?? req.headers.get('origin') ?? ''
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${appUrl}/profile?checkout=success`,
      cancel_url: `${appUrl}/membership?checkout=cancel`,
      client_reference_id: user.id,
      metadata: { profile_id: user.id, plan_slug },
    })

    return json({ url: session.url })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
