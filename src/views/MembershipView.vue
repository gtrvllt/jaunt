<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMembership } from '@/composables/useMembership'
import { useSubscription } from '@/composables/useSubscription'

const { plans, loading, error, fetchPlans } = useMembership()
const {
  isActive,
  currentPlan,
  redirecting,
  error: subError,
  fetchSubscription,
  startCheckout,
  openPortal,
} = useSubscription()

// Sans abonnement actif, le membre est sur la formule gratuite.
const effectivePlan = computed(() => currentPlan.value ?? 'free')

onMounted(() => {
  fetchPlans()
  fetchSubscription()
})
</script>

<template>
  <div class="screen">
    <header class="appbar">
      <button class="appbar-logo" @click="$router.push({ name: 'dashboard' })">JAUNT</button>
    </header>

    <main class="content">
      <div class="hero">
        <p class="hero-label">CLUB JAUNT</p>
        <h1 class="hero-title">{{ isActive ? 'Ton abonnement' : 'Choisis ton abonnement' }}</h1>
        <p class="hero-sub">Deux formules pour explorer Paris à ta façon.</p>
      </div>

      <!-- Abonnement actif : gestion -->
      <div v-if="isActive" class="manage-banner">
        <div>
          <p class="manage-label">Abonnement actif</p>
          <p class="manage-plan">Formule {{ currentPlan === 'premium' ? 'Premium' : 'Standard' }}</p>
        </div>
        <button class="btn-manage" :disabled="redirecting" @click="openPortal">
          {{ redirecting ? '…' : 'Gérer' }}
        </button>
      </div>

      <p v-if="subError" class="state-error" role="alert">{{ subError }}</p>

      <div v-if="loading" class="plans-grid" aria-busy="true">
        <div class="skeleton-card" />
        <div class="skeleton-card skeleton-card--highlight" />
      </div>

      <div v-else-if="error" class="state-error" role="alert">
        <p>{{ error }}</p>
        <button class="btn-retry" @click="fetchPlans">Réessayer</button>
      </div>

      <div v-else class="plans-grid">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="plan-card"
          :class="{
            'plan-card--highlighted': plan.is_highlighted && effectivePlan !== plan.slug,
            'plan-card--current': effectivePlan === plan.slug,
          }"
        >
          <!-- Badge -->
          <div
            v-if="effectivePlan === plan.slug"
            class="plan-badge plan-badge--current"
            aria-label="Ton offre actuelle"
          >
            ✓ Ton offre
          </div>
          <div
            v-else-if="plan.is_highlighted"
            class="plan-badge"
            aria-label="Offre mise en avant"
          >
            ✦ Recommandé
          </div>

          <!-- En-tête -->
          <div class="plan-header">
            <p class="plan-name">{{ plan.name }}</p>
            <div class="plan-price-row">
              <span class="plan-price">{{ plan.price_cents === 0 ? 'Gratuit' : plan.priceFormatted }}</span>
              <span v-if="plan.price_cents > 0" class="plan-cycle">/ mois</span>
            </div>
            <p v-if="plan.tagline" class="plan-tagline">{{ plan.tagline }}</p>
          </div>

          <div class="plan-divider" />

          <!-- Features -->
          <ul class="plan-features" role="list" :aria-label="`Avantages ${plan.name}`">
            <li
              v-for="feature in plan.features"
              :key="feature.label"
              class="plan-feature"
              :class="{ 'plan-feature--excluded': !feature.included }"
            >
              <span class="feature-icon" :aria-hidden="true">{{ feature.included ? '✓' : '✕' }}</span>
              <span>{{ feature.label }}</span>
            </li>
          </ul>

          <!-- CTA -->
          <button
            v-if="effectivePlan === plan.slug"
            class="btn-select btn-select--current"
            disabled
          >
            Offre actuelle
          </button>
          <!-- Free non-actuel (membre abonné) : redescente via le portail -->
          <button
            v-else-if="plan.slug === 'free'"
            class="btn-select"
            :disabled="redirecting"
            @click="openPortal"
            aria-label="Gérer mon abonnement"
          >
            Résilier mon abonnement
          </button>
          <button
            v-else-if="isActive"
            class="btn-select"
            :class="{ 'btn-select--primary': plan.is_highlighted }"
            :disabled="redirecting"
            @click="openPortal"
            :aria-label="`Passer à la formule ${plan.name}`"
          >
            Passer à {{ plan.name }}
          </button>
          <button
            v-else
            class="btn-select"
            :class="{ 'btn-select--primary': plan.is_highlighted }"
            :disabled="redirecting"
            @click="startCheckout(plan.slug)"
            :aria-label="`Choisir la formule ${plan.name}`"
          >
            {{ redirecting ? 'Redirection…' : `Choisir ${plan.name}` }}
          </button>
        </div>
      </div>

      <p class="footnote">Sans engagement · Résiliable à tout moment · Paiement sécurisé par Stripe</p>
    </main>
  </div>
</template>

<style scoped>
.screen { display: flex; flex-direction: column; min-height: 100dvh; background: #fff; }

.appbar { height: var(--height-appbar); display: flex; align-items: center; padding: 0 var(--space-6); border-bottom: 1px solid var(--color-gray-border); flex-shrink: 0; }
.appbar-logo { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); letter-spacing: var(--letter-spacing-logo); color: var(--color-dark); background: none; border: none; cursor: pointer; padding: 0; }

.content { flex: 1; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-6); overflow-y: auto; }

/* Hero */
.hero { text-align: center; padding: var(--space-4) 0; }
.hero-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: var(--color-primary); margin-bottom: var(--space-2); }
.hero-title { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-3xl); color: var(--color-dark); letter-spacing: -0.5px; line-height: 1.15; margin-bottom: var(--space-2); }
.hero-sub { font-size: var(--text-base); color: var(--color-gray-text); }

/* Bandeau de gestion */
.manage-banner { display: flex; align-items: center; justify-content: space-between; background: var(--color-dark); border-radius: var(--radius-md); padding: var(--space-4) var(--space-5); }
.manage-label { font-size: var(--text-xs); font-weight: var(--font-weight-semibold); letter-spacing: var(--letter-spacing-label); color: rgba(255,255,255,0.7); }
.manage-plan { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-lg); color: #fff; }
.btn-manage { height: 40px; padding: 0 var(--space-5); background: #fff; color: var(--color-dark); border: none; border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: var(--font-weight-bold); cursor: pointer; }
.btn-manage:disabled { opacity: 0.6; cursor: wait; }

/* Plans grid */
.plans-grid { display: flex; flex-direction: column; gap: var(--space-4); }

.plan-card { border: 1.5px solid var(--color-gray-border); border-radius: var(--radius-lg); padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); position: relative; background: #fff; }
.plan-card--highlighted { border-color: var(--color-primary); background: #fafafe; box-shadow: 0 4px 24px rgba(88, 86, 214, 0.10); }
.plan-card--current { border-color: var(--color-success); background: #f0fdf4; box-shadow: none; }

/* Badge */
.plan-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: #fff; font-size: var(--text-xs); font-weight: var(--font-weight-bold); letter-spacing: var(--letter-spacing-label); padding: var(--space-1) var(--space-4); border-radius: var(--radius-full); white-space: nowrap; }
.plan-badge--current { background: var(--color-success); }

/* Header */
.plan-header { display: flex; flex-direction: column; gap: var(--space-1); }
.plan-name { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: var(--text-xl); color: var(--color-dark); }
.plan-price-row { display: flex; align-items: baseline; gap: var(--space-1); }
.plan-price { font-family: var(--font-brand); font-weight: var(--font-weight-bold); font-size: 40px; color: var(--color-dark); line-height: 1; }
.plan-cycle { font-size: var(--text-base); color: var(--color-gray-text); }
.plan-tagline { font-size: var(--text-sm); color: var(--color-gray-text); margin-top: var(--space-1); }

.plan-divider { height: 1px; background: var(--color-gray-border); }

/* Features */
.plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
.plan-feature { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-base); color: var(--color-dark); }
.plan-feature--excluded { color: var(--color-gray-text); }
.feature-icon { width: 20px; height: 20px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: var(--font-weight-bold); flex-shrink: 0; background: #e8f5e9; color: #2e7d32; }
.plan-feature--excluded .feature-icon { background: var(--color-gray-bg); color: var(--color-gray-text); }

/* CTA */
.btn-select { height: var(--height-btn); border-radius: var(--radius-xl); font-family: var(--font-body); font-size: var(--text-base); font-weight: var(--font-weight-semibold); cursor: pointer; transition: opacity 0.15s; border: 1.5px solid var(--color-dark); background: #fff; color: var(--color-dark); }
.btn-select--primary { background: var(--color-primary); border-color: var(--color-primary); color: #fff; font-size: var(--text-lg); font-weight: var(--font-weight-bold); box-shadow: var(--shadow-primary); }
.btn-select--current { border-color: var(--color-success); color: var(--color-success); background: #fff; cursor: default; }
.btn-select:disabled { opacity: 0.6; }
.btn-select:not(:disabled):hover { opacity: 0.85; }

/* Footnote */
.footnote { text-align: center; font-size: var(--text-xs); color: var(--color-gray-text); padding-bottom: var(--space-4); }

/* States */
.state-error { background: #fff0ef; border-radius: var(--radius-md); padding: var(--space-4); text-align: center; color: var(--color-error); font-size: var(--text-sm); }
.btn-retry { margin-top: var(--space-3); height: 40px; padding: 0 var(--space-5); background: var(--color-error); color: #fff; border: none; border-radius: var(--radius-xl); font-size: var(--text-sm); font-weight: var(--font-weight-semibold); cursor: pointer; }

/* Skeletons */
.skeleton-card { height: 460px; background: var(--color-gray-bg); border-radius: var(--radius-lg); animation: pulse 1.4s ease-in-out infinite; }
.skeleton-card--highlight { border: 1.5px solid var(--color-primary); opacity: 0.6; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
