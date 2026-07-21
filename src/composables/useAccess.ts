import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export interface MemberAccess {
  has_active_subscription: boolean
  completed_jaunts: number
  can_start_new_jaunt: boolean
}

export function useAccess() {
  const auth = useAuthStore()

  const access = ref<MemberAccess | null>(null)
  const loading = ref(false)

  async function fetchAccess() {
    if (!auth.session) return
    loading.value = true
    const { data } = await supabase.rpc('get_member_access')
    loading.value = false
    if (data) access.value = data as unknown as MemberAccess
  }

  return { access, loading, fetchAccess }
}
