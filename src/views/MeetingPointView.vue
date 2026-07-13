<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useParticipation } from '@/composables/useParticipation'
import { useMaps } from '@/composables/useMaps'

const SUPPORT_EMAIL = 'support@jaunt.club'

const route = useRoute()
const jauntId = route.params.id as string
const { participation, loading, error, fetch } = useParticipation(jauntId)
const { openInMaps } = useMaps()

// Live Mode : les infos ne sont révélées que lorsque la participation est active.
const isLive = computed(() => participation.value?.status === 'active')
const theme = computed(() => participation.value?.jaunt.jaunt_theme ?? null)
const hasCoords = computed(
  () => theme.value?.meeting_lat != null && theme.value?.meeting_lng != null,
)

function onOpenMaps() {
  if (!theme.value || theme.value.meeting_lat == null || theme.value.meeting_lng == null) return
  openInMaps(theme.value.meeting_lat, theme.value.meeting_lng, theme.value.title)
}

const supportHref = computed(
  () =>
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `[Jaunt] Besoin d'aide — point de rendez-vous (${jauntId})`,
    )}&body=${encodeURIComponent(
      "Je n'arrive pas à retrouver mon groupe au point de rendez-vous.",
    )}`,
)

onMounted(fetch)
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="$router.push({ name: 'dashboard' })">JAUNT</button>
    </header>

    <main v-if="loading" class="content" aria-busy="true" aria-label="Chargement…">
      <div class="skeleton-photo" />
      <div class="skeleton-block" />
    </main>

    <main v-else-if="error" class="content">
      <div class="state-card state-card--error" role="alert"><p>{{ error }}</p></div>
    </main>

    <main v-else-if="!participation || !theme" class="content">
      <div class="state-card"><p>Participation introuvable.</p></div>
    </main>

    <!-- Verrouillé : Live Mode pas encore déclenché -->
    <main v-else-if="!isLive" class="content content--center">
      <div class="lock-icon" aria-hidden="true">🔒</div>
      <h1 class="lock-title">Point de rendez-vous verrouillé</h1>
      <p class="lock-sub">
        L'adresse exacte et le repère visuel seront dévoilés au démarrage de la Jaunt, à l'heure prévue.
      </p>
    </main>

    <!-- Révélé -->
    <main v-else class="content">
      <div class="reveal-header">
        <p class="reveal-label">POINT DE RENDEZ-VOUS</p>
        <h1 class="reveal-title">C'est ici que tout commence</h1>
      </div>

      <!-- Repère visuel -->
      <div class="landmark">
        <img
          v-if="theme.meeting_landmark_url"
          :src="theme.meeting_landmark_url"
          alt="Repère visuel du point de rendez-vous"
          class="landmark-img"
        />
        <div v-else class="landmark-placeholder">
          <span aria-hidden="true">📸</span>
          <p>Repère visuel</p>
        </div>
      </div>

      <!-- Adresse -->
      <div class="address-card">
        <span class="address-pin" aria-hidden="true">📍</span>
        <div class="address-body">
          <p class="address-label">ADRESSE EXACTE</p>
          <p class="address-text">{{ theme.meeting_address ?? 'Adresse non renseignée' }}</p>
          <p v-if="hasCoords" class="address-coords">
            {{ theme.meeting_lat!.toFixed(5) }}, {{ theme.meeting_lng!.toFixed(5) }}
          </p>
        </div>
      </div>

      <!-- Aide -->
      <a class="help-link" :href="supportHref">
        <span aria-hidden="true">🆘</span>
        Tu ne trouves pas le groupe ? Contacter le support
      </a>
    </main>

    <footer v-if="isLive && hasCoords" class="footer">
      <button class="btn-maps" @click="onOpenMaps">
        <span aria-hidden="true">🧭</span>
        Ouvrir l'itinéraire dans Maps
      </button>
    </footer>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto; }
.content--center { align-items: center; justify-content: center; text-align: center; gap: var(--space-4); }

/* Verrouillé */
.lock-icon { font-size: 56px; line-height: 1; }
.lock-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; }
.lock-sub { font-size: var(--text-base); color: var(--color-gray-text); line-height: var(--line-height-base); max-width: 300px; }

/* En-tête révélé */
.reveal-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-primary); margin-bottom: var(--space-2); }
.reveal-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; }

/* Repère visuel */
.landmark { border-radius: var(--radius-md); overflow: hidden; background: var(--color-gray-bg); aspect-ratio: 4/3; }
.landmark-img { width: 100%; height: 100%; object-fit: cover; }
.landmark-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); color: var(--color-gray-text); font-size: var(--text-sm); }
.landmark-placeholder span { font-size: 40px; }

/* Adresse */
.address-card { display: flex; align-items: flex-start; gap: var(--space-3); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-5); }
.address-pin { font-size: 22px; flex-shrink: 0; }
.address-body { flex: 1; }
.address-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); margin-bottom: var(--space-1); }
.address-text { font-size: var(--text-md); color: var(--color-dark); font-weight: var(--font-weight-semibold); line-height: var(--line-height-base); }
.address-coords { font-family: var(--font-body); font-size: var(--text-sm); color: var(--color-gray-text); margin-top: var(--space-2); }

/* Aide */
.help-link { display: flex; align-items: center; gap: var(--space-2); justify-content: center; padding: var(--space-4); border: 1.5px dashed var(--color-gray-border); border-radius: var(--radius-md); color: var(--color-gray-text); font-size: var(--text-sm); font-weight: var(--font-weight-semibold); text-decoration: none; transition: border-color 0.15s, color 0.15s; }
.help-link:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); border-top: 1px solid var(--color-gray-border); }
.btn-maps { width: 100%; height: var(--height-btn); display: flex; align-items: center; justify-content: center; gap: var(--space-2); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); cursor: pointer; box-shadow: var(--shadow-primary); transition: opacity 0.15s; }
.btn-maps:hover { opacity: 0.9; }

/* États */
.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.skeleton-photo { aspect-ratio: 4/3; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-block { height: 100px; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
