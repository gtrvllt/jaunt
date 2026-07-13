<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const jauntId = route.params.id as string

const EMOJIS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Décevant' },
  { value: 2, emoji: '😐', label: 'Bof' },
  { value: 3, emoji: '🙂', label: 'Bien' },
  { value: 4, emoji: '😄', label: 'Super' },
  { value: 5, emoji: '🤩', label: 'Incroyable' },
]

const rating = ref<number | null>(null)
const comment = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref<string | null>(null)

async function submit() {
  if (!rating.value || !auth.session) return
  submitting.value = true
  error.value = null

  const { error: err } = await supabase.from('feedback').insert({
    profile_id: auth.session.user.id,
    jaunt_id: jauntId,
    rating: rating.value,
    comment: comment.value.trim() || null,
  })

  submitting.value = false
  if (err) { error.value = err.message; return }
  submitted.value = true
}
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="$router.push({ name: 'dashboard' })">JAUNT</button>
    </header>

    <!-- Thank you screen -->
    <template v-if="submitted">
      <main class="content content--center">
        <div class="thanks-icon" aria-hidden="true">🎉</div>
        <h1 class="thanks-title">Merci pour ton retour !</h1>
        <p class="thanks-sub">
          Ton avis aide le club à proposer des aventures toujours meilleures. Tu es un pilier de la communauté Jaunt.
        </p>
        <div class="thanks-badge" role="status">
          <span aria-hidden="true">⭐</span> +10 XP pour ton feedback
        </div>
      </main>
      <footer class="footer">
        <button class="btn-primary" @click="$router.push({ name: 'dashboard' })">
          Retour au Dashboard
        </button>
      </footer>
    </template>

    <!-- Feedback form -->
    <template v-else>
      <main class="content">
        <div class="hero">
          <p class="hero-label">TON AVIS</p>
          <h1 class="hero-title">Comment s'est passée la Jaunt ?</h1>
          <p class="hero-sub">1 minute pour aider le club à s'améliorer.</p>
        </div>

        <!-- Emoji rating -->
        <section aria-label="Note de 1 à 5">
          <p class="field-label">Ton ressenti</p>
          <div class="emoji-row" role="radiogroup" aria-label="Choisis ton ressenti">
            <button
              v-for="item in EMOJIS"
              :key="item.value"
              class="emoji-btn"
              :class="{ 'emoji-btn--selected': rating === item.value }"
              :aria-checked="rating === item.value"
              role="radio"
              :aria-label="item.label"
              @click="rating = item.value"
            >
              <span class="emoji" aria-hidden="true">{{ item.emoji }}</span>
              <span class="emoji-label">{{ item.label }}</span>
            </button>
          </div>
        </section>

        <!-- Comment field -->
        <section aria-label="Amélioration">
          <label for="feedback-comment" class="field-label">
            Une chose à améliorer ?
            <span class="field-optional">(facultatif)</span>
          </label>
          <textarea
            id="feedback-comment"
            v-model="comment"
            class="textarea"
            placeholder="Ex : le point de départ était difficile à trouver…"
            rows="4"
            maxlength="500"
          />
          <p class="char-count" aria-live="polite">{{ comment.length }} / 500</p>
        </section>

        <div v-if="error" class="state-error" role="alert">{{ error }}</div>
      </main>

      <footer class="footer">
        <button
          class="btn-primary"
          :disabled="!rating || submitting"
          @click="submit"
        >
          {{ submitting ? 'Envoi…' : 'Envoyer mon avis' }}
        </button>
        <button class="btn-skip" @click="$router.push({ name: 'dashboard' })">
          Passer
        </button>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); overflow-y: auto; }
.content--center { align-items: center; justify-content: center; text-align: center; gap: var(--space-5); }

/* Hero */
.hero-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-primary); margin-bottom: var(--space-2); }
.hero-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; margin-bottom: var(--space-2); }
.hero-sub { font-size: var(--text-base); color: var(--color-gray-text); }

/* Field labels */
.field-label { display: block; font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: var(--color-dark); margin-bottom: var(--space-3); }
.field-optional { font-weight: var(--font-weight-normal); color: var(--color-gray-text); }

/* Emoji rating */
.emoji-row { display: flex; justify-content: space-between; gap: var(--space-2); }
.emoji-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  background: var(--color-gray-bg);
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-2);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.emoji-btn--selected {
  border-color: var(--color-primary);
  background: #eae9fb;
}
.emoji { font-size: 28px; line-height: 1; }
.emoji-label { font-size: 10px; font-weight: var(--font-weight-semibold); color: var(--color-gray-text); text-align: center; }
.emoji-btn--selected .emoji-label { color: var(--color-primary); }

/* Textarea */
.textarea {
  width: 100%;
  border: 1.5px solid var(--color-gray-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-dark);
  resize: none;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
}
.textarea:focus { border-color: var(--color-primary); }
.char-count { font-size: var(--text-xs); color: var(--color-gray-text); text-align: right; margin-top: var(--space-1); }

/* Thank you */
.thanks-icon { font-size: 64px; line-height: 1; }
.thanks-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; }
.thanks-sub { font-size: var(--text-base); color: var(--color-gray-text); line-height: var(--line-height-base); max-width: 300px; }
.thanks-badge { display: inline-flex; align-items: center; gap: var(--space-2); background: #fffbea; border: 1.5px solid #f59e0b; border-radius: var(--radius-full); padding: var(--space-2) var(--space-4); font-size: var(--text-sm); font-weight: var(--font-weight-semibold); color: #92400e; }

/* Footer */
.footer { flex-shrink: 0; padding: var(--space-5) var(--space-6) var(--space-8); display: flex; flex-direction: column; gap: var(--space-3); }
.btn-primary { height: var(--height-btn); background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-lg); font-weight: var(--font-weight-bold); cursor: pointer; box-shadow: var(--shadow-primary); transition: opacity 0.15s; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
.btn-primary:not(:disabled):hover { opacity: 0.9; }
.btn-skip { height: 44px; background: none; border: none; color: var(--color-gray-text); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-semibold); cursor: pointer; }

/* Error */
.state-error { background: #fff0ef; border-radius: var(--radius-md); padding: var(--space-4); color: var(--color-error); font-size: var(--text-sm); }
</style>
