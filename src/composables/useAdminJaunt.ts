import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Database } from '@/types/supabase'

type JauntTheme = Database['public']['Tables']['jaunt_theme']['Row']
type Profile = Database['public']['Tables']['profile']['Row']

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
  id?: string
  title: string
  description: string
  kind: 'photo' | 'icebreaker' | 'challenge'
  solution: string
  location_address: string
  location_lat: string
  location_lng: string
}

export interface ThemeWithCount extends JauntTheme {
  mission_count: number
}

export type AssignableProfile = Pick<Profile, 'id' | 'nickname' | 'avatar_url'>

function themeToInsert(t: ThemePayload) {
  return {
    title: t.title,
    description: t.description || null,
    difficulty: t.difficulty,
    image_url: t.image_url || null,
    meeting_address: t.meeting_address || null,
    meeting_lat: t.meeting_lat,
    meeting_lng: t.meeting_lng,
    meeting_landmark_url: t.meeting_landmark_url || null,
  }
}

export function useAdminJaunt() {
  const auth = useAuthStore()

  const themes = ref<ThemeWithCount[]>([])
  const profiles = ref<AssignableProfile[]>([])
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

  async function fetchThemeMissions(themeId: string): Promise<MissionDraft[]> {
    const { data } = await supabase
      .from('mission')
      .select('*')
      .eq('theme_id', themeId)
      .order('sequence_order')
    return (data ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? '',
      kind: m.kind as MissionDraft['kind'],
      solution: m.solution ?? '',
      location_address: m.location_address ?? '',
      location_lat: m.location_lat != null ? String(m.location_lat) : '',
      location_lng: m.location_lng != null ? String(m.location_lng) : '',
    }))
  }

  async function createTheme(payload: ThemePayload): Promise<string | null> {
    const { data, error: err } = await supabase
      .from('jaunt_theme')
      .insert(themeToInsert(payload))
      .select()
      .single()
    if (err) { error.value = err.message; return null }
    return data.id
  }

  async function updateTheme(id: string, payload: ThemePayload): Promise<boolean> {
    const { error: err } = await supabase.from('jaunt_theme').update(themeToInsert(payload)).eq('id', id)
    if (err) { error.value = err.message; return false }
    return true
  }

  // Diff missions : update (id présent), insert (nouvelles), delete (retirées).
  async function saveMissions(themeId: string, missions: MissionDraft[], removedIds: string[]): Promise<boolean> {
    if (removedIds.length > 0) {
      const { error: delErr } = await supabase.from('mission').delete().in('id', removedIds)
      if (delErr) { error.value = delErr.message; return false }
    }
    for (const [i, m] of missions.entries()) {
      const row = {
        theme_id: themeId,
        title: m.title,
        description: m.description || null,
        kind: m.kind,
        sequence_order: i + 1,
        solution: m.solution || null,
        location_address: m.location_address || null,
        location_lat: m.location_lat ? Number(m.location_lat) : null,
        location_lng: m.location_lng ? Number(m.location_lng) : null,
      }
      if (m.id) {
        const { error: upErr } = await supabase.from('mission').update(row).eq('id', m.id)
        if (upErr) { error.value = upErr.message; return false }
      } else {
        const { error: insErr } = await supabase.from('mission').insert(row)
        if (insErr) { error.value = insErr.message; return false }
      }
    }
    return true
  }

  // Enregistre un thème + ses missions (création ou édition).
  async function saveThemeWithMissions(
    themeId: string | null,
    payload: ThemePayload,
    missions: MissionDraft[],
    removedIds: string[],
  ): Promise<boolean> {
    saving.value = true
    error.value = null
    const id = themeId ? (await updateTheme(themeId, payload)) && themeId : await createTheme(payload)
    if (!id) { saving.value = false; return false }
    const ok = await saveMissions(id, missions.filter((m) => m.title.trim()), removedIds)
    saving.value = false
    if (ok) await fetchThemes()
    return ok
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profile').select('id, nickname, avatar_url').order('joined_at')
    profiles.value = data ?? []
  }

  async function createTestProfiles(count = 3): Promise<boolean> {
    saving.value = true
    error.value = null
    const { data, error: err } = await supabase.functions.invoke('admin-create-test-profiles', {
      body: { count },
    })
    saving.value = false
    if (err || data?.error) { error.value = err?.message ?? data?.error; return false }
    await fetchProfiles()
    return true
  }

  async function createJauntInstance(input: {
    themeId: string
    profileIds: string[]
    scheduledAt: string
  }): Promise<string | null> {
    if (!auth.session) return null
    saving.value = true
    error.value = null

    const { data: jauntRow, error: jErr } = await supabase
      .from('jaunt')
      .insert({
        theme_id: input.themeId,
        status: 'pending',
        scheduled_at: input.scheduledAt || null,
      })
      .select()
      .single()
    if (jErr || !jauntRow) { saving.value = false; error.value = jErr?.message ?? 'Erreur'; return null }

    const rows = input.profileIds.map((pid) => ({
      jaunt_id: jauntRow.id,
      profile_id: pid,
      status: 'waiting' as const,
    }))
    const { error: pErr } = await supabase.from('participation').insert(rows)
    saving.value = false
    if (pErr) { error.value = pErr.message; return null }
    return jauntRow.id
  }

  return {
    themes,
    profiles,
    loading,
    saving,
    error,
    fetchThemes,
    fetchThemeMissions,
    saveThemeWithMissions,
    fetchProfiles,
    createTestProfiles,
    createJauntInstance,
  }
}
