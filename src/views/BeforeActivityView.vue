<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useParticipation } from '@/composables/useParticipation'
import { useCountdown } from '@/composables/useCountdown'
import { useAccess } from '@/composables/useAccess'

const route = useRoute()
const jauntId = route.params.id as string
const { participation, participantCount, coAdventurers, MAX_PARTICIPANTS, loading, error, validating, confirming, requiresSubscription, fetch, subscribeToParticipants, confirmParticipation, startJaunt } = useParticipation(jauntId)
const { access, fetchAccess } = useAccess()

const scheduledAt = computed(() => participation.value?.jaunt.scheduled_at ?? null)
const { hours, minutes, seconds, isExpired } = useCountdown(scheduledAt.value)

// Paywall : soit bloqué proactivement (limite déjà atteinte), soit après un
// clic refusé par le trigger serveur.
const showPaywall = computed(
  () => requiresSubscription.value || access.value?.can_start_new_jaunt === false,
)

function initials(nickname: string) {
  return nickname.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

onMounted(() => { fetch(); subscribeToParticipants(); fetchAccess() })
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="$router.push({ name: 'dashboard' })">JAUNT</button>
      <button
        class="close-btn"
        aria-label="Fermer et revenir plus tard"
        @click="$router.push({ name: 'dashboard' })"
      >
        ✕
      </button>
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

      <!-- Co-aventuriers (visible après confirmation) -->
      <div
        v-if="participation.status !== 'waiting' && coAdventurers.length > 0"
        class="co-section"
        aria-label="Tes co-aventuriers"
      >
        <p class="co-title">TES CO-AVENTURIERS</p>
        <div class="co-list">
          <div v-for="person in coAdventurers" :key="person.profile_id" class="co-card">
            <div class="co-avatar" :aria-label="`Initiales de ${person.nickname}`">
              {{ initials(person.nickname) }}
            </div>
            <div class="co-info">
              <p class="co-name">{{ person.nickname }}</p>
              <p v-if="person.shared_interest" class="co-interest">
                <span aria-hidden="true">✦</span> En commun : {{ person.shared_interest }}
              </p>
              <p v-else class="co-interest co-interest--none">Intérêts à découvrir…</p>
            </div>
          </div>
        </div>
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
      <!-- Paywall freemium : limite gratuite atteinte -->
      <template v-if="participation.status === 'waiting' && showPaywall">
        <div class="paywall" role="status">
          <span class="paywall-icon" aria-hidden="true">✨</span>
          <p class="paywall-title">Tu as adoré ta première Jaunt ?</p>
          <p class="paywall-sub">Passe à un abonnement pour continuer l'aventure et enchaîner les rencontres.</p>
        </div>
        <button class="btn-cancel" @click="$router.push({ name: 'dashboard' })">Plus tard</button>
        <button class="btn-confirm" @click="$router.push({ name: 'membership' })">
          Voir les abonnements
        </button>
      </template>

      <!-- Invitation reçue → confirmer -->
      <template v-else-if="participation.status === 'waiting'">
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

.appbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.close-btn { background: var(--color-gray-bg); border: 1px solid var(--color-gray-border); border-radius: var(--radius-full); width: 32px; height: 32px; font-size: 14px; color: var(--color-gray-text); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.close-btn:hover { color: var(--color-dark); }
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

/* Co-adventurers */
.co-section { display: flex; flex-direction: column; gap: var(--space-3); }
.co-title { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); }
.co-list { display: flex; flex-direction: column; gap: var(--space-2); }
.co-card { display: flex; align-items: center; gap: var(--space-4); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-4) var(--space-5); }
.co-avatar { width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-base); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.co-info { flex: 1; }
.co-name { font-weight: var(--font-weight-semibold); font-size: var(--text-base); color: var(--color-dark); }
.co-interest { font-size: var(--text-sm); color: var(--color-primary); margin-top: 2px; font-weight: var(--font-weight-semibold); }
.co-interest--none { color: var(--color-gray-text); font-weight: var(--font-weight-normal); font-style: italic; }

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

/* Paywall freemium */
.paywall { background: linear-gradient(135deg, #5856D6 0%, #7c3aed 100%); border-radius: var(--radius-md); padding: var(--space-5); text-align: center; margin-bottom: var(--space-1); }
.paywall-icon { font-size: 28px; }
.paywall-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); color: #fff; margin-top: var(--space-2); }
.paywall-sub { font-size: var(--text-sm); color: rgba(255,255,255,0.85); line-height: var(--line-height-base); margin-top: var(--space-1); }

.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.skeleton-block { height: 120px; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-block--short { height: 72px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
