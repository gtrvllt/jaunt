import { ref, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'

interface ClubStats {
  active_members: number
  matches_today: number
  total_jaunts_completed: number
}

export function useSocialProof() {
  const stats = ref<ClubStats | null>(null)
  const loading = ref(false)

  async function fetchStats() {
    loading.value = true
    const { data } = await supabase.rpc('get_club_stats')
    if (data) stats.value = data as unknown as ClubStats
    loading.value = false
  }

  const channel = supabase
    .channel('club-stats')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participation' }, fetchStats)
    .subscribe()

  onUnmounted(() => { supabase.removeChannel(channel) })

  return { stats, loading, fetchStats }
}
