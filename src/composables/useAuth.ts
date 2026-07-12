import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useTrack } from '@/composables/useTrack'

export function useAuth() {
  const router = useRouter()
  const auth = useAuthStore()
  const { track } = useTrack()
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function sendMagicLink(email: string): Promise<boolean> {
    loading.value = true
    error.value = null
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    loading.value = false
    if (err) { error.value = err.message; return false }
    await track('auth_completed', { method: 'magic_link' })
    return true
  }

  async function signInWithGoogle() {
    loading.value = true
    error.value = null
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    loading.value = false
    if (err) { error.value = err.message; return }
    await track('auth_completed', { method: 'google' })
  }

  async function signOut() {
    await auth.signOut()
    router.push({ name: 'auth' })
  }

  return { loading, error, sendMagicLink, signInWithGoogle, signOut }
}
