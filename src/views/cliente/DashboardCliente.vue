<template>
  <AppSidebar
    subtitulo="Portal cliente"
    :items="[
      { title: 'Mis equipos', icon: 'mdi-printer', to: '/cliente' },
      { title: 'Solicitar insumos', icon: 'mdi-package-variant', to: '/cliente/insumos' },
    ]"
  />

  <v-main>
    <v-container class="py-8" style="max-width: 900px;">
      <div class="mb-8">
        <h1 class="text-h5 font-weight-medium">Mis equipos</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Consulta el estatus de tus impresoras y su historial de servicio.
        </p>
      </div>

      <v-card v-if="cargando" class="pa-8 text-center">
        <v-progress-circular indeterminate color="primary" />
      </v-card>

      <v-card v-else-if="equipos.length === 0" class="pa-8 text-center">
        <v-icon icon="mdi-printer-off" size="40" class="text-medium-emphasis mb-2" />
        <div class="text-body-1">Aún no tienes equipos registrados.</div>
        <div class="text-body-2 text-medium-emphasis">Contacta a tu proveedor para dar de alta tu primera impresora.</div>
      </v-card>

      <v-row v-else>
        <v-col v-for="equipo in equipos" :key="equipo.id" cols="12" md="6">
          <v-card class="pa-5 h-100" @click="verHistorial(equipo.id)" style="cursor: pointer;">
            <div class="d-flex justify-space-between align-start mb-3">
              <div>
                <div class="text-subtitle-1 font-weight-medium">{{ equipo.modelo }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ equipo.numeroSerie }}</div>
              </div>
              <v-icon icon="mdi-printer" color="primary" />
            </div>
            <div class="text-body-2 text-medium-emphasis mb-1" v-if="equipo.sucursal">
              <v-icon icon="mdi-map-marker-outline" size="16" class="mr-1" />{{ equipo.sucursal }}
            </div>
            <v-chip size="small" :color="equipo.estatus === 'activo' ? 'success' : 'grey'" variant="tonal" class="mt-2">
              {{ equipo.estatus }}
            </v-chip>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="equipos.length > 0" class="mt-10">
        <h2 class="text-h6 font-weight-medium mb-4">Historial reciente</h2>

        <v-card v-if="historial.length === 0" class="pa-6 text-center text-medium-emphasis">
          Sin registros de servicio todavía.
        </v-card>

        <v-card v-for="item in historial" :key="item.id" class="pa-4 mb-3">
          <div class="d-flex justify-space-between align-center flex-wrap ga-2">
            <div>
              <div class="text-body-1 font-weight-medium">{{ item.motivo }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatearFecha(item.fechaCreacion) }}</div>
            </div>
            <div class="d-flex align-center ga-2">
              <v-chip size="small" :color="colorEstatus(item.estatus)" variant="tonal">
                {{ item.estatus }}
              </v-chip>
              <v-btn
                v-if="item.hojaRecibidoUrl"
                icon="mdi-file-pdf-box"
                variant="text"
                color="accent"
                size="small"
                :href="item.hojaRecibidoUrl"
                target="_blank"
              />
            </div>
          </div>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/shared/AppSidebar.vue'

const authStore = useAuthStore()
const router = useRouter()

const cargando = ref(true)
const equipos = ref([])
const historial = ref([])

onMounted(async () => {
  const qEquipos = query(
    collection(db, 'equipos'),
    where('clienteId', '==', authStore.clienteId)
  )
  const snapEquipos = await getDocs(qEquipos)
  equipos.value = snapEquipos.docs.map(d => ({ id: d.id, ...d.data() }))

  const qHistorial = query(
    collection(db, 'incidencias'),
    where('clienteId', '==', authStore.clienteId),
    orderBy('fechaCreacion', 'desc'),
    limit(10)
  )
  const snapHistorial = await getDocs(qHistorial)
  historial.value = snapHistorial.docs.map(d => ({ id: d.id, ...d.data() }))

  cargando.value = false
})

function colorEstatus(estatus) {
  const mapa = { pendiente: 'warning', asignado: 'info', resuelto: 'success' }
  return mapa[estatus] || 'grey'
}

function formatearFecha(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function verHistorial(equipoId) {
  // pendiente: vista de detalle por equipo — por ahora no navega a ningún lado
}
</script>