<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost'
type Size = 'md' | 'sm'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    block?: boolean
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    block: false,
    disabled: false,
    loading: false,
    type: 'button',
  },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const isDisabled = computed(() => props.disabled || props.loading)

function onClick(event: MouseEvent) {
  if (isDisabled.value) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block, 'btn--loading': loading }]"
    :disabled="isDisabled"
    :aria-busy="loading"
    @click="onClick"
  >
    <span v-if="loading" class="btn-spinner" aria-hidden="true" />
    <span class="btn-label"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-xl);
  font-family: var(--font-body);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.15s;
  border: 1.5px solid transparent;
  white-space: nowrap;
}
.btn:not(:disabled):hover { opacity: 0.9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

/* Tailles */
.btn--md { height: var(--height-btn); font-size: var(--text-lg); padding: 0 var(--space-6); }
.btn--sm { height: 44px; font-size: var(--text-base); padding: 0 var(--space-5); }
.btn--block { width: 100%; }

/* Variantes */
.btn--primary { background: var(--color-primary); color: #fff; font-weight: var(--font-weight-bold); box-shadow: var(--shadow-primary); }
.btn--secondary { background: #fff; border-color: var(--color-gray-border); color: var(--color-dark); }
.btn--dark { background: var(--color-dark); color: #fff; }
.btn--danger { background: #fff; border-color: var(--color-error); color: var(--color-error); }
.btn--ghost { background: none; color: var(--color-gray-text); }

/* Loading */
.btn--loading .btn-label { opacity: 0.7; }
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: var(--radius-full);
  animation: btn-spin 0.7s linear infinite;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }
</style>
