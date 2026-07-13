import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type MembershipPlan = Database['public']['Tables']['membership_plan']['Row']

export interface PlanFeature {
  label: string
  included: boolean
}

export interface Plan extends Omit<MembershipPlan, 'features'> {
  features: PlanFeature[]
  priceFormatted: string
}

export function useMembership() {
  const plans = ref<Plan[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPlans() {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('membership_plan')
      .select('*')
      .order('sort_order', { ascending: true })

    loading.value = false
    if (err) { error.value = err.message; return }

    plans.value = (data ?? []).map((p) => ({
      ...p,
      features: p.features as unknown as PlanFeature[],
      priceFormatted: `€${(p.price_cents / 100).toFixed(0)}`,
    }))
  }

  return { plans, loading, error, fetchPlans }
}
