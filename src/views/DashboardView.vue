<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useJaunt } from '@/composables/useJaunt'
import { useSocialProof } from '@/composables/useSocialProof'

const router = useRouter()
const auth = useAuthStore()
const profile = useProfileStore()
const { activeJaunt, loading, error, currentTip, nextTip, fetchActiveJaunt, joinQueue, leaveQueue } = useJaunt()
const { stats, fetchStats } = useSocialProof()

const MIN_INTERESTS = 3
const hasAvatar = computed(() => !!auth.profile?.avatar_url)
const hasEnoughInterests = computed(() => profile.interestCount >= MIN_INTERESTS)
const completionScore = computed(() => [hasEnoughInterests.value, hasAvatar.value].filter(Boolean).length)
const isProfileComplete = computed(() => completionScore.value === 2)

onMounted(() => {
  fetchActiveJaunt()
  fetchStats()
  if (auth.session) profile.fetchSelectedInterests(auth.session.user.id)
})

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="screen">
    <!-- AppBar -->
    <header class="appbar">
      <span class="appbar-logo">JAUNT</span>
      <button
        class="avatar-btn"
        aria-label="Mon profil"
        @click="router.push({ name: 'profile' })"
      >
        <span class="avatar-head" aria-hidden="true" />
        <span class="avatar-shoulders" aria-hidden="true" />
      </button>
    </header>

    <!-- Contenu -->
    <main class="content">
      <h2 class="greeting">Welcome back{{ auth.profile ? ', ' + auth.profile.nickname : '' }} 👋</h2>

      <!-- Loading -->
      <div v-if="loading" class="hero-skeleton" aria-busy="true" aria-label="Chargement…">
        <div class="skeleton-line skeleton-line--wide" />
        <div class="skeleton-line" />
        <div class="skeleton-line skeleton-line--short" />
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="state-card state-card--error" role="alert">
        <p>Impossible de charger ta jaunt.</p>
        <button class="retry-btn" @click="fetchActiveJaunt">Réessayer</button>
      </div>

      <!-- Dans la queue d'attente -->
      <div v-else-if="!activeJaunt && auth.profile?.status === 'busy'" class="queue-card">
        <div class="queue-pulse" aria-hidden="true" />
        <p class="queue-label">Recherche de Jaunt en cours…</p>
        <p class="queue-sub">On cherche des explorateurs autour de toi. Reste proche !</p>
        <button class="btn-leave" @click="leaveQueue">Annuler la recherche</button>
      </div>

      <!-- Aucune jaunt active -->
      <div v-else-if="!activeJaunt" class="state-card">
        <p class="empty-label">Pas de Jaunt pour le moment…</p>
        <p class="empty-sub">Lance une recherche pour être matché dès qu'une aventure se prépare.</p>
        <button class="btn-join-queue" @click="joinQueue">Trouver une Jaunt</button>
      </div>

      <!-- Jaunt active -->
      <div v-else class="hero-card">
        <p class="hero-label">NEXT JAUNT</p>
        <p class="hero-time">Starting at {{ formatTime(activeJaunt.jaunt.scheduled_at) }}</p>

        <div class="status-chip" :class="`status-chip--${activeJaunt.status}`">
          {{ activeJaunt.status === 'waiting' ? 'En attente' : 'En cours' }}
        </div>

        <h3 class="hero-theme">{{ activeJaunt.jaunt.jaunt_theme.title }}</h3>
        <p class="hero-desc">{{ activeJaunt.jaunt.jaunt_theme.description }}</p>

        <button
          class="btn-join"
          @click="router.push({ name: 'jaunt-before', params: { id: activeJaunt.jaunt_id } })"
        >
          Rejoindre la Jaunt
        </button>
      </div>

      <!-- Profile completion nudge -->
      <div
        v-if="!activeJaunt"
        class="profile-card"
        :class="{ 'profile-card--complete': isProfileComplete }"
        role="button"
        tabindex="0"
        @click="router.push({ name: 'profile-edit' })"
        @keydown.enter="router.push({ name: 'profile-edit' })"
      >
        <div class="profile-card-top">
          <span class="profile-card-icon" aria-hidden="true">{{ isProfileComplete ? '✅' : '⚡' }}</span>
          <div class="profile-card-text">
            <p v-if="isProfileComplete" class="profile-card-title">Profil optimisé pour le matching !</p>
            <p v-else class="profile-card-title">Optimise tes chances d'invitation</p>
            <p v-if="!isProfileComplete" class="profile-card-sub">Mettre tes intérêts à jour aide à trouver le bon groupe.</p>
          </div>
          <span class="profile-card-chevron" aria-hidden="true">›</span>
        </div>

        <div v-if="!isProfileComplete" class="profile-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (completionScore / 2 * 100) + '%' }" />
          </div>
          <p class="progress-items">
            <span :class="hasEnoughInterests ? 'item--done' : 'item--todo'">{{ hasEnoughInterests ? '✓' : '○' }} Centres d'intérêt</span>
            <span :class="hasAvatar ? 'item--done' : 'item--todo'">{{ hasAvatar ? '✓' : '○' }} Photo de profil</span>
          </p>
        </div>
      </div>

      <!-- Social proof stats -->
      <div v-if="!activeJaunt && stats" class="stats-card">
        <div class="stat-item">
          <span class="stat-icon" aria-hidden="true">🔍</span>
          <div class="stat-body">
            <span class="stat-value">{{ stats.searching_this_week }}</span>
            <span class="stat-label">personne{{ stats.searching_this_week !== 1 ? 's' : '' }} en recherche cette semaine</span>
          </div>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-icon" aria-hidden="true">🗺️</span>
          <div class="stat-body">
            <span class="stat-value">{{ stats.jaunts_this_week }}</span>
            <span class="stat-label">jaunt{{ stats.jaunts_this_week !== 1 ? 's' : '' }} cette semaine</span>
          </div>
        </div>
      </div>

      <!-- Tips carousel -->
      <section class="tips-section" aria-label="Conseil du jour">
        <div class="tips-card">
          <p class="tips-text">{{ currentTip }}</p>
          <button class="tips-next" aria-label="Conseil suivant" @click="nextTip">›</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: #fff;
}

/* AppBar */
.appbar {
  height: var(--height-appbar);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--color-gray-border);
  flex-shrink: 0;
}

.appbar-logo {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-lg);
  letter-spacing: var(--letter-spacing-logo);
  color: var(--color-dark);
}

.avatar-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-gray-bg);
  border: 1px solid var(--color-gray-border);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.avatar-head {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  top: 8px;
}

.avatar-shoulders {
  position: absolute;
  width: 28px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 14px 14px 0 0;
  bottom: 0;
}

/* Contenu */
.content {
  flex: 1;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.greeting {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-3xl);
  color: var(--color-dark);
}

/* Skeleton loading */
.hero-skeleton {
  background: var(--color-gray-bg);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-line {
  height: 14px;
  background: var(--color-gray-border);
  border-radius: var(--radius-sm);
  animation: pulse 1.4s ease-in-out infinite;
  width: 75%;
}

.skeleton-line--wide { width: 100%; }
.skeleton-line--short { width: 45%; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* State card */
.state-card {
  background: var(--color-gray-bg);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
}

.state-card--error {
  background: #fff0ef;
  border: 1px solid var(--color-error);
}

.empty-label {
  font-size: var(--text-md);
  color: var(--color-dark);
  font-weight: var(--font-weight-semibold);
}

.empty-sub {
  font-size: var(--text-base);
  color: var(--color-gray-text);
  line-height: var(--line-height-base);
}

.ready-badge {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-5);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-label);
}

.retry-btn {
  background: none;
  border: 1px solid var(--color-error);
  color: var(--color-error);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-5);
  font-size: var(--text-base);
  cursor: pointer;
}

/* Queue */
.queue-card {
  background: var(--color-primary-light);
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
}

.queue-pulse {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  animation: queue-pulse 1.8s ease-in-out infinite;
}

@keyframes queue-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.6; }
}

.queue-label {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-xl);
  color: var(--color-primary);
}

.queue-sub {
  font-size: var(--text-base);
  color: var(--color-gray-text);
  line-height: var(--line-height-base);
}

.btn-leave {
  margin-top: var(--space-2);
  background: none;
  border: 1.5px solid var(--color-error);
  color: var(--color-error);
  border-radius: var(--radius-xl);
  padding: var(--space-2) var(--space-6);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-leave:hover { opacity: 0.75; }

.btn-join-queue {
  margin-top: var(--space-2);
  width: 100%;
  height: var(--height-btn);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-xl);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: var(--shadow-primary);
  transition: opacity 0.15s;
}

.btn-join-queue:hover { opacity: 0.9; }

/* Hero card */
.hero-card {
  background: var(--color-gray-bg);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.hero-label {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-label);
  color: var(--color-gray-text);
}

.hero-time {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-3xl);
  color: var(--color-dark);
}

.status-chip {
  align-self: flex-start;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
}

.status-chip--waiting {
  background: #fff3cd;
  color: #856404;
}

.status-chip--active {
  background: #d1f5d3;
  color: #1a6b24;
}

.hero-theme {
  font-family: var(--font-brand);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
}

.hero-desc {
  font-size: var(--text-base);
  color: var(--color-gray-text);
  line-height: var(--line-height-base);
}

.btn-join {
  width: 100%;
  height: var(--height-btn);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-xl);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  margin-top: var(--space-2);
  transition: opacity 0.15s;
}

.btn-join:hover { opacity: 0.9; }

/* Profile completion */
.profile-card {
  background: var(--color-gray-bg);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: border-color 0.15s;
}

.profile-card:hover { border-color: var(--color-primary); }

.profile-card--complete {
  background: #f0fdf4;
  border-color: var(--color-success);
}

.profile-card-top {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.profile-card-icon { font-size: 20px; flex-shrink: 0; }

.profile-card-text { flex: 1; }

.profile-card-title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-base);
  color: var(--color-dark);
}

.profile-card-sub {
  font-size: var(--text-xs);
  color: var(--color-gray-text);
  margin-top: 2px;
  line-height: var(--line-height-base);
}

.profile-card-chevron {
  font-size: 20px;
  color: var(--color-gray-text);
  flex-shrink: 0;
}

.profile-progress { margin-top: var(--space-3); }

.progress-bar {
  height: 6px;
  background: var(--color-gray-border);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-2);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.4s ease;
}

.progress-items {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-xs);
}

.item--done { color: var(--color-success); }
.item--todo { color: var(--color-gray-text); }

/* Social proof */
.stats-card {
  background: var(--color-gray-bg);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-2xl);
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-gray-text);
  line-height: var(--line-height-base);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--color-gray-border);
  flex-shrink: 0;
}

/* Tips */
.tips-section { margin-top: auto; }

.tips-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-gray-bg);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
}

.tips-text {
  flex: 1;
  font-size: var(--text-base);
  color: var(--color-gray-text);
  line-height: var(--line-height-base);
  font-style: italic;
}

.tips-next {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0 var(--space-1);
  flex-shrink: 0;
}
</style>
