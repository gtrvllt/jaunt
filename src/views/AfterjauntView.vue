<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useAccess } from '@/composables/useAccess'
import type { Database } from '@/types/supabase'

type Participation = Database['public']['Tables']['participation']['Row']
type Jaunt = Database['public']['Tables']['jaunt']['Row']
type JauntTheme = Database['public']['Tables']['jaunt_theme']['Row']

type RecapData = Participation & {
  jaunt: Jaunt & { jaunt_theme: JauntTheme }
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const jauntId = route.params.id as string

const recap = ref<RecapData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const { access, fetchAccess } = useAccess()
// Upsell : membre gratuit ayant atteint sa limite (ne peut plus démarrer).
const showUpsell = computed(() => access.value?.can_start_new_jaunt === false)

onMounted(async () => {
  if (!auth.session) return
  fetchAccess()
  loading.value = true
  const { data, error: err } = await supabase
    .from('participation')
    .select('*, jaunt:jaunt_id(*, jaunt_theme:theme_id(*))')
    .eq('profile_id', auth.session.user.id)
    .eq('jaunt_id', jauntId)
    .single()
  loading.value = false
  if (err) { error.value = err.message; return }
  recap.value = data as unknown as RecapData
})

const showFeedbackPrompt = computed(() => {
  if (!recap.value?.jaunt.completed_at) return false
  const ms = Date.now() - new Date(recap.value.jaunt.completed_at).getTime()
  return ms >= 60 * 60 * 1000
})

function duration(p: RecapData) {
  if (!p.arrived_at) return '—'
  const ms = new Date(p.jaunt.completed_at ?? Date.now()).getTime() - new Date(p.arrived_at).getTime()
  const m = Math.floor(ms / 60_000)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m} min`
}
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <span class="appbar-logo">JAUNT</span>
    </header>

    <main v-if="loading" class="content" aria-busy="true" aria-label="Chargement…">
      <div class="skeleton-block" />
      <div class="skeleton-grid">
        <div class="skeleton-photo" v-for="n in 4" :key="n" />
      </div>
    </main>

    <main v-else-if="error" class="content">
      <div class="state-card state-card--error" role="alert"><p>{{ error }}</p></div>
    </main>

    <main v-else-if="!recap" class="content">
      <div class="state-card"><p>Récap introuvable.</p></div>
    </main>

    <main v-else class="content">
      <h1 class="page-title">Afterjaunt</h1>
      <p class="page-sub">Your urban exploration is complete.</p>

      <!-- Grille photos 2×2 -->
      <div class="photo-grid" aria-label="Photos de la jaunt">
        <div v-for="n in 4" :key="n" class="photo-slot">
          <span class="photo-icon" aria-hidden="true">🖼</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-panel" aria-label="Statistiques de la jaunt">
        <div class="stat-row">
          <span class="stat-label">Distance</span>
          <span class="stat-value">—</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Durée</span>
          <span class="stat-value">{{ duration(recap) }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Thème</span>
          <span class="stat-value stat-value--highlight">{{ recap.jaunt.jaunt_theme.title }}</span>
        </div>
      </div>

      <!-- Upsell freemium : limite gratuite atteinte -->
      <div v-if="showUpsell" class="upsell" role="complementary">
        <p class="upsell-title">✨ C'était ta Jaunt gratuite !</p>
        <p class="upsell-sub">Abonne-toi pour repartir à l'aventure et enchaîner les rencontres.</p>
        <button class="btn-upsell" @click="router.push({ name: 'membership' })">
          Découvrir les abonnements
        </button>
      </div>

      <!-- Feedback prompt (1h+ après la fin) -->
      <div v-if="showFeedbackPrompt" class="feedback-prompt" role="complementary">
        <p class="feedback-prompt-title">Comment s'est passée la Jaunt ?</p>
        <p class="feedback-prompt-sub">Ton avis aide le club à s'améliorer.</p>
        <button class="btn-feedback" @click="router.push({ name: 'jaunt-feedback', params: { id: jauntId } })">
          Donner mon avis ✦
        </button>
      </div>
    </main>

    <footer class="footer">
      <button
        v-if="!showFeedbackPrompt"
        class="btn-feedback-secondary"
        @click="router.push({ name: 'jaunt-feedback', params: { id: jauntId } })"
      >
        Donner mon avis
      </button>
      <button class="btn-return" @click="router.push({ name: 'dashboard' })">
        Retour au Dashboard
      </button>
    </footer>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); }

.page-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-5xl); color: var(--color-dark); letter-spacing: -1px; }
.page-sub { font-size: var(--text-md); color: var(--color-gray-text); }

/* Grille photos */
.photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.photo-slot { aspect-ratio: 1; background: var(--color-gray-bg); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; }
.photo-icon { font-size: 28px; opacity: 0.4; }

/* Stats */
.stats-panel { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
.stat-row { display: flex; align-items: center; justify-content: space-between; }
.stat-label { font-size: var(--text-base); color: var(--color-gray-text); }
.stat-value { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-base); color: var(--color-dark); }
.stat-value--highlight { color: var(--color-info); }

/* Feedback prompt */
.upsell { background: linear-gradient(135deg, #5856D6 0%, #7c3aed 100%); border-radius: var(--radius-md); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
.upsell-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); color: #fff; }
.upsell-sub { font-size: var(--text-sm); color: rgba(255,255,255,0.85); line-height: var(--line-height-base); }
.btn-upsell { margin-top: var(--space-2); height: 44px; background: #fff; color: var(--color-primary); border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-bold); cursor: pointer; }
.btn-upsell:hover { opacity: 0.9; }

.feedback-prompt { background: linear-gradient(135deg, #5856D6 0%, #7c3aed 100%); border-radius: var(--radius-md); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
.feedback-prompt-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); color: #fff; }
.feedback-prompt-sub { font-size: var(--text-sm); color: rgba(255,255,255,0.8); }
.btn-feedback { height: 44px; background: #fff; color: var(--color-primary); border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-bold); cursor: pointer; transition: opacity 0.15s; }
.btn-feedback:hover { opacity: 0.9; }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); display: flex; flex-direction: column; gap: var(--space-3); }
.btn-return { width: 100%; height: var(--height-btn); background: var(--color-dark); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-semibold); cursor: pointer; transition: opacity 0.15s; }
.btn-return:hover { opacity: 0.85; }
.btn-feedback-secondary { width: 100%; height: var(--height-btn); background: #fff; border: 1.5px solid var(--color-primary); color: var(--color-primary); border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-semibold); cursor: pointer; transition: opacity 0.15s; }
.btn-feedback-secondary:hover { opacity: 0.85; }

.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.skeleton-block { height: 60px; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.skeleton-photo { aspect-ratio: 1; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
