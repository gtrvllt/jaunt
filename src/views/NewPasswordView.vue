<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { loading, error, updatePassword } = useAuth()

type Phase = 'checking' | 'ready' | 'invalid'
const phase = ref<Phase>('checking')
const invalidReason = ref<string | null>(null)

const password = ref('')
const confirm = ref('')

// --- Validation force mot de passe (temps réel) -----------------------------
const hasLength = computed(() => password.value.length >= 8)
const hasLetter = computed(() => /[a-zA-Z]/.test(password.value))
const hasNumber = computed(() => /[0-9]/.test(password.value))
const hasStrong = computed(() => /[^a-zA-Z0-9]/.test(password.value) || /[A-Z]/.test(password.value))

const strengthScore = computed(
  () => [hasLength.value, hasLetter.value, hasNumber.value, hasStrong.value].filter(Boolean).length,
)
const strengthLabel = computed(() => {
  if (password.value.length === 0) return ''
  if (strengthScore.value <= 2) return 'Faible'
  if (strengthScore.value === 3) return 'Moyen'
  return 'Fort'
})
const strengthClass = computed(() => {
  if (strengthScore.value <= 2) return 'weak'
  if (strengthScore.value === 3) return 'medium'
  return 'strong'
})

const matches = computed(() => confirm.value.length > 0 && password.value === confirm.value)
const canSubmit = computed(
  () => hasLength.value && hasLetter.value && hasNumber.value && matches.value && !loading.value,
)

// --- Détection de la session de recovery ------------------------------------
let unsub: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  // Erreur renvoyée dans le hash (lien expiré / invalide).
  const hash = window.location.hash
  if (hash.includes('error')) {
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    invalidReason.value = params.get('error_description')?.replace(/\+/g, ' ') ?? null
    phase.value = 'invalid'
    return
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
      phase.value = 'ready'
    }
  })
  unsub = () => data.subscription.unsubscribe()

  // La session peut déjà être présente (hash déjà traité au boot).
  supabase.auth.getSession().then(({ data: s }) => {
    if (s.session) phase.value = 'ready'
  })

  // Filet de sécurité : sans session de recovery après un court délai → invalide.
  timer = setTimeout(() => {
    if (phase.value === 'checking') phase.value = 'invalid'
  }, 3000)
})

onUnmounted(() => {
  if (unsub) unsub()
  if (timer) clearTimeout(timer)
})

async function onSubmit() {
  if (!canSubmit.value) return
  const ok = await updatePassword(password.value)
  if (ok) router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="screen">
    <header class="topbar">
      <span class="topbar-logo">JAUNT</span>
    </header>

    <!-- Vérification en cours -->
    <main v-if="phase === 'checking'" class="content content--center" aria-busy="true">
      <div class="spinner" aria-hidden="true" />
      <p class="sub">Vérification du lien…</p>
    </main>

    <!-- Lien invalide / expiré -->
    <main v-else-if="phase === 'invalid'" class="content content--center">
      <div class="icon" aria-hidden="true">⏳</div>
      <h1 class="title">Lien invalide ou expiré</h1>
      <p class="sub">
        {{ invalidReason ?? 'Ce lien de réinitialisation n\'est plus valable.' }}
        Les liens expirent après 1&nbsp;heure ou une utilisation.
      </p>
      <button class="btn btn-primary" @click="$router.push({ name: 'forgot-password' })">
        Demander un nouveau lien
      </button>
    </main>

    <!-- Formulaire nouveau mot de passe -->
    <main v-else class="content">
      <h1 class="title">Nouveau mot de passe</h1>
      <p class="sub">Choisis un mot de passe sécurisé pour ton compte.</p>

      <form class="form" @submit.prevent="onSubmit">
        <label for="new-pwd" class="field-label">Mot de passe</label>
        <input
          id="new-pwd"
          v-model="password"
          class="input"
          type="password"
          autocomplete="new-password"
          placeholder="Au moins 8 caractères"
        />

        <!-- Jauge de force -->
        <div v-if="password.length > 0" class="strength">
          <div class="strength-bar">
            <div class="strength-fill" :class="strengthClass" :style="{ width: `${(strengthScore / 4) * 100}%` }" />
          </div>
          <span class="strength-label" :class="strengthClass">{{ strengthLabel }}</span>
        </div>
        <ul class="rules" aria-label="Critères du mot de passe">
          <li :class="{ ok: hasLength }">{{ hasLength ? '✓' : '○' }} 8 caractères minimum</li>
          <li :class="{ ok: hasLetter }">{{ hasLetter ? '✓' : '○' }} une lettre</li>
          <li :class="{ ok: hasNumber }">{{ hasNumber ? '✓' : '○' }} un chiffre</li>
        </ul>

        <label for="confirm-pwd" class="field-label">Confirmation</label>
        <input
          id="confirm-pwd"
          v-model="confirm"
          class="input"
          :class="{ 'input--error': confirm.length > 0 && !matches }"
          type="password"
          autocomplete="new-password"
          placeholder="Répète le mot de passe"
        />
        <p v-if="confirm.length > 0 && !matches" class="mismatch">Les mots de passe ne correspondent pas.</p>

        <p v-if="error" class="error-msg" role="alert">{{ error }}</p>

        <button class="btn btn-primary" type="submit" :disabled="!canSubmit">
          {{ loading ? 'Enregistrement…' : 'Définir le mot de passe' }}
        </button>
      </form>
    </main>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.topbar { height: var(--height-appbar); display: flex; align-items: center; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.topbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); }

.content { flex: 1; padding: var(--space-8) var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); }
.content--center { align-items: center; justify-content: center; text-align: center; gap: var(--space-4); }

.title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; }
.sub { font-size: var(--text-base); color: var(--color-gray-text); line-height: var(--line-height-base); max-width: 320px; }
.icon { font-size: 56px; line-height: 1; }

.form { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-4); }
.field-label { font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-dark); margin-top: var(--space-3); }
.input { height: var(--height-input); border: 1.5px solid var(--color-gray-border); border-radius: var(--radius-xl); padding: 0 var(--space-5); font-family: var(--font-body); font-size: var(--text-md); color: var(--color-dark); background: var(--color-gray-bg); outline: none; transition: border-color 0.15s, background 0.15s; }
.input:focus { border-color: var(--color-primary); background: #fff; }
.input::placeholder { color: var(--color-gray-placeholder); }
.input--error { border-color: var(--color-error); }

/* Force */
.strength { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-2); }
.strength-bar { flex: 1; height: 6px; background: var(--color-gray-border); border-radius: var(--radius-full); overflow: hidden; }
.strength-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.25s ease; }
.strength-fill.weak { background: var(--color-error); }
.strength-fill.medium { background: #f59e0b; }
.strength-fill.strong { background: var(--color-success); }
.strength-label { font-size: var(--text-xs); font-weight: var(--font-weight-bold); }
.strength-label.weak { color: var(--color-error); }
.strength-label.medium { color: #b45309; }
.strength-label.strong { color: #166534; }

.rules { list-style: none; padding: 0; margin: var(--space-1) 0 0; display: flex; flex-direction: column; gap: 2px; }
.rules li { font-size: var(--text-sm); color: var(--color-gray-text); }
.rules li.ok { color: var(--color-success); }

.mismatch { font-size: var(--text-sm); color: var(--color-error); }
.error-msg { font-size: var(--text-sm); color: var(--color-error); margin-top: var(--space-2); }

.btn { width: 100%; height: var(--height-btn); border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); cursor: pointer; transition: opacity 0.15s; margin-top: var(--space-5); }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-primary); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
.btn-primary:not(:disabled):hover { opacity: 0.9; }

.spinner { width: 36px; height: 36px; border: 3px solid var(--color-gray-border); border-top-color: var(--color-primary); border-radius: var(--radius-full); animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
