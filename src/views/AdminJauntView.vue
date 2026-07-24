<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminJaunt, type MissionDraft, type ThemeWithCount } from '@/composables/useAdminJaunt'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'

const router = useRouter()
const auth = useAuthStore()
const {
  themes, profiles, loading, saving, error,
  fetchThemes, fetchThemeMissions, saveThemeWithMissions,
  fetchProfiles, createTestProfiles, createJauntInstance,
} = useAdminJaunt()

// ── Éditeur de thème ────────────────────────────────────────────────
function emptyMission(): MissionDraft {
  return {
    title: '', description: '', kind: 'photo', solution: '',
    location_address: '', location_lat: '', location_lng: '',
  }
}

const editing = ref<{ themeId: string | null } | null>(null)
const form = reactive({
  title: '', description: '', difficulty: '2', image_url: '',
  meeting_address: '', meeting_lat: '', meeting_lng: '', meeting_landmark_url: '',
})
const missions = ref<MissionDraft[]>([])
const removedIds = ref<string[]>([])

function resetForm() {
  Object.assign(form, {
    title: '', description: '', difficulty: '2', image_url: '',
    meeting_address: '', meeting_lat: '', meeting_lng: '', meeting_landmark_url: '',
  })
  missions.value = [emptyMission()]
  removedIds.value = []
}

function openNew() {
  resetForm()
  editing.value = { themeId: null }
}

async function openEdit(t: ThemeWithCount) {
  Object.assign(form, {
    title: t.title, description: t.description ?? '', difficulty: String(t.difficulty),
    image_url: t.image_url ?? '', meeting_address: t.meeting_address ?? '',
    meeting_lat: t.meeting_lat != null ? String(t.meeting_lat) : '',
    meeting_lng: t.meeting_lng != null ? String(t.meeting_lng) : '',
    meeting_landmark_url: t.meeting_landmark_url ?? '',
  })
  removedIds.value = []
  missions.value = await fetchThemeMissions(t.id)
  if (missions.value.length === 0) missions.value = [emptyMission()]
  editing.value = { themeId: t.id }
}

function addMission() {
  missions.value.push(emptyMission())
}
function removeMission(i: number) {
  const m = missions.value[i]
  if (m?.id) removedIds.value.push(m.id)
  missions.value.splice(i, 1)
}

async function saveTheme() {
  const ok = await saveThemeWithMissions(
    editing.value!.themeId,
    {
      title: form.title.trim(), description: form.description.trim(),
      difficulty: Number(form.difficulty), image_url: form.image_url.trim(),
      meeting_address: form.meeting_address.trim(),
      meeting_lat: form.meeting_lat ? Number(form.meeting_lat) : null,
      meeting_lng: form.meeting_lng ? Number(form.meeting_lng) : null,
      meeting_landmark_url: form.meeting_landmark_url.trim(),
    },
    missions.value,
    removedIds.value,
  )
  if (ok) editing.value = null
}

// ── Instanciation de jaunt ──────────────────────────────────────────
const inst = reactive({ themeId: '', scheduledAt: '' })
const selected = ref<string[]>([])
const instFeedback = ref<string | null>(null)

function toggleProfile(id: string) {
  const i = selected.value.indexOf(id)
  if (i >= 0) selected.value.splice(i, 1)
  else if (selected.value.length < 4) selected.value.push(id)
}

async function onCreateInstance() {
  instFeedback.value = null
  const jauntId = await createJauntInstance({
    themeId: inst.themeId,
    profileIds: selected.value,
    scheduledAt: inst.scheduledAt ? new Date(inst.scheduledAt).toISOString() : new Date().toISOString(),
  })
  if (!jauntId) return
  // Si l'admin s'est assigné, on peut ouvrir la jaunt directement.
  if (auth.profile && selected.value.includes(auth.profile.id)) {
    router.push({ name: 'jaunt-before', params: { id: jauntId } })
    return
  }
  instFeedback.value = 'Jaunt créée ✓'
  inst.themeId = ''
  inst.scheduledAt = ''
  selected.value = []
}

const canInstance = computed(() => inst.themeId && selected.value.length > 0)

onMounted(() => { fetchThemes(); fetchProfiles() })
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="router.push({ name: 'dashboard' })">JAUNT</button>
      <BaseBadge variant="warning">ADMIN</BaseBadge>
    </header>

    <main class="content">
      <p v-if="error" class="state-error" role="alert">{{ error }}</p>

      <!-- ══ SECTION 1 : THÈMES ══ -->
      <section aria-label="Jaunt themes">
        <div class="section-head">
          <h2 class="section-title">JAUNT THEMES</h2>
          <BaseButton variant="secondary" size="sm" @click="openNew">＋ Nouveau</BaseButton>
        </div>

        <div v-if="loading" class="muted">Chargement…</div>
        <div v-else-if="themes.length === 0" class="muted">Aucun thème.</div>
        <div v-else class="theme-list">
          <div v-for="t in themes" :key="t.id" class="theme-row">
            <div>
              <p class="theme-name">{{ t.title }}</p>
              <p class="theme-meta">Difficulté {{ t.difficulty }} · {{ t.mission_count }} mission{{ t.mission_count > 1 ? 's' : '' }}</p>
            </div>
            <BaseButton variant="ghost" size="sm" @click="openEdit(t)">Éditer</BaseButton>
          </div>
        </div>

        <!-- Éditeur inline -->
        <div v-if="editing" class="editor">
          <h3 class="editor-title">{{ editing.themeId ? 'Éditer le thème' : 'Nouveau thème' }}</h3>

          <label class="lbl">Titre</label>
          <BaseInput v-model="form.title" placeholder="Secrets de Montmartre" />
          <label class="lbl">Description</label>
          <textarea v-model="form.description" class="ta" rows="2" />
          <label class="lbl">Difficulté</label>
          <select v-model="form.difficulty" class="sel">
            <option v-for="n in 5" :key="n" :value="String(n)">{{ n }}</option>
          </select>
          <label class="lbl">Image d'ambiance (URL)</label>
          <BaseInput v-model="form.image_url" type="url" placeholder="https://…" />

          <p class="sub">Point de rendez-vous</p>
          <label class="lbl">Adresse</label>
          <BaseInput v-model="form.meeting_address" placeholder="18 Rue des Abbesses…" />
          <div class="row2">
            <div><label class="lbl">Latitude</label><BaseInput v-model="form.meeting_lat" inputmode="numeric" placeholder="48.884108" /></div>
            <div><label class="lbl">Longitude</label><BaseInput v-model="form.meeting_lng" inputmode="numeric" placeholder="2.338060" /></div>
          </div>
          <label class="lbl">Photo repère (URL)</label>
          <BaseInput v-model="form.meeting_landmark_url" type="url" placeholder="https://…" />

          <div class="sub-head">
            <p class="sub">Missions</p>
            <BaseButton variant="ghost" size="sm" @click="addMission">+ Ajouter</BaseButton>
          </div>
          <div v-for="(m, i) in missions" :key="i" class="mcard">
            <div class="mcard-head">
              <span class="mnum">Étape {{ i + 1 }}</span>
              <button v-if="missions.length > 1" class="rm" aria-label="Retirer" @click="removeMission(i)">✕</button>
            </div>
            <BaseInput v-model="m.title" placeholder="Titre de la mission" />
            <textarea v-model="m.description" class="ta" rows="2" placeholder="Consigne / énigme…" />
            <select v-model="m.kind" class="sel">
              <option value="photo">📷 Photo</option>
              <option value="icebreaker">💬 Icebreaker</option>
              <option value="challenge">⚡ Défi</option>
            </select>
            <BaseInput v-model="m.location_address" placeholder="Lieu de l'étape (adresse) — le secret à trouver" />
            <div class="row2">
              <BaseInput v-model="m.location_lat" inputmode="numeric" placeholder="Lat (48.8846)" />
              <BaseInput v-model="m.location_lng" inputmode="numeric" placeholder="Lng (2.3380)" />
            </div>
            <textarea v-model="m.solution" class="ta" rows="2" placeholder="Solution / indice de secours (dévoilé au vote)" />
          </div>

          <div class="editor-actions">
            <BaseButton variant="ghost" @click="editing = null">Annuler</BaseButton>
            <BaseButton variant="primary" :loading="saving" :disabled="!form.title.trim()" @click="saveTheme">
              Enregistrer
            </BaseButton>
          </div>
        </div>
      </section>

      <div class="divider" />

      <!-- ══ SECTION 2 : NOUVELLE JAUNT ══ -->
      <section aria-label="Nouvelle jaunt">
        <h2 class="section-title">NOUVELLE JAUNT</h2>

        <label class="lbl">Thème</label>
        <select v-model="inst.themeId" class="sel">
          <option value="" disabled>Choisir un thème…</option>
          <option v-for="t in themes" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>

        <div class="sub-head">
          <label class="lbl">Participants ({{ selected.length }}/4)</label>
          <BaseButton variant="ghost" size="sm" :loading="saving" @click="createTestProfiles(3)">
            + Profils de test
          </BaseButton>
        </div>
        <div v-if="profiles.length === 0" class="muted">Aucun profil. Génère des profils de test.</div>
        <div v-else class="profile-list">
          <button
            v-for="p in profiles"
            :key="p.id"
            class="profile-chip"
            :class="{ 'profile-chip--on': selected.includes(p.id) }"
            :disabled="!selected.includes(p.id) && selected.length >= 4"
            @click="toggleProfile(p.id)"
          >
            <span class="chip-check">{{ selected.includes(p.id) ? '✓' : '' }}</span>
            {{ p.nickname }}
          </button>
        </div>

        <label class="lbl">Date / heure (vide = maintenant)</label>
        <input v-model="inst.scheduledAt" type="datetime-local" class="sel" />

        <p v-if="instFeedback" class="state-ok" role="status">{{ instFeedback }}</p>

        <BaseButton variant="primary" block :loading="saving" :disabled="!canInstance" @click="onCreateInstance">
          Créer la jaunt
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

.section-head, .sub-head { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); }
.sub { font-size: var(--text-sm); font-weight: var(--font-weight-bold); color: var(--color-dark); margin-top: var(--space-3); }
.muted { font-size: var(--text-base); color: var(--color-gray-text); font-style: italic; margin-top: var(--space-2); }
.divider { height: 1px; background: var(--color-gray-border); }
.lbl { display: block; font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-dark); margin: var(--space-3) 0 var(--space-2); }

/* Liste thèmes */
.theme-list { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); }
.theme-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); }
.theme-name { font-size: var(--text-base); font-weight: var(--font-weight-semibold); color: var(--color-dark); }
.theme-meta { font-size: var(--text-sm); color: var(--color-gray-text); margin-top: 2px; }

/* Éditeur */
.editor { margin-top: var(--space-4); padding: var(--space-4); border: 1.5px solid var(--color-primary); border-radius: var(--radius-md); }
.editor-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); color: var(--color-dark); }
.editor-actions { display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-4); }

.ta, .sel { width: 100%; border: 1.5px solid var(--color-gray-border); border-radius: var(--radius-xl); padding: var(--space-3) var(--space-5); font-family: var(--font-body); font-size: var(--text-md); color: var(--color-dark); background: var(--color-gray-bg); outline: none; box-sizing: border-box; }
.ta { resize: vertical; }
.ta:focus, .sel:focus { border-color: var(--color-primary); background: #fff; }
.sel { height: var(--height-input); }
.row2 { display: flex; gap: var(--space-3); }
.row2 > div { flex: 1; }

/* Missions */
.mcard { display: flex; flex-direction: column; gap: var(--space-2); background: var(--color-gray-bg); border-radius: var(--radius-md); padding: var(--space-3); margin-top: var(--space-2); }
.mcard-head { display: flex; align-items: center; justify-content: space-between; }
.mnum { font-size: var(--text-xs); font-weight: var(--font-weight-bold); letter-spacing: var(--letter-spacing-label); color: var(--color-primary); }
.rm { background: none; border: none; color: var(--color-gray-text); font-size: 14px; cursor: pointer; }
.mcard .ta, .mcard .sel { background: #fff; }

/* Participants */
.profile-list { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); }
.profile-chip { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-full); border: 1.5px solid var(--color-gray-border); background: #fff; font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-dark); cursor: pointer; }
.profile-chip--on { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary); }
.profile-chip:disabled { opacity: 0.4; cursor: not-allowed; }
.chip-check { font-size: var(--text-xs); width: 10px; }

.state-error { background: #fff0ef; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); color: var(--color-error); font-size: var(--text-sm); }
.state-ok { background: #f0fdf4; border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); color: #166534; font-size: var(--text-sm); font-weight: var(--font-weight-semibold); margin-top: var(--space-3); }
</style>
