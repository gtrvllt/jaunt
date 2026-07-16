import { ref, computed, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Database } from '@/types/supabase'

type Mission = Database['public']['Tables']['mission']['Row']
type MissionCompletion = Database['public']['Tables']['mission_completion']['Row']

export interface MissionWithStatus extends Mission {
  completed: boolean
  photo_url: string | null
  groupCount: number
}

const cacheKey = (jauntId: string, profileId: string) => `jaunt:missions:${jauntId}:${profileId}`

export function useMissions(jauntId: string) {
  const auth = useAuthStore()

  const missions = ref<Mission[]>([])
  const completions = ref<MissionCompletion[]>([])
  const participantCount = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const busyMissionId = ref<string | null>(null)

  const myId = computed(() => auth.session?.user.id ?? null)

  // Missions enrichies du statut perso + du décompte groupe.
  const missionsWithStatus = computed<MissionWithStatus[]>(() =>
    missions.value.map((m) => {
      const forMission = completions.value.filter((c) => c.mission_id === m.id)
      const mine = forMission.find((c) => c.profile_id === myId.value)
      return {
        ...m,
        completed: !!mine,
        photo_url: mine?.photo_url ?? null,
        groupCount: forMission.length,
      }
    }),
  )

  const doneCount = computed(() => missionsWithStatus.value.filter((m) => m.completed).length)

  // Progression collective : complétions / (missions × participants).
  const groupProgress = computed(() => {
    const total = missions.value.length * Math.max(participantCount.value, 1)
    if (total === 0) return 0
    return Math.min(completions.value.length / total, 1)
  })

  // --- Cache local (résilience offline) -------------------------------------
  function persistCache() {
    if (!myId.value) return
    try {
      localStorage.setItem(cacheKey(jauntId, myId.value), JSON.stringify(completions.value))
    } catch {
      /* quota / mode privé : on ignore silencieusement */
    }
  }

  function hydrateFromCache() {
    if (!myId.value) return
    try {
      const raw = localStorage.getItem(cacheKey(jauntId, myId.value))
      if (raw) completions.value = JSON.parse(raw) as MissionCompletion[]
    } catch {
      /* cache illisible : on ignore */
    }
  }

  // --- Chargement ------------------------------------------------------------
  async function fetchAll() {
    if (!auth.session) return
    loading.value = true
    error.value = null

    // Affichage instantané depuis le cache, puis rafraîchissement réseau.
    hydrateFromCache()

    const { data: jaunt, error: jErr } = await supabase
      .from('jaunt')
      .select('theme_id')
      .eq('id', jauntId)
      .single()

    if (jErr) { error.value = jErr.message; loading.value = false; return }

    const [missionRes, completionRes, countRes] = await Promise.all([
      supabase.from('mission').select('*').eq('theme_id', jaunt.theme_id).order('sequence_order'),
      supabase.from('mission_completion').select('*').eq('jaunt_id', jauntId),
      supabase.rpc('get_jaunt_participant_count', { jaunt_id: jauntId }),
    ])

    loading.value = false
    if (missionRes.error) { error.value = missionRes.error.message; return }
    if (completionRes.error) { error.value = completionRes.error.message; return }

    missions.value = missionRes.data ?? []
    completions.value = completionRes.data ?? []
    if (countRes.data != null) participantCount.value = Math.max(countRes.data as number, 1)
    persistCache()
  }

  // --- Actions ---------------------------------------------------------------
  async function toggle(mission: MissionWithStatus) {
    if (!myId.value) return
    busyMissionId.value = mission.id
    error.value = null

    if (mission.completed) {
      const { error: err } = await supabase
        .from('mission_completion')
        .delete()
        .eq('mission_id', mission.id)
        .eq('jaunt_id', jauntId)
        .eq('profile_id', myId.value)
      if (!err) completions.value = completions.value.filter(
        (c) => !(c.mission_id === mission.id && c.profile_id === myId.value),
      )
      else error.value = err.message
    } else {
      const { data, error: err } = await supabase
        .from('mission_completion')
        .insert({ mission_id: mission.id, jaunt_id: jauntId, profile_id: myId.value })
        .select()
        .single()
      if (!err && data) completions.value = [...completions.value, data]
      else if (err) error.value = err.message
    }

    busyMissionId.value = null
    persistCache()
  }

  async function uploadPhoto(mission: MissionWithStatus, file: File) {
    if (!myId.value) return
    busyMissionId.value = mission.id
    error.value = null

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${myId.value}/${jauntId}/${mission.id}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('mission-photos')
      .upload(path, file, { upsert: true })

    if (upErr) { error.value = upErr.message; busyMissionId.value = null; return }

    const { data: pub } = supabase.storage.from('mission-photos').getPublicUrl(path)
    const photoUrl = `${pub.publicUrl}?t=${Date.now()}`

    // Upsert la complétion avec la preuve photo.
    const { data, error: err } = await supabase
      .from('mission_completion')
      .upsert(
        { mission_id: mission.id, jaunt_id: jauntId, profile_id: myId.value, photo_url: photoUrl },
        { onConflict: 'mission_id,jaunt_id,profile_id' },
      )
      .select()
      .single()

    if (err) { error.value = err.message; busyMissionId.value = null; return }

    completions.value = [
      ...completions.value.filter((c) => !(c.mission_id === mission.id && c.profile_id === myId.value)),
      data,
    ]
    busyMissionId.value = null
    persistCache()
  }

  // Clôture la Jaunt pour le membre courant (transition vers le recap).
  async function finish() {
    if (!myId.value) return { error: 'no session' }
    const { error: err } = await supabase
      .from('participation')
      .update({ status: 'completed' })
      .eq('jaunt_id', jauntId)
      .eq('profile_id', myId.value)
    return { error: err?.message ?? null }
  }

  // --- Realtime groupe -------------------------------------------------------
  function subscribe() {
    const channel = supabase
      .channel(`jaunt-missions-${jauntId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mission_completion', filter: `jaunt_id=eq.${jauntId}` },
        () => { fetchAll() },
      )
      .subscribe()
    onUnmounted(() => { supabase.removeChannel(channel) })
  }

  return {
    missionsWithStatus,
    doneCount,
    groupProgress,
    participantCount,
    loading,
    error,
    busyMissionId,
    fetchAll,
    toggle,
    uploadPhoto,
    finish,
    subscribe,
  }
}
