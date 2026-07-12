import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import { useTrack } from '@/composables/useTrack'

const PARIS_SUGGESTIONS = ['Architecture', 'Street Art', 'History', 'Food & Markets', 'Gastronomy']
const MIN_SELECTION = 3

export function useInterests() {
  const router = useRouter()
  const profileStore = useProfileStore()
  const authStore = useAuthStore()
  const { track } = useTrack()

  const search = ref('')
  const selected = ref<Set<string>>(new Set())

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return profileStore.interests
    return profileStore.interests.filter((i) => i.name.toLowerCase().includes(q))
  })

  const suggestions = computed(() =>
    profileStore.interests.filter((i) => PARIS_SUGGESTIONS.includes(i.name)),
  )

  const canSave = computed(() => selected.value.size >= MIN_SELECTION)

  function toggle(id: string) {
    if (selected.value.has(id)) selected.value.delete(id)
    else selected.value.add(id)
  }

  async function save() {
    if (!authStore.session || !canSave.value) return
    await profileStore.saveInterests(authStore.session.user.id, [...selected.value])
    if (!profileStore.error) {
      await track('onboarding_completed', { interests_count: selected.value.size })
      router.push({ name: 'dashboard' })
    }
  }

  async function init() {
    await profileStore.fetchAllInterests()
  }

  return {
    search,
    selected,
    filtered,
    suggestions,
    canSave,
    loading: computed(() => profileStore.loading),
    error: computed(() => profileStore.error),
    minSelection: MIN_SELECTION,
    toggle,
    save,
    init,
  }
}
