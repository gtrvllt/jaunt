<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useParticipation } from '@/composables/useParticipation'
import { useCountdown } from '@/composables/useCountdown'

const route = useRoute()
const jauntId = route.params.id as string
const { participation, participantCount, MAX_PARTICIPANTS, loading, error, validating, confirming, fetch, confirmParticipation, startJaunt } = useParticipation(jauntId)

const scheduledAt = computed(() => participation.value?.jaunt.scheduled_at ?? null)
const { hours, minutes, seconds, isExpired } = useCountdown(scheduledAt.value)

onMounted(fetch)
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="$router.push({ name: 'dashboard' })">JAUNT</button>
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
      <!-- Thème + métadonnées -->
      <div>
        <p class="next-label">PROCHAINE JAUNT</p>
        <p class="theme-title">{{ participation.jaunt.jaunt_theme.title }}</p>
        <p v-if="participation.jaunt.jaunt_theme.description" class="theme-desc">
          {{ participation.jaunt.jaunt_theme.description }}
        </p>
      </div>

      <!-- Infos rapides -->
      <div class="meta-row">
        <div v-if="participation.jaunt.jaunt_theme.location_label" class="meta-chip">
          <span aria-hidden="true">📍</span>
          {{ participation.jaunt.jaunt_theme.location_label }}
        </div>
        <div v-if="participation.jaunt.scheduled_at" class="meta-chip">
          <span aria-hidden="true">🕐</span>
          {{ new Date(participation.jaunt.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
        </div>
        <div class="meta-chip">
          <span aria-hidden="true">⏱</span>
          ~2h
        </div>
      </div>

      <!-- Countdown -->
      <div class="countdown-card">
        <p class="countdown-hint">{{ isExpired ? 'La jaunt peut commencer !' : 'Départ dans' }}</p>
        <div class="countdown-digits">
          <div class="digit-block">
            <span class="digit">{{ hours }}</span>
            <span class="digit-label">H</span>
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

      <!-- Compteur participants -->
      <div class="participants-row" aria-label="Participants confirmés">
        <div class="participants-dots">
          <span
            v-for="i in MAX_PARTICIPANTS"
            :key="i"
            class="dot"
            :class="i <= participantCount ? 'dot--filled' : 'dot--empty'"
            :aria-label="i <= participantCount ? 'Participant confirmé' : 'Place disponible'"
          />
        </div>
        <p class="participants-label">
          {{ participantCount }} / {{ MAX_PARTICIPANTS }} confirmé{{ participantCount !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Zone floue (mystery map) -->
      <div class="zone-card" aria-label="Zone de rendez-vous approximative">
        <div class="zone-label-row">
          <span class="zone-label">ZONE DE RENDEZ-VOUS</span>
          <span class="zone-lock">🔒 Adresse exacte dévoilée au démarrage</span>
        </div>
        <div class="zone-map">
          <svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" class="zone-svg">
            <!-- Grille de rues simulée -->
            <line x1="0" y1="50" x2="320" y2="50" stroke="#e0e0e0" stroke-width="1.5"/>
            <line x1="0" y1="95" x2="320" y2="95" stroke="#e0e0e0" stroke-width="1.5"/>
            <line x1="80" y1="0" x2="80" y2="140" stroke="#e0e0e0" stroke-width="1.5"/>
            <line x1="180" y1="0" x2="180" y2="140" stroke="#e0e0e0" stroke-width="1.5"/>
            <line x1="260" y1="0" x2="260" y2="140" stroke="#e0e0e0" stroke-width="1.5"/>
            <!-- Cercle de zone flou -->
            <circle cx="160" cy="70" r="48" fill="rgba(88,86,214,0.12)" stroke="rgba(88,86,214,0.4)" stroke-width="1.5" stroke-dasharray="6 4"/>
            <!-- Point central flou -->
            <circle cx="160" cy="70" r="8" fill="rgba(88,86,214,0.3)"/>
            <circle cx="160" cy="70" r="3" fill="#5856D6"/>
          </svg>
        </div>
      </div>
    </main>

    <footer v-if="participation" class="footer">
      <!-- Invitation reçue → confirmer -->
      <template v-if="participation.status === 'waiting'">
        <button class="btn-cancel" @click="$router.push({ name: 'dashboard' })">Pas cette fois</button>
        <button
          class="btn-confirm"
          :disabled="confirming || participantCount >= MAX_PARTICIPANTS"
          @click="confirmParticipation"
        >
          {{ confirming ? 'Confirmation…' : participantCount >= MAX_PARTICIPANTS ? 'Complet' : "Je suis partant !" }}
        </button>
      </template>

      <!-- Confirmé → feedback + attente départ -->
      <template v-else-if="participation.status === 'confirmed'">
        <div class="confirmed-banner" role="status">
          <span aria-hidden="true">🚀</span>
          <div>
            <p class="confirmed-title">Tu es dans le groupe !</p>
            <p class="confirmed-sub">Reviens au moment du départ pour démarrer.</p>
          </div>
        </div>
      </template>

      <!-- Démarrer (isExpired + confirmed/active) -->
      <template v-if="['confirmed', 'active'].includes(participation.status) && isExpired">
        <button class="btn-start" :disabled="validating" @click="startJaunt">
          {{ validating ? 'Démarrage…' : 'Démarrer la Jaunt' }}
        </button>
      </template>
    </footer>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto; }

.next-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); margin-bottom: var(--space-1); }
.theme-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; }
.theme-desc { font-size: var(--text-base); color: var(--color-gray-text); line-height: var(--line-height-base); margin-top: var(--space-2); }

/* Meta chips */
.meta-row { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.meta-chip { display: flex; align-items: center; gap: var(--space-1); background: var(--color-gray-bg); border-radius: var(--radius-full); padding: var(--space-1) var(--space-3); font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-dark); }

/* Countdown */
.countdown-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.countdown-hint { font-size: var(--text-base); color: var(--color-gray-text); }
.countdown-digits { display: flex; align-items: center; gap: var(--space-3); }
.digit-block { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
.digit { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: 48px; color: var(--color-dark); line-height: 1; min-width: 56px; text-align: center; }
.digit-label { font-size: var(--text-xs); color: var(--color-gray-text); letter-spacing: var(--letter-spacing-label); }
.colon { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: 40px; color: var(--color-gray-text); line-height: 1; margin-bottom: var(--space-4); }

/* Zone card */
.zone-card { background: var(--color-gray-bg); border-radius: var(--radius-md); overflow: hidden; }
.zone-label-row { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-5); flex-wrap: wrap; gap: var(--space-2); }
.zone-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); }
.zone-lock { font-size: var(--text-xs); color: var(--color-gray-text); }
.zone-map { background: #f0f0f0; }
.zone-svg { width: 100%; display: block; }

/* Participants */
.participants-row { display: flex; align-items: center; gap: var(--space-3); }
.participants-dots { display: flex; gap: var(--space-2); }
.dot { width: 14px; height: 14px; border-radius: var(--radius-full); transition: background 0.2s; }
.dot--filled { background: var(--color-primary); }
.dot--empty { background: var(--color-gray-border); }
.participants-label { font-size: var(--text-sm); color: var(--color-gray-text); font-weight: var(--font-weight-semibold); }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); display: flex; flex-direction: column; gap: var(--space-3); border-top: 1px solid var(--color-gray-border); }
.btn-cancel { height: var(--height-btn); background: #fff; border: 1px solid var(--color-gray-border); color: var(--color-gray-text); border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-semibold); cursor: pointer; }
.btn-confirm { height: var(--height-btn); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); cursor: pointer; box-shadow: var(--shadow-primary); transition: opacity 0.15s; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.btn-confirm:not(:disabled):hover { opacity: 0.9; }
.btn-start { height: var(--height-btn); background: var(--color-dark); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-semibold); cursor: pointer; transition: opacity 0.15s; }
.btn-start:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-start:not(:disabled):hover { opacity: 0.9; }

/* Confirmation banner */
.confirmed-banner { display: flex; align-items: flex-start; gap: var(--space-3); background: #f0fdf4; border: 1.5px solid var(--color-success); border-radius: var(--radius-md); padding: var(--space-4) var(--space-5); font-size: 24px; }
.confirmed-title { font-weight: var(--font-weight-bold); color: var(--color-dark); font-size: var(--text-base); }
.confirmed-sub { font-size: var(--text-sm); color: var(--color-gray-text); margin-top: 2px; }

.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.skeleton-block { height: 120px; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-block--short { height: 72px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
