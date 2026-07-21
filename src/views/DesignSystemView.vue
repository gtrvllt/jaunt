<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'

const sample = ref('')
const sampleEmail = ref('')
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="$router.push({ name: 'dashboard' })">JAUNT</button>
      <span class="appbar-sub">Design System</span>
    </header>

    <main class="content">
      <!-- Buttons -->
      <section aria-label="Boutons">
        <h2 class="section-title">BUTTONS</h2>
        <div class="stack">
          <BaseButton variant="primary" block>Primary</BaseButton>
          <BaseButton variant="secondary" block>Secondary</BaseButton>
          <BaseButton variant="dark" block>Dark</BaseButton>
          <BaseButton variant="danger" block>Danger</BaseButton>
          <BaseButton variant="ghost" block>Ghost</BaseButton>
          <BaseButton variant="primary" block loading>Loading</BaseButton>
          <BaseButton variant="primary" block disabled>Disabled</BaseButton>
        </div>
        <div class="row">
          <BaseButton variant="primary" size="sm">Small</BaseButton>
          <BaseButton variant="secondary" size="sm">Small</BaseButton>
        </div>
      </section>

      <!-- Inputs -->
      <section aria-label="Champs">
        <h2 class="section-title">INPUTS</h2>
        <div class="stack">
          <BaseInput v-model="sample" placeholder="Texte simple" />
          <BaseInput v-model="sampleEmail" type="email" icon="✉" placeholder="ton@email.com" />
          <BaseInput v-model="sample" placeholder="Désactivé" disabled />
        </div>
      </section>

      <!-- Badges -->
      <section aria-label="Badges">
        <h2 class="section-title">BADGES</h2>
        <div class="badge-grid">
          <BaseBadge variant="primary">Primary</BaseBadge>
          <BaseBadge variant="neutral">Neutral</BaseBadge>
          <BaseBadge variant="success">Success</BaseBadge>
          <BaseBadge variant="warning">Warning</BaseBadge>
          <BaseBadge variant="info">Info</BaseBadge>
        </div>
        <div class="badge-grid">
          <BaseBadge variant="primary" outlined>Primary</BaseBadge>
          <BaseBadge variant="neutral" outlined>Neutral</BaseBadge>
          <BaseBadge variant="success" outlined>Success</BaseBadge>
          <BaseBadge variant="warning" outlined>Warning</BaseBadge>
          <BaseBadge variant="info" outlined>Info</BaseBadge>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }
.appbar-sub { font-size: var(--text-sm); color: var(--color-gray-text); }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-8); overflow-y: auto; }

.section-title { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-gray-text); margin-bottom: var(--space-4); }

.stack { display: flex; flex-direction: column; gap: var(--space-3); }
.row { display: flex; gap: var(--space-3); margin-top: var(--space-3); }
.badge-grid { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3); }
</style>
