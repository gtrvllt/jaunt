import { ref, computed, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Database } from '@/types/supabase'

type Jaunt = Database['public']['Tables']['jaunt']['Row']
type JauntTheme = Database['public']['Tables']['jaunt_theme']['Row']
type Participation = Database['public']['Tables']['participation']['Row']

export type ActiveJaunt = Participation & {
  jaunt: Jaunt & { jaunt_theme: JauntTheme }
}

const TIPS = [
  'Garde les yeux ouverts — les détails cachés font les meilleures quêtes.',
  'Parle aux autres participants, ils ont peut-être des indices.',
  'Pas de GPS pendant la quête — fais confiance à ton instinct.',
  'Les meilleurs spots se méritent : prends ton temps.',
  'Chaque jaunt est unique — documente ce que tu vois.',
]

export function useJaunt() {
  const auth = useAuthStore()
  const activeJaunt = ref<ActiveJaunt | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const tipIndex = ref(Math.floor(Math.random() * TIPS.length))

  const currentTip = computed(() => TIPS[tipIndex.value])

  function nextTip() {
    tipIndex.value = (tipIndex.value + 1) % TIPS.length
  }

  async function fetchActiveJaunt() {
    if (!auth.session) return
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('participation')
      .select(`
        *,
        jaunt:jaunt_id (
          *,
          jaunt_theme:theme_id (*)
        )
      `)
      .eq('profile_id', auth.session.user.id)
      .in('status', ['waiting', 'active'])
      .maybeSingle()

    loading.value = false
    if (err) { error.value = err.message; return }
    activeJaunt.value = data as ActiveJaunt | null
  }

  function subscribeToInvitation() {
    if (!auth.session) return
    const userId = auth.session.user.id
    const channel = supabase
      .channel(`invitation-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participation', filter: `profile_id=eq.${userId}` },
        () => { fetchActiveJaunt() },
      )
      .subscribe()
    onUnmounted(() => { supabase.removeChannel(channel) })
  }

  async function joinQueue() {
    if (!auth.session) return
    const { error: err } = await supabase
      .from('profile')
      .update({ status: 'busy' })
      .eq('id', auth.session.user.id)
    if (err) { error.value = err.message; return }
    if (auth.profile) auth.profile.status = 'busy'
  }

  async function leaveQueue() {
    if (!auth.session) return
    const { error: err } = await supabase
      .from('profile')
      .update({ status: 'idle' })
      .eq('id', auth.session.user.id)
    if (err) { error.value = err.message; return }
    if (auth.profile) auth.profile.status = 'idle'
  }

  return { activeJaunt, loading, error, currentTip, nextTip, fetchActiveJaunt, subscribeToInvitation, joinQueue, leaveQueue }
}
