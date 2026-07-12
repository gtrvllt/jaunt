import { ref, computed, onUnmounted } from 'vue'

export function useCountdown(targetIso: string | null) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  if (targetIso) {
    timer = setInterval(() => { now.value = Date.now() }, 1000)
  }

  onUnmounted(() => { if (timer) clearInterval(timer) })

  const diff = computed(() => {
    if (!targetIso) return 0
    return Math.max(0, new Date(targetIso).getTime() - now.value)
  })

  const hours = computed(() => String(Math.floor(diff.value / 3_600_000)).padStart(2, '0'))
  const minutes = computed(() => String(Math.floor((diff.value % 3_600_000) / 60_000)).padStart(2, '0'))
  const seconds = computed(() => String(Math.floor((diff.value % 60_000) / 1_000)).padStart(2, '0'))
  const isExpired = computed(() => diff.value === 0)

  return { hours, minutes, seconds, isExpired }
}
