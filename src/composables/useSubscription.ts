import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscription']['Row']

const ACTIVE_STATUSES = ['active', 'trialing']

export function useSubscription() {
  const auth = useAuthStore()

  const subscription = ref<Subscription | null>(null)
  const loading = ref(false)
  const redirecting = ref(false)
  const error = ref<string | null>(null)

  const isActive = computed(() => ACTIVE_STATUSES.includes(subscription.value?.status ?? ''))
  const currentPlan = computed(() => (isActive.value ? subscription.value?.plan_slug ?? null : null))

  async function fetchSubscription() {
    if (!auth.session) return
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('subscription')
      .select('*')
      .eq('profile_id', auth.session.user.id)
      .maybeSingle()
    loading.value = false
    if (err) { error.value = err.message; return }
    subscription.value = data
  }

  // Ouvre Stripe Checkout pour souscrire à une formule.
  async function startCheckout(planSlug: string) {
    redirecting.value = true
    error.value = null
    const { data, error: err } = await supabase.functions.invoke('create-checkout-session', {
      body: { plan_slug: planSlug },
    })
    if (err || !data?.url) {
      redirecting.value = false
      error.value = err?.message ?? data?.error ?? 'Impossible de démarrer le paiement.'
      return
    }
    window.location.href = data.url as string
  }

  // Ouvre le Billing Portal Stripe (changer de formule, annuler, carte).
  async function openPortal() {
    redirecting.value = true
    error.value = null
    const { data, error: err } = await supabase.functions.invoke('create-portal-session', {})
    if (err || !data?.url) {
      redirecting.value = false
      error.value = err?.message ?? data?.error ?? 'Impossible d’ouvrir la gestion d’abonnement.'
      return
    }
    window.location.href = data.url as string
  }

  return {
    subscription,
    loading,
    redirecting,
    error,
    isActive,
    currentPlan,
    fetchSubscription,
    startCheckout,
    openPortal,
  }
}
