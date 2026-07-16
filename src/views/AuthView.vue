<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { loading, error, signInWithGoogle } = useAuth()
</script>

<template>
  <div class="screen">
    <div class="logo-box">
      <span class="logo-icon">◉</span>
      <span class="logo-text">JAUNT</span>
    </div>

    <div class="slogan-box">
      Explore your city differently
    </div>

    <div class="auth-section">
      <p class="auth-label">Sign in to continue</p>

      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>

      <button class="btn btn-google" :disabled="loading" @click="signInWithGoogle">
        <span class="google-icon">G</span>
        Continue with Google
      </button>

      <button class="btn btn-primary" @click="router.push({ name: 'auth-magic-link' })">
        Continue with Email
      </button>

      <button class="forgot-link" @click="router.push({ name: 'forgot-password' })">
        Mot de passe oublié ?
      </button>

      <p class="legal">
        By continuing, you agree to our Terms &amp; Privacy Policy.
      </p>
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

.auth-section {
  width: 100%;
  margin-top: auto;
  padding-bottom: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-label {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-gray-text);
}

.error-msg {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-error);
}

.btn {
  width: 100%;
  height: var(--height-btn);
  border: none;
  border-radius: var(--radius-xl);
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-google {
  background: var(--color-gray-bg);
  color: var(--color-dark);
  border: 1px solid var(--color-gray-border);
}

.google-icon {
  font-weight: var(--font-weight-bold);
  font-size: var(--text-xl);
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.forgot-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: 0;
}

.legal {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-gray-text);
  line-height: var(--line-height-base);
}
</style>
