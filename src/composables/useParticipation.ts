import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useTrack } from '@/composables/useTrack'
import type { Database } from '@/types/supabase'

type Quest = Database['public']['Tables']['quest']['Row']
type Participation = Database['public']['Tables']['participation']['Row']
type Jaunt = Database['public']['Tables']['jaunt']['Row']
type JauntTheme = Database['public']['Tables']['jaunt_theme']['Row']

export type FullParticipation = Participation & {
  jaunt: Jaunt & {
    jaunt_theme: JauntTheme
    quests: Quest[]
  }
}

export function useParticipation(jauntId: string) {
  const router = useRouter()
  const auth = useAuthStore()
  const { track } = useTrack()

  const participation = ref<FullParticipation | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const validating = ref(false)

  async function fetch() {
    if (!auth.session) return
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('participation')
      .select(`
        *,
        jaunt:jaunt_id (
          *,
          jaunt_theme:theme_id (*),
          quests:quest!theme_id (*)
        )
      `)
      .eq('profile_id', auth.session.user.id)
      .eq('jaunt_id', jauntId)
      .single()

    loading.value = false
    if (err) { error.value = err.message; return }

    // Cast nécessaire : le join quest!theme_id n'est pas inféré par les types générés
    const full = data as unknown as FullParticipation

    // Tri des quêtes par sequence_order
    if (full?.jaunt?.quests) {
      full.jaunt.quests.sort((a, b) => a.sequence_order - b.sequence_order)
    }
    participation.value = full
  }

  async function startJaunt() {
    if (!auth.session || !participation.value) return
    validating.value = true
    error.value = null

    const { error: err } = await supabase
      .from('participation')
      .update({ status: 'active', arrived_at: new Date().toISOString() })
      .eq('id', participation.value.id)

    validating.value = false
    if (err) { error.value = err.message; return }

    await track('jaunt_joined', { jaunt_id: jauntId })
    router.push({ name: 'jaunt-live', params: { id: jauntId } })
  }

  async function validateStep(coords: { lat: number; lng: number }) {
    if (!participation.value || !auth.session) return
    validating.value = true
    error.value = null

    // Logique GPS déléguée à l'Edge Function (sécurité côté serveur)
    const { data, error: err } = await supabase.functions.invoke('validate-quest', {
      body: {
        participation_id: participation.value.id,
        lat: coords.lat,
        lng: coords.lng,
      },
    })

    validating.value = false
    if (err) { error.value = err.message; return }

    if (data?.completed) {
      await track('jaunt_completed', { jaunt_id: jauntId })
      router.push({ name: 'jaunt-recap', params: { id: jauntId } })
    } else {
      await track('quest_validated', { jaunt_id: jauntId })
      await fetch() // rafraîchir l'index de quête
    }
  }

  return { participation, loading, error, validating, fetch, startJaunt, validateStep }
}
