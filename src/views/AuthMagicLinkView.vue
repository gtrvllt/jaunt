<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

type Step = 'input' | 'sent'

const router = useRouter()
const { loading, error, sendMagicLink } = useAuth()

const step = ref<Step>('input')
const email = ref('')

async function onSubmit() {
  if (!email.value.trim()) return
  const ok = await sendMagicLink(email.value.trim())
  if (ok) step.value = 'sent'
}

async function onResend() {
  await sendMagicLink(email.value.trim())
}
</script>

<template>
  <div class="screen">
    <!-- Logo identique à AuthView -->
    <div class="logo-box">
      <span class="logo-icon">◉</span>
      <span class="logo-text">JAUNT</span>
    </div>

    <div class="slogan-box">
      Explore your city differently
    </div>

    <!-- Step 1 : saisie email -->
    <div v-if="step === 'input'" class="content">
      <button class="back-btn" aria-label="Retour" @click="router.back()">←</button>

      <h1 class="title">Sign in with Email</h1>
      <p class="subtitle">No password required — we'll send you a magic link.</p>

      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>

      <label for="email-input" class="sr-only">Email address</label>
      <div class="input-wrapper">
        <span class="input-icon" aria-hidden="true">✉</span>
        <input
          id="email-input"
          v-model="email"
          type="email"
          placeholder="your@email.com"
          autocomplete="email"
          class="email-input"
          @keydown.enter="onSubmit"
        />
      </div>

      <button
        class="btn btn-primary"
        :disabled="loading || !email.trim()"
        @click="onSubmit"
      >
        {{ loading ? 'Sending…' : 'Send Magic Link' }}
      </button>
    </div>

    <!-- Step 2 : email envoyé -->
    <div v-else class="content">
      <button class="back-btn" aria-label="Retour" @click="step = 'input'">←</button>

      <h1 class="title">Check your inbox</h1>
      <p class="subtitle">We sent a magic link to your email address.</p>

      <button class="mail-card" @click="/* ouverture mail géré par l'OS */">
        <span class="mail-icon" aria-hidden="true">✉</span>
        <span class="mail-label">Open Mail App</span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>

      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>

      <button class="resend-link" :disabled="loading" @click="onResend">
        {{ loading ? 'Sending…' : 'Resend link' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding: 0 var(--space-6);
  background: #fff;
}

/* Logo — identique à AuthView */
.logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 120px;
  background: var(--color-gray-bg);
  border-radius: var(--radius-2xl);
  margin-top: 80px;
  gap: var(--space-2);
}

.logo-icon {
  font-size: 40px;
  color: var(--color-primary);
  line-height: 1;
}

.logo-text {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-2xl);
  letter-spacing: var(--letter-spacing-logo);
  color: var(--color-dark);
}

.slogan-box {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-bg);
  border-radius: var(--radius-lg);
  margin-top: var(--space-6);
  font-size: var(--text-lg);
  color: var(--color-gray-text);
}

/* Contenu variable selon l'étape */
.content {
  width: 100%;
  margin-top: auto;
  padding-bottom: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-dark);
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
}

.title {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-3xl);
  color: var(--color-dark);
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: var(--text-md);
  color: var(--color-gray-text);
  line-height: var(--line-height-base);
}

.error-msg {
  font-size: var(--text-sm);
  color: var(--color-error);
}

/* Input email */
.input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--height-input);
  background: var(--color-gray-bg);
  border: 1px solid var(--color-gray-border);
  border-radius: var(--radius-xl);
  padding: 0 var(--space-4);
}

.input-icon {
  font-size: 18px;
  color: var(--color-gray-text);
  flex-shrink: 0;
}

.email-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-lg);
  color: var(--color-dark);
  outline: none;
}

.email-input::placeholder {
  color: var(--color-gray-placeholder);
}

/* Bouton principal */
.btn {
  width: 100%;
  height: var(--height-btn);
  border: none;
  border-radius: var(--radius-xl);
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

/* Carte "Open Mail App" */
.mail-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  height: 64px;
  background: var(--color-gray-bg);
  border: 1px solid var(--color-gray-border);
  border-radius: var(--radius-xl);
  padding: 0 var(--space-4);
  cursor: pointer;
  text-align: left;
}

.mail-icon {
  font-size: 20px;
  color: var(--color-primary);
}

.mail-label {
  flex: 1;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-dark);
}

.chevron {
  font-size: 22px;
  color: var(--color-gray-text);
}

/* Lien "Resend" */
.resend-link {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: var(--text-md);
  color: var(--color-primary);
  cursor: pointer;
  text-align: center;
  padding: var(--space-2) 0;
}

.resend-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Accessibilité */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
