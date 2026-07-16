<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { loading, error, requestPasswordReset } = useAuth()

const email = ref('')
const sent = ref(false)

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

async function onSubmit() {
  if (!emailValid.value) return
  const ok = await requestPasswordReset(email.value.trim())
  // On affiche toujours la confirmation neutre (on ne révèle pas l'existence),
  // sauf en cas d'erreur réseau réelle remontée par le composable.
  if (ok) sent.value = true
}
</script>

<template>
  <div class="screen">
    <header class="topbar">
      <button class="back-btn" aria-label="Retour" @click="$router.push({ name: 'auth' })">←</button>
      <span class="topbar-logo">JAUNT</span>
      <span class="topbar-spacer" />
    </header>

    <!-- Confirmation neutre -->
    <main v-if="sent" class="content content--center">
      <div class="check-icon" aria-hidden="true">✉️</div>
      <h1 class="title">Vérifie ta boîte mail</h1>
      <p class="sub">
        Si un compte est associé à <strong>{{ email.trim() }}</strong>, tu recevras un lien
        sécurisé pour réinitialiser ton mot de passe. Le lien expire dans 1&nbsp;heure.
      </p>
      <button class="btn btn-secondary" @click="$router.push({ name: 'auth' })">
        Retour à la connexion
      </button>
    </main>

    <!-- Formulaire -->
    <main v-else class="content">
      <h1 class="title">Mot de passe oublié ?</h1>
      <p class="sub">Entre ton email, on t'envoie un lien de réinitialisation.</p>

      <form class="form" @submit.prevent="onSubmit">
        <label for="reset-email" class="sr-only">Adresse email</label>
        <div class="field">
          <span class="field-icon" aria-hidden="true">✉</span>
          <input
            id="reset-email"
            v-model="email"
            class="field-input"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="ton@email.com"
          />
        </div>

        <p v-if="error" class="error-msg" role="alert">{{ error }}</p>

        <button class="btn btn-primary" type="submit" :disabled="!emailValid || loading">
          {{ loading ? 'Envoi…' : 'Envoyer le lien' }}
        </button>
      </form>
    </main>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.topbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.back-btn { background: none; border: none; font-size: 22px; color: var(--color-dark); cursor: pointer; width: 32px; text-align: left; }
.topbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); }
.topbar-spacer { width: 32px; }

.content { flex: 1; padding: var(--space-8) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.content--center { align-items: center; justify-content: center; text-align: center; gap: var(--space-5); }

.title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; }
.sub { font-size: var(--text-base); color: var(--color-gray-text); line-height: var(--line-height-base); max-width: 320px; }

.form { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
.field { display: flex; align-items: center; gap: var(--space-3); height: var(--height-input); background: var(--color-gray-bg); border: 1.5px solid var(--color-gray-border); border-radius: var(--radius-xl); padding: 0 var(--space-5); transition: border-color 0.15s, background 0.15s; }
.field:focus-within { border-color: var(--color-primary); background: #fff; }
.field-icon { font-size: 18px; color: var(--color-gray-text); flex-shrink: 0; }
.field-input { flex: 1; min-width: 0; border: none; background: transparent; font-family: var(--font-body); font-size: var(--text-lg); color: var(--color-dark); outline: none; }
.field-input::placeholder { color: var(--color-gray-placeholder); }

.error-msg { font-size: var(--text-sm); color: var(--color-error); }

.check-icon { font-size: 56px; line-height: 1; }

.btn { width: 100%; height: var(--height-btn); border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); cursor: pointer; transition: opacity 0.15s; }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-primary); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
.btn-primary:not(:disabled):hover { opacity: 0.9; }
.btn-secondary { background: #fff; border: 1.5px solid var(--color-gray-border); color: var(--color-dark); font-weight: var(--font-weight-semibold); }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
