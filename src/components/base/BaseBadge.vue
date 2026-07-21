<script setup lang="ts">
type Variant = 'primary' | 'neutral' | 'success' | 'warning' | 'info'

withDefaults(
  defineProps<{
    variant?: Variant
    outlined?: boolean
  }>(),
  {
    variant: 'primary',
    outlined: false,
  },
)
</script>

<template>
  <span class="badge" :class="[`badge--${variant}`, { 'badge--outlined': outlined }]">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--letter-spacing-label);
  border: 1.5px solid transparent;
  white-space: nowrap;
}

/* Variantes pleines */
.badge--primary { background: var(--color-primary); color: #fff; }
.badge--neutral { background: var(--color-gray-bg); color: var(--color-gray-text); }
.badge--success { background: #e8f5e9; color: #2e7d32; }
.badge--warning { background: #fffbea; color: #92400e; }
.badge--info { background: #e0f7ff; color: #0369a1; }

/* Variante outlined : bordure colorée, fond transparent */
.badge--outlined { background: transparent; }
.badge--outlined.badge--primary { border-color: var(--color-primary); color: var(--color-primary); }
.badge--outlined.badge--neutral { border-color: var(--color-gray-border); color: var(--color-gray-text); }
.badge--outlined.badge--success { border-color: var(--color-success); color: #2e7d32; }
.badge--outlined.badge--warning { border-color: #f59e0b; color: #92400e; }
.badge--outlined.badge--info { border-color: var(--color-info); color: #0369a1; }
</style>
