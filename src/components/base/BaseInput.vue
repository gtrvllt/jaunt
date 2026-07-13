<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    type?: 'text' | 'email' | 'tel' | 'url' | 'search'
    placeholder?: string
    icon?: string
    disabled?: boolean
    id?: string
    autocomplete?: string
    inputmode?: 'text' | 'email' | 'tel' | 'url' | 'search' | 'numeric'
    maxlength?: number
  }>(),
  {
    type: 'text',
    disabled: false,
  },
)

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="field" :class="{ 'field--disabled': disabled }">
    <span v-if="icon" class="field-icon" aria-hidden="true">{{ icon }}</span>
    <input
      :id="id"
      class="field-input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :maxlength="maxlength"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.field {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--height-input);
  background: var(--color-gray-bg);
  border: 1.5px solid var(--color-gray-border);
  border-radius: var(--radius-xl);
  padding: 0 var(--space-5);
  transition: border-color 0.15s, background 0.15s;
}
.field:focus-within {
  border-color: var(--color-primary);
  background: #fff;
}
.field--disabled { opacity: 0.6; }

.field-icon {
  font-size: 18px;
  color: var(--color-gray-text);
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-md);
  color: var(--color-dark);
  outline: none;
}
.field-input::placeholder { color: var(--color-gray-placeholder); }
</style>
