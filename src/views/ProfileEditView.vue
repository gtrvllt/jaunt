<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import { useTrack } from '@/composables/useTrack'

const router = useRouter()
const auth = useAuthStore()
const profileStore = useProfileStore()
const { track } = useTrack()

const nickname = ref('')
const selectedIds = ref<Set<string>>(new Set())
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const uploadingAvatar = ref(false)
const error = ref<string | null>(null)
const toastVisible = ref(false)
const avatarPreview = ref<string | null>(null)

onMounted(async () => {
  if (!auth.session || !auth.profile) return
  nickname.value = auth.profile.nickname ?? ''
  avatarPreview.value = auth.profile.avatar_url ?? null
  loading.value = true
  await Promise.all([
    profileStore.fetchAllInterests(),
    profileStore.fetchSelectedInterests(auth.session.user.id),
  ])
  loading.value = false
  selectedIds.value = new Set(profileStore.selectedInterestIds)
})

function toggle(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function filteredInterests() {
  const q = search.value.trim().toLowerCase()
  return profileStore.interests.filter((i) =>
    !q || i.name.toLowerCase().includes(q),
  )
}

async function onAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !auth.session) return
  if (file.size > 2 * 1024 * 1024) { error.value = 'Image trop grande (max 2 Mo)'; return }

  uploadingAvatar.value = true
  error.value = null
  const ext = file.name.split('.').pop()
  const path = `${auth.session.user.id}/avatar.${ext}`

  const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (upErr) { error.value = upErr.message; uploadingAvatar.value = false; return }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = data.publicUrl + `?t=${Date.now()}`
  await profileStore.updateProfile({ avatar_url: url })
  avatarPreview.value = url
  uploadingAvatar.value = false
}

async function save() {
  if (!auth.session || !auth.profile) return
  saving.value = true
  error.value = null

  await Promise.all([
    profileStore.updateProfile({ nickname: nickname.value }),
    profileStore.saveInterests(auth.session.user.id, [...selectedIds.value]),
  ])

  saving.value = false
  await track('profile_updated')
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
    router.push({ name: 'profile' })
  }, 1800)
}
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button
        class="back-btn"
        aria-label="Retour"
        @click="router.push({ name: 'profile' })"
      >
        ←
      </button>
      <span class="appbar-title">Edit Profile</span>
      <div class="appbar-placeholder" aria-hidden="true" />
    </header>

    <main class="content">
      <!-- Avatar -->
      <div class="avatar-section">
        <label class="avatar-wrap" for="avatar-input" :aria-busy="uploadingAvatar">
          <div class="avatar-img" :class="{ 'avatar-img--loading': uploadingAvatar }">
            <img v-if="avatarPreview" :src="avatarPreview" alt="Photo de profil" class="avatar-photo" />
            <span v-else class="avatar-placeholder" aria-hidden="true">👤</span>
          </div>
          <span class="avatar-badge" aria-hidden="true">{{ uploadingAvatar ? '…' : '✎' }}</span>
        </label>
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          class="avatar-input"
          :disabled="uploadingAvatar"
          @change="onAvatarChange"
        />
        <p class="avatar-hint">Appuie sur la photo pour la modifier</p>
      </div>

      <!-- Nickname -->
      <div class="field">
        <label class="field-label" for="nickname">Nickname</label>
        <input
          id="nickname"
          v-model="nickname"
          class="input"
          type="text"
          placeholder="Ton pseudo"
          maxlength="32"
          autocomplete="username"
        />
      </div>

      <!-- Intérêts -->
      <div class="field">
        <label class="field-label" for="interest-search">Interests</label>
        <input
          id="interest-search"
          v-model="search"
          class="input"
          type="search"
          placeholder="Rechercher…"
          autocomplete="off"
        />
      </div>

      <div v-if="loading" class="pills-skeleton">
        <div v-for="n in 6" :key="n" class="pill-skeleton" />
      </div>

      <div v-else class="pills" role="group" aria-label="Intérêts disponibles">
        <button
          v-for="interest in filteredInterests()"
          :key="interest.id"
          class="pill"
          :class="{ 'pill--selected': selectedIds.has(interest.id) }"
          :aria-pressed="selectedIds.has(interest.id)"
          type="button"
          @click="toggle(interest.id)"
        >
          {{ interest.name }}
        </button>
      </div>

      <p v-if="error" class="error-text" role="alert">{{ error }}</p>
    </main>

    <footer class="footer">
      <button
        class="btn-cancel"
        type="button"
        @click="router.push({ name: 'profile' })"
      >
        Cancel
      </button>
      <button
        class="btn-save"
        type="button"
        :disabled="saving || !nickname.trim()"
        @click="save"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </footer>

    <!-- Toast confirmation -->
    <Transition name="toast">
      <div v-if="toastVisible" class="toast" role="status" aria-live="polite">
        Profile updated ✓
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; position: relative; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.back-btn { background: none; border: none; font-size: var(--text-2xl); color: var(--color-dark); cursor: pointer; padding: var(--space-2); margin-left: calc(-1 * var(--space-2)); display: flex; align-items: center; }
.appbar-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); color: var(--color-dark); }
.appbar-placeholder { width: 40px; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); overflow-y: auto; }

/* Avatar */
.avatar-section { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
.avatar-wrap { position: relative; cursor: pointer; display: inline-block; }
.avatar-img { width: 88px; height: 88px; border-radius: var(--radius-full); background: var(--color-gray-bg); border: 2px solid var(--color-gray-border); overflow: hidden; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s; }
.avatar-img--loading { opacity: 0.5; }
.avatar-photo { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { font-size: 36px; }
.avatar-badge { position: absolute; bottom: 2px; right: 2px; width: 24px; height: 24px; background: var(--color-primary); color: #fff; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-size: 13px; border: 2px solid #fff; }
.avatar-input { display: none; }
.avatar-hint { font-size: var(--text-xs); color: var(--color-gray-text); }

.field { display: flex; flex-direction: column; gap: var(--space-2); }
.field-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); }
.input { height: var(--height-input); border: 1.5px solid var(--color-gray-border); border-radius: var(--radius-xl); padding: 0 var(--space-5); font-family: var(--font-body); font-size: var(--text-md); color: var(--color-dark); background: var(--color-gray-bg); outline: none; transition: border-color 0.15s; }
.input:focus { border-color: var(--color-primary); background: #fff; }
.input::placeholder { color: var(--color-gray-placeholder); }

/* Pills */
.pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.pill { padding: 0 var(--space-4); height: var(--height-pill); border: 1.5px solid var(--color-gray-border); background: #fff; color: var(--color-dark); border-radius: var(--radius-sm); font-family: var(--font-body); font-size: var(--text-base); cursor: pointer; transition: all 0.15s; }
.pill--selected { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }

/* Skeleton pills */
.pills-skeleton { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.pill-skeleton { width: 80px; height: var(--height-pill); background: var(--color-gray-bg); border-radius: var(--radius-sm); animation: pulse 1.4s ease-in-out infinite; }

.error-text { font-size: var(--text-sm); color: var(--color-error); }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); display: flex; gap: var(--space-3); border-top: 1px solid var(--color-gray-border); }
.btn-cancel { flex: 1; height: var(--height-btn); background: #fff; border: 1.5px solid var(--color-gray-border); color: var(--color-dark); border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-semibold); cursor: pointer; transition: opacity 0.15s; }
.btn-cancel:hover { opacity: 0.7; }
.btn-save { flex: 2; height: var(--height-btn); background: var(--color-primary); border: none; color: #fff; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); cursor: pointer; transition: opacity 0.15s; box-shadow: var(--shadow-primary); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.btn-save:not(:disabled):hover { opacity: 0.9; }

/* Toast */
.toast { position: fixed; bottom: calc(var(--space-8) + var(--height-btn) + var(--space-5) + 12px); left: 50%; transform: translateX(-50%); background: var(--color-success); color: #fff; border-radius: var(--radius-lg); padding: var(--space-3) var(--space-6); font-size: var(--text-base); font-weight: var(--font-weight-semibold); box-shadow: 0 4px 16px rgba(0,0,0,0.18); white-space: nowrap; z-index: 100; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.25s, transform 0.25s; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(8px); }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
