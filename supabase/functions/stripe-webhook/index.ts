// Webhook Stripe : unique source de synchronisation de l'état d'abonnement.
// Vérifie la signature, puis reflète l'état Stripe dans la table `subscription`
// via le client admin (service_role). Doit être déployé avec --no-verify-jwt
// (Stripe appelle cet endpoint sans JWT Supabase).
import Stripe from 'npm:stripe@17'
import { stripe, supabaseAdmin } from '../_shared/clients.ts'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, secret, undefined, cryptoProvider)
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${e instanceof Error ? e.message : e}`, {
      status: 400,
    })
  }

  const admin = supabaseAdmin()

  // Reflète une Subscription Stripe dans notre table.
  async function syncFromSubscription(subscription: Stripe.Subscription) {
    const item = subscription.items.data[0]
    const priceId = item?.price?.id ?? null

    let planSlug: string | null = null
    if (priceId) {
      const { data: plan } = await admin
        .from('membership_plan')
        .select('slug')
        .eq('stripe_price_id', priceId)
        .maybeSingle()
      planSlug = plan?.slug ?? null
    }

    // `current_period_end` est au niveau subscription (anciennes versions API)
    // ou au niveau item (versions récentes) : on gère les deux.
    const periodEndUnix =
      (subscription as { current_period_end?: number }).current_period_end ??
      (item as { current_period_end?: number } | undefined)?.current_period_end ??
      null

    await admin
      .from('subscription')
      .update({
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan_slug: planSlug,
        current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', subscription.customer as string)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await syncFromSubscription(subscription)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncFromSubscription(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await admin
          .from('subscription')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', invoice.customer as string)
        break
      }
    }
  } catch (e) {
    return new Response(`Handler error: ${e instanceof Error ? e.message : e}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
