<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useParticipation } from '@/composables/useParticipation'
import { useCountdown } from '@/composables/useCountdown'

const route = useRoute()
const jauntId = route.params.id as string
const { participation, loading, error, validating, fetch, startJaunt } = useParticipation(jauntId)

const scheduledAt = computed(() => participation.value?.jaunt.scheduled_at ?? null)
const { hours, minutes, seconds, isExpired } = useCountdown(scheduledAt.value)

onMounted(fetch)
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <span class="appbar-logo">JAUNT</span>
    </header>

    <main v-if="loading" class="content" aria-busy="true" aria-label="Chargement…">
      <div class="skeleton-block" />
      <div class="skeleton-block skeleton-block--short" />
    </main>

    <main v-else-if="error" class="content">
      <div class="state-card state-card--error" role="alert"><p>{{ error }}</p></div>
    </main>

    <main v-else-if="!participation" class="content">
      <div class="state-card"><p>Participation introuvable.</p></div>
    </main>

    <main v-else class="content">
      <p class="next-label">NEXT JAUNT</p>
      <p class="theme-title">{{ participation.jaunt.jaunt_theme.title }}</p>

      <div class="countdown-card">
        <p class="countdown-hint">{{ isExpired ? 'La jaunt peut commencer !' : 'Départ dans' }}</p>
        <div class="countdown-digits">
          <div class="digit-block">
            <span class="digit">{{ hours }}</span>
            <span class="digit-label">HRS</span>
          </div>
          <span class="colon">:</span>
          <div class="digit-block">
            <span class="digit">{{ minutes }}</span>
            <span class="digit-label">MIN</span>
          </div>
          <span class="colon">:</span>
          <div class="digit-block">
            <span class="digit">{{ seconds }}</span>
            <span class="digit-label">SEC</span>
          </div>
        </div>
      </div>

      <div class="location-card">
        <span class="location-icon" aria-hidden="true">📍</span>
        <div>
          <p class="location-title">Location locked — awaiting jaunt start</p>
          <p class="location-sub">Meet near the blue mural</p>
        </div>
      </div>
    </main>

    <footer v-if="participation" class="footer">
      <button class="btn-cancel" :disabled="validating" @click="$router.push({ name: 'dashboard' })">
        Cancel
      </button>
      <button class="btn-start" :disabled="validating || !isExpired" @click="startJaunt">
        {{ validating ? 'Démarrage…' : 'Start the Jaunt' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); }
.next-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); }
.theme-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; }

.countdown-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.countdown-hint { font-size: var(--text-base); color: var(--color-gray-text); }
.countdown-digits { display: flex; align-items: center; gap: var(--space-3); }
.digit-block { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
.digit { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: 48px; color: var(--color-dark); line-height: 1; min-width: 64px; text-align: center; }
.digit-label { font-size: var(--text-xs); color: var(--color-gray-text); letter-spacing: var(--letter-spacing-label); }
.colon { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: 40px; color: var(--color-gray-text); line-height: 1; margin-bottom: var(--space-4); }

.location-card { display: flex; align-items: flex-start; gap: var(--space-4); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-5); }
.location-icon { font-size: 24px; flex-shrink: 0; }
.location-title { font-size: var(--text-base); font-weight: var(--font-weight-semibold); color: var(--color-dark); }
.location-sub { font-size: var(--text-sm); color: var(--color-gray-text); margin-top: var(--space-1); }

.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); display: flex; gap: var(--space-3); border-top: 1px solid var(--color-gray-border); }
.btn-cancel { flex: 1; height: var(--height-btn); background: #fff; border: 1px solid var(--color-error); color: var(--color-error); border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-semibold); cursor: pointer; }
.btn-start { flex: 2; height: var(--height-btn); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-semibold); cursor: pointer; transition: opacity 0.15s; }
.btn-start:disabled { opacity: 0.5; cursor: not-allowed; }

.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.skeleton-block { height: 120px; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-block--short { height: 72px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
