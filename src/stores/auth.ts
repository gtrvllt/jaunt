import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profile']['Row']

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profile')
      .select('*')
      .eq('id', userId)
      .single()
    profile.value = data
  }

  async function signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
    profile.value = null
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    if (data.session) await fetchProfile(data.session.user.id)
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      if (newSession) await fetchProfile(newSession.user.id)
      else profile.value = null
    })
  }

  return { session, profile, loading, init, signInWithEmail, signInWithGoogle, signOut, fetchProfile }
})
