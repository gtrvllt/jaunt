import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/auth/magic-link',
      name: 'auth-magic-link',
      component: () => import('@/views/AuthMagicLinkView.vue'),
      meta: { public: true },
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingInterestsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('@/views/ProfileEditView.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/jaunt/:id',
      name: 'jaunt-before',
      component: () => import('@/views/BeforeActivityView.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/jaunt/:id/live',
      name: 'jaunt-live',
      component: () => import('@/views/LiveActivityView.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/jaunt/:id/map',
      name: 'jaunt-map',
      component: () => import('@/views/LiveActivityMapView.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
    {
      path: '/jaunt/:id/recap',
      name: 'jaunt-recap',
      component: () => import('@/views/AfterjauntView.vue'),
      meta: { requiresAuth: true, requiresOnboarding: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const profile = useProfileStore()

  // Attendre l'init au premier chargement
  if (auth.loading) await auth.init()

  const isAuthenticated = !!auth.session

  // Route publique : si déjà connecté, renvoyer vers dashboard
  if (to.meta.public) {
    return isAuthenticated ? { name: 'dashboard' } : true
  }

  // Route protégée : non connecté → auth
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'auth' }
  }

  // Route qui nécessite l'onboarding complété (résultat mis en cache dans le store)
  if (to.meta.requiresOnboarding && isAuthenticated) {
    const done = await profile.checkOnboarding(auth.session!.user.id)
    if (!done) return { name: 'onboarding' }
  }

  return true
})

export default router
