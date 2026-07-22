import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export interface JauntPhoto {
  id: string
  photo_url: string
  mission_title: string
  sequence_order: number
  nickname: string
}

/**
 * Carnet de la jaunt : toutes les preuves photo du groupe, dans l'ordre des
 * étapes. La policy RLS de mission_completion autorise chaque membre à voir
 * les complétions de sa jaunt → on récupère bien les photos de tout le groupe.
 */
export function useJauntPhotos(jauntId: string) {
  const photos = ref<JauntPhoto[]>([])
  const loading = ref(false)

  async function fetchPhotos() {
    loading.value = true
    const { data } = await supabase
      .from('mission_completion')
      .select('id, photo_url, mission:mission_id(title, sequence_order), profile:profile_id(nickname)')
      .eq('jaunt_id', jauntId)
      .not('photo_url', 'is', null)
    loading.value = false

    const rows = (data ?? []) as unknown as {
      id: string
      photo_url: string
      mission: { title: string; sequence_order: number } | null
      profile: { nickname: string } | null
    }[]

    photos.value = rows
      .map((r) => ({
        id: r.id,
        photo_url: r.photo_url,
        mission_title: r.mission?.title ?? '',
        sequence_order: r.mission?.sequence_order ?? 0,
        nickname: r.profile?.nickname ?? '',
      }))
      .sort((a, b) => a.sequence_order - b.sequence_order)
  }

  return { photos, loading, fetchPhotos }
}
