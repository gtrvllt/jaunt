<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'
import { useSubscription } from '@/composables/useSubscription'
import type { Database } from '@/types/supabase'

type Interest = Database['public']['Tables']['interest']['Row']
type Achievement = Database['public']['Tables']['achievement']['Row']

const router = useRouter()
const auth = useAuthStore()
const { signOut } = useAuth()
const { isActive, currentPlan, fetchSubscription } = useSubscription()

const interests = ref<Interest[]>([])
const achievements = ref<Achievement[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  if (!auth.session) return
  loading.value = true
  error.value = null

  fetchSubscription()

  const [interestRes, achievementRes] = await Promise.all([
    supabase
      .from('profile_interest')
      .select('interest:interest_id(*)')
      .eq('profile_id', auth.session.user.id),
    supabase
      .from('profile_achievement')
      .select('achievement:achievement_id(*)')
      .eq('profile_id', auth.session.user.id),
  ])

  loading.value = false

  if (interestRes.error) { error.value = interestRes.error.message; return }
  if (achievementRes.error) { error.value = achievementRes.error.message; return }

  interests.value = (interestRes.data ?? []).map((r) => r.interest as unknown as Interest)
  achievements.value = (achievementRes.data ?? []).map((r) => r.achievement as unknown as Achievement)
})
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="router.push({ name: 'dashboard' })">JAUNT</button>
      <button
        class="edit-btn"
        aria-label="Modifier le profil"
        @click="router.push({ name: 'profile-edit' })"
      >
        ✎
      </button>
    </header>

    <main v-if="loading" class="content" aria-busy="true" aria-label="Chargement…">
      <div class="avatar-skeleton" />
      <div class="skeleton-line skeleton-line--wide" />
      <div class="skeleton-line" />
    </main>

    <main v-else-if="error" class="content">
      <div class="state-card state-card--error" role="alert"><p>{{ error }}</p></div>
    </main>

    <main v-else-if="!auth.profile" class="content">
      <div class="state-card"><p>Profil introuvable.</p></div>
    </main>

    <main v-else class="content">
      <!-- Avatar + infos -->
      <div class="profile-header">
        <div class="avatar" aria-label="Avatar de profil">
          <img v-if="auth.profile.avatar_url" :src="auth.profile.avatar_url" alt="" class="avatar-photo" />
          <template v-else>
            <span class="avatar-head" aria-hidden="true" />
            <span class="avatar-shoulders" aria-hidden="true" />
          </template>
        </div>
        <div class="profile-info">
          <h1 class="nickname">{{ auth.profile.nickname }}</h1>
          <p class="joined">Membre depuis {{ new Date(auth.profile.joined_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}</p>
          <p class="xp">⭐ {{ auth.profile.xp_points }} XP</p>
        </div>
      </div>

      <!-- Intérêts -->
      <section aria-label="Intérêts">
        <h2 class="section-title">INTERESTS</h2>
        <div v-if="interests.length > 0" class="pills">
          <span v-for="i in interests" :key="i.id" class="pill">{{ i.name }}</span>
        </div>
        <p v-else class="empty-text">Aucun intérêt sélectionné.</p>
      </section>

      <!-- Abonnement -->
      <section aria-label="Abonnement">
        <h2 class="section-title">ABONNEMENT</h2>
        <button class="membership-row" @click="router.push({ name: 'membership' })">
          <div class="membership-info">
            <p class="membership-label">
              {{ isActive ? `Formule ${currentPlan === 'premium' ? 'Premium' : 'Standard'}` : 'Formule Free' }}
            </p>
            <p class="membership-sub">
              {{ isActive ? 'Gérer ou changer de formule' : 'Passe à un abonnement' }}
            </p>
          </div>
          <span class="membership-chevron" aria-hidden="true">›</span>
        </button>
      </section>

      <!-- Admin (réservé) -->
      <section v-if="auth.profile?.is_admin" aria-label="Admin">
        <h2 class="section-title">ADMIN</h2>
        <button class="membership-row" @click="router.push({ name: 'admin' })">
          <div class="membership-info">
            <p class="membership-label">Création de jaunts</p>
            <p class="membership-sub">Thèmes, missions, instances</p>
          </div>
          <span class="membership-chevron" aria-hidden="true">›</span>
        </button>
      </section>

      <!-- Achievements -->
      <section aria-label="Achievements">
        <h2 class="section-title">ACHIEVEMENTS</h2>
        <div v-if="achievements.length > 0" class="achievements">
          <div v-for="a in achievements" :key="a.id" class="achievement-card">
            <span class="achievement-icon" aria-hidden="true">🏅</span>
            <div>
              <p class="achievement-name">{{ a.name }}</p>
              <p v-if="a.description" class="achievement-desc">{{ a.description }}</p>
            </div>
          </div>
        </div>
        <p v-else class="empty-text">Pas encore d'achievements. Complete une jaunt !</p>
      </section>
    </main>

    <footer class="footer">
      <button class="btn-logout" @click="signOut">Logout</button>
    </footer>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }
.edit-btn { background: var(--color-gray-bg); border: 1px solid var(--color-gray-border); border-radius: var(--radius-full); width: 40px; height: 40px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); }

/* Header profil */
.profile-header { display: flex; align-items: center; gap: var(--space-5); background: var(--color-primary); border-radius: var(--radius-md); padding: var(--space-5); }
.avatar { width: 64px; height: 64px; border-radius: var(--radius-full); background: rgba(255,255,255,0.2); flex-shrink: 0; position: relative; overflow: hidden; display: flex; align-items: flex-start; justify-content: center; }
.avatar-photo { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.avatar-head { position: absolute; width: 22px; height: 22px; border-radius: var(--radius-full); background: #fff; top: 12px; }
.avatar-shoulders { position: absolute; width: 44px; height: 26px; background: #fff; border-radius: 22px 22px 0 0; bottom: 0; }
.profile-info { display: flex; flex-direction: column; gap: var(--space-1); }
.nickname { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-xl); color: #fff; }
.joined { font-size: var(--text-sm); color: rgba(255,255,255,0.75); }
.xp { font-size: var(--text-base); color: rgba(255,255,255,0.9); font-weight: var(--font-weight-semibold); }

/* Sections */
.section-title { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); margin-bottom: var(--space-3); }

.pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.pill { padding: 0 var(--space-3); height: var(--height-pill); display: inline-flex; align-items: center; background: var(--color-primary); color: #fff; border-radius: var(--radius-sm); font-size: var(--text-base); }

.achievements { display: flex; flex-direction: column; gap: var(--space-3); }
.achievement-card { display: flex; align-items: flex-start; gap: var(--space-3); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-4); }
.achievement-icon { font-size: 24px; flex-shrink: 0; }
.achievement-name { font-size: var(--text-base); font-weight: var(--font-weight-semibold); color: var(--color-dark); }
.achievement-desc { font-size: var(--text-sm); color: var(--color-gray-text); margin-top: var(--space-1); }

.empty-text { font-size: var(--text-base); color: var(--color-gray-text); font-style: italic; }

/* Abonnement */
.membership-row { width: 100%; display: flex; align-items: center; justify-content: space-between; background: var(--color-gray-bg); border: none; border-radius: var(--radius-md); padding: var(--space-4) var(--space-5); cursor: pointer; text-align: left; transition: opacity 0.15s; }
.membership-row:hover { opacity: 0.8; }
.membership-info { display: flex; flex-direction: column; gap: 2px; }
.membership-label { font-size: var(--text-base); font-weight: var(--font-weight-semibold); color: var(--color-dark); }
.membership-sub { font-size: var(--text-sm); color: var(--color-gray-text); }
.membership-chevron { font-size: 24px; color: var(--color-gray-text); line-height: 1; }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); }
.btn-logout { width: 100%; height: var(--height-btn); background: #fff; border: 1px solid var(--color-error); color: var(--color-error); border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-semibold); cursor: pointer; transition: opacity 0.15s; }
.btn-logout:hover { opacity: 0.8; }

/* States */
.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.avatar-skeleton { width: 64px; height: 64px; border-radius: var(--radius-full); background: var(--color-gray-bg); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-line { height: 14px; background: var(--color-gray-border); border-radius: var(--radius-sm); animation: pulse 1.4s ease-in-out infinite; width: 60%; }
.skeleton-line--wide { width: 100%; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
