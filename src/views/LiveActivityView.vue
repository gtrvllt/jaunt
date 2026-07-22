<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMissions, type MissionWithStatus } from '@/composables/useMissions'
import { useMaps } from '@/composables/useMaps'

const route = useRoute()
const router = useRouter()
const jauntId = route.params.id as string
const {
  missionsWithStatus,
  doneCount,
  groupProgress,
  participantCount,
  loading,
  error,
  busyMissionId,
  fetchAll,
  toggle,
  uploadPhoto,
  finish,
  subscribe,
} = useMissions(jauntId)

const { openInMaps } = useMaps()

const finishing = ref(false)
const confettiRoot = ref<HTMLElement | null>(null)

const allDone = computed(
  () => missionsWithStatus.value.length > 0 && doneCount.value === missionsWithStatus.value.length,
)
const progressPct = computed(() => Math.round(groupProgress.value * 100))

// Révélation séquentielle : seules les missions débloquées sont dévoilées,
// les suivantes restent verrouillées (compteur).
const visibleMissions = computed(() => missionsWithStatus.value.filter((m) => m.unlocked))
const lockedCount = computed(() => missionsWithStatus.value.length - visibleMissions.value.length)

const KIND_LABEL: Record<string, string> = {
  photo: '📷 Photo',
  icebreaker: '💬 Icebreaker',
  challenge: '⚡ Défi',
}

onMounted(() => {
  fetchAll()
  subscribe()
})

// Retour haptique + confettis à la validation d'une mission.
function celebrate() {
  if ('vibrate' in navigator) navigator.vibrate?.(30)
  burstConfetti()
}

function burstConfetti() {
  const root = confettiRoot.value
  if (!root) return
  const colors = ['#5856D6', '#32D74B', '#64D2FF', '#FF3B30', '#FFD60A']
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('span')
    piece.className = 'confetti-piece'
    piece.style.left = `${Math.random() * 100}%`
    piece.style.background = colors[i % colors.length] ?? '#5856D6'
    piece.style.animationDelay = `${Math.random() * 0.15}s`
    piece.style.transform = `rotate(${Math.random() * 360}deg)`
    root.appendChild(piece)
    setTimeout(() => piece.remove(), 1400)
  }
}

async function onToggle(mission: MissionWithStatus) {
  const wasDone = mission.completed
  await toggle(mission)
  if (!wasDone) celebrate()
}

async function onPhoto(mission: MissionWithStatus, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const wasDone = mission.completed
  await uploadPhoto(mission, file)
  input.value = ''
  if (!wasDone && !error.value) celebrate()
}

async function onFinish() {
  finishing.value = true
  const { error: err } = await finish()
  finishing.value = false
  if (!err) router.push({ name: 'jaunt-recap', params: { id: jauntId } })
}
</script>

<template>
  <div class="screen">
    <div ref="confettiRoot" class="confetti-root" aria-hidden="true" />

    <header class="appbar">
      <button class="appbar-logo" @click="router.push({ name: 'dashboard' })">JAUNT</button>
    </header>

    <main v-if="loading" class="content" aria-busy="true" aria-label="Chargement…">
      <div class="skeleton-block" />
      <div class="skeleton-block skeleton-block--short" />
      <div class="skeleton-block skeleton-block--short" />
    </main>

    <main v-else-if="error" class="content">
      <div class="state-card state-card--error" role="alert"><p>{{ error }}</p></div>
    </main>

    <main v-else-if="missionsWithStatus.length === 0" class="content">
      <div class="state-card"><p>Aucune mission pour cette Jaunt.</p></div>
    </main>

    <main v-else class="content">
      <!-- En-tête -->
      <div>
        <p class="board-label">MISSION BOARD</p>
        <h1 class="board-title">Vos défis du jour</h1>
        <p class="board-sub">Cochez les missions au fil de la balade. À vous de jouer !</p>
      </div>

      <!-- Progression groupe -->
      <div class="progress-panel">
        <div class="progress-head">
          <span class="progress-title">Progression du groupe</span>
          <span class="progress-pct">{{ progressPct }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPct}%` }" />
        </div>
        <p class="progress-meta">
          {{ doneCount }} / {{ missionsWithStatus.length }} de tes missions ·
          {{ participantCount }} aventurier{{ participantCount > 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Missions -->
      <div class="mission-list" role="list">
        <div
          v-for="mission in visibleMissions"
          :key="mission.id"
          class="mission-card"
          :class="{ 'mission-card--done': mission.completed }"
          role="listitem"
        >
          <button
            class="mission-check"
            :class="{ 'mission-check--done': mission.completed }"
            :disabled="busyMissionId === mission.id"
            :aria-pressed="mission.completed"
            :aria-label="mission.completed ? 'Marquer non fait' : 'Marquer comme fait'"
            @click="onToggle(mission)"
          >
            <span aria-hidden="true">{{ mission.completed ? '✓' : '' }}</span>
          </button>

          <div class="mission-body">
            <div class="mission-top">
              <span class="mission-kind">{{ KIND_LABEL[mission.kind] ?? mission.kind }}</span>
              <span v-if="mission.groupCount > 0" class="mission-group">
                {{ mission.groupCount }} ✓
              </span>
            </div>
            <!-- Objectif géographique de l'étape -->
            <div v-if="mission.location_lat != null && mission.location_lng != null" class="mission-geo">
              <span class="geo-pin" aria-hidden="true">📍</span>
              <span class="geo-text">
                {{ mission.location_address || `${mission.location_lat.toFixed(5)}, ${mission.location_lng.toFixed(5)}` }}
              </span>
              <button
                class="geo-btn"
                :aria-label="`Itinéraire vers l'étape ${mission.title}`"
                @click="openInMaps(mission.location_lat, mission.location_lng, mission.title)"
              >
                Itinéraire
              </button>
            </div>

            <p class="mission-name" :class="{ 'mission-name--done': mission.completed }">
              {{ mission.title }}
            </p>
            <p v-if="mission.description" class="mission-desc">{{ mission.description }}</p>

            <!-- Preuve photo -->
            <div v-if="mission.kind === 'photo'" class="mission-photo">
              <img v-if="mission.photo_url" :src="mission.photo_url" alt="Preuve photo" class="photo-thumb" />
              <label class="photo-btn" :for="`photo-${mission.id}`">
                <span aria-hidden="true">📸</span>
                {{ mission.photo_url ? 'Changer la photo' : 'Ajouter une photo' }}
              </label>
              <input
                :id="`photo-${mission.id}`"
                class="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                :disabled="busyMissionId === mission.id"
                @change="onPhoto(mission, $event)"
              />
            </div>
          </div>
        </div>

        <!-- Missions verrouillées -->
        <div v-if="lockedCount > 0" class="locked-card" role="listitem" aria-label="Missions verrouillées">
          <span class="locked-icon" aria-hidden="true">🔒</span>
          <p class="locked-text">
            {{ lockedCount }} mission{{ lockedCount > 1 ? 's' : '' }} à débloquer —
            complétez la mission en cours pour révéler la suite !
          </p>
        </div>
      </div>

      <!-- Célébration finale -->
      <div v-if="allDone" class="all-done" role="status">
        <span aria-hidden="true">🎉</span>
        <p>Toutes tes missions sont validées, bravo !</p>
      </div>
    </main>

    <footer v-if="!loading && missionsWithStatus.length > 0" class="footer">
      <button class="btn-finish" :disabled="finishing" @click="onFinish">
        {{ finishing ? 'Clôture…' : allDone ? 'Terminer la Jaunt 🚀' : 'Terminer la Jaunt' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; position: relative; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto; }

/* En-tête */
.board-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-primary); margin-bottom: var(--space-2); }
.board-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; }
.board-sub { font-size: var(--text-base); color: var(--color-gray-text); margin-top: var(--space-2); }

/* Progression */
.progress-panel { background: var(--color-dark); border-radius: var(--radius-md); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
.progress-head { display: flex; align-items: baseline; justify-content: space-between; }
.progress-title { font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: #fff; }
.progress-pct { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-2xl); color: #fff; }
.progress-bar { height: 8px; background: rgba(255,255,255,0.2); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-success); border-radius: var(--radius-full); transition: width 0.5s ease; }
.progress-meta { font-size: var(--text-sm); color: rgba(255,255,255,0.7); }

/* Missions */
.mission-list { display: flex; flex-direction: column; gap: var(--space-3); }
.mission-card { display: flex; gap: var(--space-4); background: var(--color-gray-bg); border: 2px solid transparent; border-radius: var(--radius-md); padding: var(--space-4); transition: border-color 0.15s, background 0.15s; }
.mission-card--done { background: #f0fdf4; border-color: var(--color-success); }

.mission-check { flex-shrink: 0; width: 32px; height: 32px; border-radius: var(--radius-full); border: 2px solid var(--color-gray-border); background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: var(--text-lg); font-weight: var(--font-weight-bold); color: #fff; transition: background 0.15s, border-color 0.15s; }
.mission-check--done { background: var(--color-success); border-color: var(--color-success); }
.mission-check:disabled { opacity: 0.5; cursor: wait; }

.mission-body { flex: 1; min-width: 0; }
.mission-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-1); }
.mission-kind { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-primary); }
.mission-group { font-size: var(--text-xs); font-weight: var(--font-weight-bold); color: var(--color-success); }
/* Objectif géographique */
.mission-geo { display: flex; align-items: center; gap: var(--space-2); background: #fff; border: 1.5px solid var(--color-primary); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); margin-bottom: var(--space-2); }
.geo-pin { font-size: 14px; flex-shrink: 0; }
.geo-text { flex: 1; min-width: 0; font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-primary); }
.geo-btn { flex-shrink: 0; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-full); padding: 4px var(--space-3); font-family: var(--font-body); font-size: var(--text-xs); font-weight: var(--font-weight-bold); cursor: pointer; }
.geo-btn:hover { opacity: 0.9; }

.mission-name { font-size: var(--text-md); font-weight: var(--font-weight-semibold); color: var(--color-dark); line-height: var(--line-height-base); }
.mission-name--done { text-decoration: line-through; color: var(--color-gray-text); }
.mission-desc { font-size: var(--text-sm); color: var(--color-gray-text); margin-top: 2px; line-height: var(--line-height-base); }

/* Photo */
.mission-photo { margin-top: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2); }
.photo-thumb { width: 100%; max-height: 180px; object-fit: cover; border-radius: var(--radius-sm); }
.photo-btn { display: inline-flex; align-items: center; gap: var(--space-2); align-self: flex-start; padding: var(--space-2) var(--space-4); background: #fff; border: 1.5px solid var(--color-gray-border); border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-dark); cursor: pointer; }
.photo-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.photo-input { display: none; }

/* Missions verrouillées */
.locked-card { display: flex; align-items: center; gap: var(--space-3); border: 1.5px dashed var(--color-gray-border); border-radius: var(--radius-md); padding: var(--space-4); opacity: 0.8; }
.locked-icon { font-size: 20px; }
.locked-text { font-size: var(--text-sm); color: var(--color-gray-text); line-height: var(--line-height-base); }

/* Célébration */
.all-done { display: flex; align-items: center; gap: var(--space-3); background: #f0fdf4; border: 1.5px solid var(--color-success); border-radius: var(--radius-md); padding: var(--space-4) var(--space-5); font-size: var(--text-base); font-weight: var(--font-weight-semibold); color: #166534; }
.all-done span { font-size: 24px; }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); border-top: 1px solid var(--color-gray-border); }
.btn-finish { width: 100%; height: var(--height-btn); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); cursor: pointer; box-shadow: var(--shadow-primary); transition: opacity 0.15s; }
.btn-finish:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-finish:not(:disabled):hover { opacity: 0.9; }

/* States */
.state-card { background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-6); text-align: center; color: var(--color-gray-text); font-size: var(--text-md); }
.state-card--error { background: #fff0ef; color: var(--color-error); }
.skeleton-block { height: 90px; background: var(--color-gray-bg); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-block--short { height: 72px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Confettis (conteneur) */
.confetti-root { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 50; }
</style>

<!-- Styles globaux : les confettis sont injectés dynamiquement (hors scope). -->
<style>
.confetti-piece {
  position: absolute;
  top: -12px;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  animation: confetti-fall 1.3s ease-in forwards;
}
@keyframes confetti-fall {
  0% { top: -12px; opacity: 1; }
  100% { top: 100vh; opacity: 0.9; }
}
</style>
