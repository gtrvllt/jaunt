<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParticipation } from '@/composables/useParticipation'

const route = useRoute()
const router = useRouter()
const jauntId = route.params.id as string
const { participation, loading, error, validating, fetch, validateStep } = useParticipation(jauntId)

const currentQuest = computed(() => {
  if (!participation.value) return null
  return participation.value.jaunt.jaunt_theme.quests[participation.value.current_quest_index] ?? null
})

onMounted(fetch)

async function onValidate() {
  if (!navigator.geolocation) {
    alert('La géolocalisation n\'est pas disponible sur cet appareil.')
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => validateStep({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => { alert('Impossible d\'obtenir ta position. Vérifie les permissions de localisation.') },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}
</script>

<template>
  <div class="screen">
    <!-- AppBar flottante sur la carte -->
    <header class="appbar">
      <span class="appbar-logo">JAUNT</span>
      <button
        class="list-btn"
        aria-label="Voir la liste des quêtes"
        @click="router.push({ name: 'jaunt-live', params: { id: jauntId } })"
      >
        ☰
      </button>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="map-placeholder map-placeholder--loading" aria-busy="true" aria-label="Chargement…">
      <p class="map-loading-text">Chargement de la carte…</p>
    </div>

    <!-- Erreur -->
    <div v-else-if="error" class="map-placeholder" role="alert">
      <p class="state-error">{{ error }}</p>
    </div>

    <!-- Carte + overlay -->
    <template v-else-if="participation && currentQuest">
      <!-- Placeholder carte (Leaflet à intégrer ultérieurement) -->
      <div class="map-placeholder" aria-label="Carte de la jaunt">
        <div class="map-grid" aria-hidden="true">
          <div v-for="n in 20" :key="n" class="map-line map-line--h" :style="{ top: `${n * 5}%` }" />
          <div v-for="n in 12" :key="n" class="map-line map-line--v" :style="{ left: `${n * 8.33}%` }" />
        </div>
        <div class="user-pin" aria-label="Ta position">
          <div class="pin-outer" />
          <div class="pin-inner" />
        </div>
        <p class="map-label">Carte interactive — à venir</p>
      </div>

      <!-- Overlay card quête -->
      <div class="quest-overlay">
        <p class="quest-name">Quête : {{ currentQuest.hint_text }}</p>
        <p class="quest-distance">À proximité · Suis les indices</p>
        <button class="btn-validate" :disabled="validating" @click="onValidate">
          {{ validating ? 'Validation…' : 'Valider la quête' }}
        </button>
      </div>
    </template>

    <!-- Vide -->
    <div v-else class="map-placeholder">
      <p class="state-error">Participation introuvable.</p>
    </div>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; height: 100dvh; background: var(--color-gray-bg); position: relative; overflow: hidden; }

/* AppBar flottante */
.appbar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--color-gray-border); }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); }
.list-btn { background: var(--color-gray-bg); border: 1px solid var(--color-gray-border); border-radius: var(--radius-full); width: 40px; height: 40px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }

/* Carte placeholder */
.map-placeholder { position: absolute; inset: 0; background: #d1d1d6; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.map-placeholder--loading { background: var(--color-gray-bg); }
.map-loading-text { color: var(--color-gray-text); font-size: var(--text-md); }
.map-label { position: absolute; bottom: 220px; font-size: var(--text-sm); color: rgba(0,0,0,0.4); }

/* Grille de rues simulée */
.map-grid { position: absolute; inset: 0; pointer-events: none; }
.map-line { position: absolute; background: rgba(255,255,255,0.5); }
.map-line--h { left: 0; right: 0; height: 1px; }
.map-line--v { top: 0; bottom: 0; width: 1px; }

/* Pin utilisateur */
.user-pin { position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); }
.pin-outer { width: 50px; height: 50px; border-radius: var(--radius-full); background: rgba(88, 86, 214, 0.2); position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.pin-inner { width: 28px; height: 28px; border-radius: var(--radius-full); background: var(--color-primary); box-shadow: var(--shadow-primary); position: relative; display: flex; align-items: center; justify-content: center; }
.pin-inner::after { content: ''; width: 12px; height: 12px; border-radius: var(--radius-full); background: #fff; }

/* Overlay card */
.quest-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; border-radius: 20px 20px 0 0; padding: var(--space-6); box-shadow: var(--shadow-overlay); display: flex; flex-direction: column; gap: var(--space-3); }
.quest-name { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-xl); color: var(--color-dark); }
.quest-distance { font-size: var(--text-md); color: var(--color-gray-text); }

.btn-validate { width: 100%; height: var(--height-btn); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); letter-spacing: var(--letter-spacing-label); cursor: pointer; transition: opacity 0.15s; }
.btn-validate:disabled { opacity: 0.5; cursor: not-allowed; }

.state-error { color: var(--color-error); font-size: var(--text-md); }
</style>
