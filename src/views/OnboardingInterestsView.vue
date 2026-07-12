<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInterests } from '@/composables/useInterests'

const INITIAL_VISIBLE = 20

const { search, selected, filtered, suggestions, canSave, loading, error, minSelection, toggle, save, init } =
  useInterests()

const expanded = ref(false)

const visibleInterests = computed(() =>
  expanded.value || search.value ? filtered.value : filtered.value.slice(0, INITIAL_VISIBLE),
)

const hasMore = computed(() => !search.value && filtered.value.length > INITIAL_VISIBLE)

onMounted(init)
</script>

<template>
  <div class="screen">
    <!-- TitleBar -->
    <header class="title-bar">
      <h1 class="title">Select Interests</h1>
    </header>

    <!-- Search -->
    <div class="search-bar">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input
        v-model="search"
        type="search"
        placeholder="Search interests..."
        class="search-input"
        aria-label="Search interests"
      />
    </div>

    <!-- États loading / erreur / vide -->
    <div v-if="loading" class="state-msg">Loading interests…</div>

    <div v-else-if="error" class="state-msg state-error" role="alert">{{ error }}</div>

    <template v-else>
      <!-- Pills grid -->
      <div v-if="filtered.length > 0" class="pills-section">
        <div class="pills-grid">
          <button
            v-for="interest in visibleInterests"
            :key="interest.id"
            class="pill"
            :class="{ 'pill--active': selected.has(interest.id) }"
            :aria-pressed="selected.has(interest.id)"
            @click="toggle(interest.id)"
          >
            {{ interest.name }}
          </button>
        </div>

        <!-- Voir plus / moins -->
        <button v-if="hasMore" class="btn-expand" @click="expanded = !expanded">
          {{ expanded ? 'Voir moins ↑' : `Voir plus (${filtered.length - INITIAL_VISIBLE} autres) ↓` }}
        </button>

        <!-- Compteur -->
        <p class="counter" :class="{ 'counter--ok': canSave }">
          {{ selected.size }} / {{ minSelection }} minimum sélectionnés
        </p>
      </div>

      <div v-else class="state-msg">Aucun résultat pour "{{ search }}"</div>

      <!-- Suggestions Paris -->
      <div v-if="!search && suggestions.length > 0" class="suggestions">
        <hr class="divider" />
        <p class="suggestions-label">Suggestions pour Paris</p>
        <div class="pills-grid">
          <button
            v-for="interest in suggestions"
            :key="interest.id"
            class="pill pill--suggestion"
            :class="{ 'pill--active': selected.has(interest.id) }"
            :aria-pressed="selected.has(interest.id)"
            @click="toggle(interest.id)"
          >
            {{ interest.name }}
          </button>
        </div>
      </div>
    </template>

    <!-- Footer Save -->
    <footer class="footer">
      <p v-if="error" class="state-error" role="alert">{{ error }}</p>
      <button
        class="btn-save"
        :disabled="!canSave || loading"
        @click="save"
      >
        {{ loading ? 'Saving…' : 'Save' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.screen {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: #fff;
}

/* TitleBar */
.title-bar {
  height: var(--height-appbar);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  border-bottom: 1px solid var(--color-gray-border);
  flex-shrink: 0;
}

.title {
  font-family: var(--font-brand);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-4xl);
  color: var(--color-dark);
  letter-spacing: -0.5px;
}

/* Search */
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) var(--space-5) 0;
  height: 46px;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-4);
  flex-shrink: 0;
}

.search-icon {
  font-size: 16px;
  opacity: 0.8;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: var(--text-md);
  color: #fff;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

/* Pills */
.pills-section {
  flex: 1;
  padding: var(--space-4) var(--space-5) 0;
  overflow-y: auto;
}

.pills-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.pill {
  padding: 0 var(--space-4);
  height: var(--height-pill);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-body);
  font-size: var(--text-base);
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
  white-space: nowrap;
}

.pill--active {
  background: #fff;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.pill--suggestion {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-color: rgba(88, 86, 214, 0.3);
}

.pill--suggestion.pill--active {
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;
}

/* Voir plus */
.btn-expand {
  margin-top: var(--space-3);
  background: none;
  border: none;
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: var(--space-1) 0;
}

/* Compteur */
.counter {
  margin-top: var(--space-4);
  font-size: var(--text-base);
  color: var(--color-gray-text);
}

.counter--ok {
  color: var(--color-success);
}

/* Suggestions */
.suggestions {
  padding: 0 var(--space-5);
  margin-top: var(--space-4);
}

.divider {
  border: none;
  border-top: 1px solid var(--color-gray-border);
  margin-bottom: var(--space-4);
}

.suggestions-label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-text);
  margin-bottom: var(--space-3);
}

/* États */
.state-msg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-md);
  color: var(--color-gray-text);
  padding: var(--space-8);
}

.state-error {
  color: var(--color-error);
  font-size: var(--text-sm);
  text-align: center;
}

/* Footer */
.footer {
  flex-shrink: 0;
  padding: var(--space-5) var(--space-5) var(--space-8);
  border-top: 1px solid rgba(229, 229, 234, 0.5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.btn-save {
  width: 100%;
  height: var(--height-btn);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
}
</style>
