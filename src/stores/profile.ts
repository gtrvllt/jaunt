import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { useAuthStore } from './auth'

type Interest = Database['public']['Tables']['interest']['Row']
type ProfileInterest = Database['public']['Tables']['profile_interest']['Row']

export const useProfileStore = defineStore('profile', () => {
  const interests = ref<Interest[]>([])
  const selectedInterestIds = ref<string[]>([])
  const hasCompletedOnboarding = ref<boolean | null>(null) // null = pas encore vérifié
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAllInterests() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase.from('interest').select('*').order('name')
    if (err) { error.value = err.message; loading.value = false; return }
    interests.value = data ?? []
    loading.value = false
  }

  async function checkOnboarding(profileId: string): Promise<boolean> {
    if (hasCompletedOnboarding.value !== null) return hasCompletedOnboarding.value
    const { count } = await supabase
      .from('profile_interest')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
    hasCompletedOnboarding.value = (count ?? 0) > 0
    return hasCompletedOnboarding.value
  }

  async function fetchSelectedInterests(profileId: string) {
    const { data } = await supabase
      .from('profile_interest')
      .select('interest_id')
      .eq('profile_id', profileId)
    selectedInterestIds.value = (data ?? []).map((r: Pick<ProfileInterest, 'interest_id'>) => r.interest_id)
  }

  async function saveInterests(profileId: string, interestIds: string[]) {
    loading.value = true
    error.value = null

    // Remplace tous les intérêts existants
    const { error: delErr } = await supabase
      .from('profile_interest')
      .delete()
      .eq('profile_id', profileId)
    if (delErr) { error.value = delErr.message; loading.value = false; return }

    if (interestIds.length > 0) {
      const rows = interestIds.map((interest_id) => ({ profile_id: profileId, interest_id }))
      const { error: insErr } = await supabase.from('profile_interest').insert(rows)
      if (insErr) { error.value = insErr.message; loading.value = false; return }
    }

    selectedInterestIds.value = interestIds
    hasCompletedOnboarding.value = interestIds.length > 0
    loading.value = false
  }

  async function updateProfile(updates: Database['public']['Tables']['profile']['Update']) {
    const auth = useAuthStore()
    if (!auth.session) return
    loading.value = true
    error.value = null
    const { error: err } = await supabase
      .from('profile')
      .update(updates)
      .eq('id', auth.session.user.id)
    if (err) { error.value = err.message } else { await auth.fetchProfile(auth.session.user.id) }
    loading.value = false
  }

  const interestCount = computed(() => selectedInterestIds.value.length)

  return {
    interests,
    selectedInterestIds,
    hasCompletedOnboarding,
    interestCount,
    loading,
    error,
    checkOnboarding,
    fetchAllInterests,
    fetchSelectedInterests,
    saveInterests,
    updateProfile,
  }
})
