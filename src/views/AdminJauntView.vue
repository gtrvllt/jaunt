<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminJaunt, type MissionDraft } from '@/composables/useAdminJaunt'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'

const router = useRouter()
const { themes, loading, saving, error, fetchThemes, createThemeWithMissions, spawnTestJaunt } =
  useAdminJaunt()

const theme = reactive({
  title: '',
  description: '',
  difficulty: '2',
  image_url: '',
  meeting_address: '',
  meeting_lat: '',
  meeting_lng: '',
  meeting_landmark_url: '',
})

function emptyMission(): MissionDraft {
  return { title: '', description: '', kind: 'photo', solution: '' }
}
const missions = ref<MissionDraft[]>([emptyMission()])
const feedback = ref<string | null>(null)

function addMission() {
  missions.value.push(emptyMission())
}
function removeMission(i: number) {
  missions.value.splice(i, 1)
}

async function onCreate() {
  feedback.value = null
  const id = await createThemeWithMissions(
    {
      title: theme.title.trim(),
      description: theme.description.trim(),
      difficulty: Number(theme.difficulty),
      image_url: theme.image_url.trim(),
      meeting_address: theme.meeting_address.trim(),
      meeting_lat: theme.meeting_lat ? Number(theme.meeting_lat) : null,
      meeting_lng: theme.meeting_lng ? Number(theme.meeting_lng) : null,
      meeting_landmark_url: theme.meeting_landmark_url.trim(),
    },
    missions.value.filter((m) => m.title.trim()),
  )
  if (!id) return
  feedback.value = `Thème « ${theme.title} » créé ✓`
  Object.assign(theme, {
    title: '', description: '', difficulty: '2', image_url: '',
    meeting_address: '', meeting_lat: '', meeting_lng: '', meeting_landmark_url: '',
  })
  missions.value = [emptyMission()]
  await fetchThemes()
}

async function onSpawn(themeId: string) {
  const jauntId = await spawnTestJaunt(themeId)
  if (jauntId) router.push({ name: 'jaunt-before', params: { id: jauntId } })
}

const canCreate = () => theme.title.trim().length > 0 && missions.value.some((m) => m.title.trim())

onMounted(fetchThemes)
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="router.push({ name: 'dashboard' })">JAUNT</button>
      <BaseBadge variant="warning">ADMIN</BaseBadge>
    </header>

    <main class="content">
      <!-- Thèmes existants -->
      <section aria-label="Thèmes existants">
        <h2 class="section-title">THÈMES ({{ themes.length }})</h2>
        <div v-if="loading" class="muted">Chargement…</div>
        <div v-else-if="themes.length === 0" class="muted">Aucun thème pour l'instant.</div>
        <div v-else class="theme-list">
          <div v-for="t in themes" :key="t.id" class="theme-row">
            <div class="theme-info">
              <p class="theme-name">{{ t.title }}</p>
              <p class="theme-meta">
                Difficulté {{ t.difficulty }} · {{ t.mission_count }} mission{{ t.mission_count > 1 ? 's' : '' }}
              </p>
            </div>
            <BaseButton variant="secondary" size="sm" :disabled="saving" @click="onSpawn(t.id)">
              Spawner un test
            </BaseButton>
          </div>
        </div>
      </section>

      <div class="divider" />

      <!-- Création -->
      <section aria-label="Créer un thème">
        <h2 class="section-title">CRÉER UNE JAUNT</h2>

        <div class="field-group">
          <label class="lbl">Titre</label>
          <BaseInput v-model="theme.title" placeholder="Secrets de Montmartre" />
        </div>

        <div class="field-group">
          <label class="lbl">Description</label>
          <textarea v-model="theme.description" class="textarea" rows="2" placeholder="Remonte le temps dans les ruelles oubliées…" />
        </div>

        <div class="field-group">
          <label class="lbl">Difficulté</label>
          <select v-model="theme.difficulty" class="select">
            <option v-for="n in 5" :key="n" :value="String(n)">{{ n }}</option>
          </select>
        </div>

        <div class="field-group">
          <label class="lbl">Image d'ambiance (URL)</label>
          <BaseInput v-model="theme.image_url" type="url" placeholder="https://…" />
        </div>

        <h3 class="subsection">Point de rendez-vous</h3>
        <div class="field-group">
          <label class="lbl">Adresse exacte</label>
          <BaseInput v-model="theme.meeting_address" placeholder="18 Rue des Abbesses, 75018…" />
        </div>
        <div class="row-2">
          <div class="field-group">
            <label class="lbl">Latitude</label>
            <BaseInput v-model="theme.meeting_lat" inputmode="numeric" placeholder="48.884108" />
          </div>
          <div class="field-group">
            <label class="lbl">Longitude</label>
            <BaseInput v-model="theme.meeting_lng" inputmode="numeric" placeholder="2.338060" />
          </div>
        </div>
        <div class="field-group">
          <label class="lbl">Photo repère (URL)</label>
          <BaseInput v-model="theme.meeting_landmark_url" type="url" placeholder="https://…" />
        </div>

        <!-- Missions -->
        <div class="missions-head">
          <h3 class="subsection">Missions</h3>
          <BaseButton variant="ghost" size="sm" @click="addMission">+ Ajouter</BaseButton>
        </div>

        <div v-for="(m, i) in missions" :key="i" class="mission-card">
          <div class="mission-card-head">
            <span class="mission-num">Étape {{ i + 1 }}</span>
            <button v-if="missions.length > 1" class="remove-btn" aria-label="Retirer" @click="removeMission(i)">✕</button>
          </div>
          <BaseInput v-model="m.title" placeholder="Titre de la mission" />
          <textarea v-model="m.description" class="textarea" rows="2" placeholder="Consigne / énigme…" />
          <select v-model="m.kind" class="select">
            <option value="photo">📷 Photo</option>
            <option value="icebreaker">💬 Icebreaker</option>
            <option value="challenge">⚡ Défi</option>
          </select>
          <textarea v-model="m.solution" class="textarea" rows="2" placeholder="Solution / indice de secours (dévoilé au vote) — ex. adresse exacte du bâtiment" />
        </div>

        <p v-if="error" class="state-error" role="alert">{{ error }}</p>
        <p v-if="feedback" class="state-ok" role="status">{{ feedback }}</p>

        <BaseButton
          variant="primary"
          block
          :loading="saving"
          :disabled="!canCreate()"
          @click="onCreate"
        >
          Créer le thème
        </BaseButton>
      </section>
    </main>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto; }

.section-title { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); margin-bottom: var(--space-3); }
.subsection { font-size: var(--text-sm); font-weight: var(--font-weight-bold); color: var(--color-dark); margin: var(--space-4) 0 var(--space-2); }
.muted { font-size: var(--text-base); color: var(--color-gray-text); font-style: italic; }
.divider { height: 1px; background: var(--color-gray-border); }

/* Liste thèmes */
.theme-list { display: flex; flex-direction: column; gap: var(--space-2); }
.theme-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); }
.theme-name { font-size: var(--text-base); font-weight: var(--font-weight-semibold); color: var(--color-dark); }
.theme-meta { font-size: var(--text-sm); color: var(--color-gray-text); margin-top: 2px; }

/* Formulaire */
.field-group { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); }
.row-2 { display: flex; gap: var(--space-3); }
.row-2 .field-group { flex: 1; }
.lbl { font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-dark); }
.textarea, .select { width: 100%; border: 1.5px solid var(--color-gray-border); border-radius: var(--radius-xl); padding: var(--space-3) var(--space-5); font-family: var(--font-body); font-size: var(--text-md); color: var(--color-dark); background: var(--color-gray-bg); outline: none; box-sizing: border-box; transition: border-color 0.15s, background 0.15s; }
.textarea { resize: vertical; }
.textarea:focus, .select:focus { border-color: var(--color-primary); background: #fff; }
.select { height: var(--height-input); }

/* Missions */
.missions-head { display: flex; align-items: center; justify-content: space-between; }
.mission-card { display: flex; flex-direction: column; gap: var(--space-2); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-3); }
.mission-card-head { display: flex; align-items: center; justify-content: space-between; }
.mission-num { font-size: var(--text-xs); font-weight: var(--font-weight-bold); letter-spacing: var(--letter-spacing-label); color: var(--color-primary); }
.remove-btn { background: none; border: none; color: var(--color-gray-text); font-size: 14px; cursor: pointer; }
.mission-card .textarea, .mission-card .select { background: #fff; }

.state-error { background: #fff0ef; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); color: var(--color-error); font-size: var(--text-sm); }
.state-ok { background: #f0fdf4; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); color: #166534; font-size: var(--text-sm); font-weight: var(--font-weight-semibold); }
</style>
