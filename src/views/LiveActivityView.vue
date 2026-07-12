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
  const idx = participation.value.current_quest_index
  return participation.value.jaunt.quests[idx] ?? null
})

const progressLabel = computed(() => {
  if (!participation.value) return ''
  const total = participation.value.jaunt.quests.length
  return `${participation.value.current_quest_index + 1} / ${total}`
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
    <header class="appbar">
      <span class="appbar-logo">JAUNT</span>
      <button
        class="map-btn"
        aria-label="Voir la carte"
        @click="router.push({ name: 'jaunt-map', params: { id: jauntId } })"
      >
        🗺
      </button>
    </header>

    <main v-if="loading" class="content" aria-busy="true" aria-label="Chargement…">
      <div class="skeleton-block" />
      <div class="skeleton-block skeleton-block--short" />
    </main>

    <main v-else-if="error" class="content">
      <div class="state-card state-card--error" role="alert"><p>{{ error }}</p></div>
    </main>

    <main v-else-if="!participation || !currentQuest" class="content">
      <div class="state-card"><p>Quête introuvable.</p></div>
    </main>

    <main v-else class="content">
      <!-- Progression -->
      <div class="progress-row">
        <span class="progress-label">Quête {{ progressLabel }}</span>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${((participation.current_quest_index + 1) / participation.jaunt.quests.length) * 100}%` }"
          />
        </div>
      </div>

      <!-- Indice visuel -->
      <div class="visual-hint">
        <img
          v-if="currentQuest.hint_visual_url"
          :src="currentQuest.hint_visual_url"
          alt="Indice visuel de la quête"
          class="hint-img"
        />
        <div v-else class="hint-placeholder">
          <span aria-hidden="true">🖼</span>
          <p>Photo indice</p>
        </div>
      </div>

      <!-- Direction -->
      <div class="direction-card">
        <div class="direction-header">
          <span class="direction-label">DIRECTION</span>
          <span class="direction-icon" aria-hidden="true">↗</span>
        </div>
        <p class="direction-text">Suis les indices et explore les alentours</p>
      </div>

      <!-- Liste des quêtes -->
      <div class="quests-list" role="list" aria-label="Quêtes de la jaunt">
        <div
          v-for="(quest, idx) in participation.jaunt.quests"
          :key="quest.id"
          class="quest-item"
          :class="{
            'quest-item--done': idx < participation.current_quest_index,
            'quest-item--active': idx === participation.current_quest_index,
          }"
          role="listitem"
        >
          <span class="quest-check" aria-hidden="true">
            {{ idx < participation.current_quest_index ? '✓' : idx === participation.current_quest_index ? '●' : '○' }}
          </span>
          <span class="quest-hint">{{ quest.hint_text }}</span>
        </div>
      </div>
    </main>

    <footer v-if="participation && currentQuest" class="footer">
      <button class="btn-validate" :disabled="validating" @click="onValidate">
        {{ validating ? 'Validation…' : 'VALIDATE STEP' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); }
.map-btn { background: var(--color-gray-bg); border: 1px solid var(--color-gray-border); border-radius: var(--radius-full); width: 40px; height: 40px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto; }

/* Progression */
.progress-row { display: flex; flex-direction: column; gap: var(--space-2); }
.progress-label { font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-gray-text); letter-spacing: var(--letter-spacing-label); }
.progress-bar { height: 4px; background: var(--color-gray-border); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.4s ease; }

/* Indice visuel */
.visual-hint { border-radius: var(--radius-md); overflow: hidden; background: var(--color-gray-bg); aspect-ratio: 16/9; }
.hint-img { width: 100%; height: 100%; object-fit: cover; }
.hint-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); color: var(--color-gray-text); font-size: var(--text-sm); }
.hint-placeholder span { font-size: 32px; }

/* Direction */
.direction-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-4); }
.direction-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1); }
.direction-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); }
.direction-icon { font-size: 20px; color: var(--color-primary); }
.direction-text { font-size: var(--text-base); color: var(--color-dark); }

/* Quêtes */
.quests-list { display: flex; flex-direction: column; gap: var(--space-3); }
.quest-item { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-gray-bg); }
.quest-item--active { background: var(--color-primary-light); }
.quest-item--done { opacity: 0.5; }
.quest-check { font-size: var(--text-lg); color: var(--color-primary); flex-shrink: 0; width: 20px; text-align: center; }
.quest-item--done .quest-check { color: var(--color-success); }
.quest-hint { font-size: var(--text-base); color: var(--color-dark); line-height: var(--line-height-base); }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); border-top: 1px solid var(--color-gray-border); }
.btn-validate { width: 100%; height: var(--height-btn); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); letter-spacing: var(--letter-spacing-label); cursor: pointer; transition: opacity 0.15s; }
.btn-validate:disabled { opacity: 0.5; cursor: not-allowed; }

.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.skeleton-block { height: 120px; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-block--short { height: 72px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
