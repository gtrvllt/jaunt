import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Database } from '@/types/supabase'

type JauntTheme = Database['public']['Tables']['jaunt_theme']['Row']

export interface ThemePayload {
  title: string
  description: string
  difficulty: number
  image_url: string
  meeting_address: string
  meeting_lat: number | null
  meeting_lng: number | null
  meeting_landmark_url: string
}

export interface MissionDraft {
  title: string
  description: string
  kind: 'photo' | 'icebreaker' | 'challenge'
  solution: string
}

export interface ThemeWithCount extends JauntTheme {
  mission_count: number
}

export function useAdminJaunt() {
  const auth = useAuthStore()

  const themes = ref<ThemeWithCount[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchThemes() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('jaunt_theme')
      .select('*, mission(count)')
      .order('created_at', { ascending: false })
    loading.value = false
    if (err) { error.value = err.message; return }
    themes.value = (data ?? []).map((t) => {
      const { mission, ...theme } = t as JauntTheme & { mission: { count: number }[] }
      return { ...theme, mission_count: mission?.[0]?.count ?? 0 }
    })
  }

  // Crée un thème + ses missions. Retourne l'id du thème, ou null en cas d'erreur.
  async function createThemeWithMissions(
    theme: ThemePayload,
    missions: MissionDraft[],
  ): Promise<string | null> {
    saving.value = true
    error.value = null

    const { data: themeRow, error: themeErr } = await supabase
      .from('jaunt_theme')
      .insert({
        title: theme.title,
        description: theme.description || null,
        difficulty: theme.difficulty,
        image_url: theme.image_url || null,
        meeting_address: theme.meeting_address || null,
        meeting_lat: theme.meeting_lat,
        meeting_lng: theme.meeting_lng,
        meeting_landmark_url: theme.meeting_landmark_url || null,
      })
      .select()
      .single()

    if (themeErr || !themeRow) {
      saving.value = false
      error.value = themeErr?.message ?? 'Création du thème impossible.'
      return null
    }

    if (missions.length > 0) {
      const rows = missions.map((m, i) => ({
        theme_id: themeRow.id,
        title: m.title,
        description: m.description || null,
        kind: m.kind,
        sequence_order: i + 1,
        solution: m.solution || null,
      }))
      const { error: missErr } = await supabase.from('mission').insert(rows)
      if (missErr) {
        saving.value = false
        error.value = missErr.message
        return null
      }
    }

    saving.value = false
    return themeRow.id
  }

  // Crée une instance jouable + une participation admin. Retourne l'id de la jaunt.
  async function spawnTestJaunt(themeId: string): Promise<string | null> {
    if (!auth.session) return null
    saving.value = true
    error.value = null

    const { data: jauntRow, error: jauntErr } = await supabase
      .from('jaunt')
      .insert({
        theme_id: themeId,
        status: 'pending',
        scheduled_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (jauntErr || !jauntRow) {
      saving.value = false
      error.value = jauntErr?.message ?? 'Création de la jaunt impossible.'
      return null
    }

    const { error: partErr } = await supabase.from('participation').insert({
      jaunt_id: jauntRow.id,
      profile_id: auth.session.user.id,
      status: 'waiting',
    })

    saving.value = false
    if (partErr) { error.value = partErr.message; return null }
    return jauntRow.id
  }

  return { themes, loading, saving, error, fetchThemes, createThemeWithMissions, spawnTestJaunt }
}
