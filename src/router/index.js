import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', name: 'landing', component: () => import('@/views/publico/Landing.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/publico/Login.vue') },

  // Cliente
  {
    path: '/cliente',
    component: () => import('@/views/cliente/DashboardCliente.vue'),
    meta: { requiresAuth: true, roles: ['cliente_admin', 'cliente_usuario'] },
  },
  {
    path: '/incidencia/:equipoId',
    name: 'reportar-incidencia',
    component: () => import('@/views/cliente/ReportarIncidencia.vue'),
    meta: { requiresAuth: true, roles: ['cliente_admin', 'cliente_usuario'] },
  },

  // Técnico
  {
    path: '/tecnico',
    component: () => import('@/views/tecnico/OrdenesAsignadas.vue'),
    meta: { requiresAuth: true, roles: ['tecnico'] },
  },
  {
    path: '/tecnico/orden/:incidenciaId',
    component: () => import('@/views/tecnico/DetalleOrden.vue'),
    meta: { requiresAuth: true, roles: ['tecnico'] },
  },

  // Admin
  {
    path: '/admin',
    component: () => import('@/views/admin/DashboardAdmin.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/equipos',
    component: () => import('@/views/admin/GestionEquipos.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.user) {
    // guardamos a dónde quería ir, para regresarlo ahí después del login
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.rol)) {
    return next('/')
  }

  next()
})

export default router