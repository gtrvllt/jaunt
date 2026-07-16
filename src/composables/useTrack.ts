import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Json } from '@/types/supabase'

type TrackableEvent =
  | 'auth_completed'
  | 'onboarding_completed'
  | 'jaunt_joined'
  | 'quest_validated'
  | 'jaunt_completed'
  | 'profile_updated'
  | 'password_reset_requested'
  | 'password_reset_completed'

export function useTrack() {
  const auth = useAuthStore()

  async function track(
    name: TrackableEvent,
    properties: Record<string, Json> = {},
  ): Promise<void> {
    if (!auth.session) return
    await supabase.from('event').insert({
      profile_id: auth.session.user.id,
      name,
      properties,
    })
  }

  return { track }
}
