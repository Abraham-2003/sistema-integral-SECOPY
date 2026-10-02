<template>
  <AppSidebar subtitulo="Panel administrador" :items="[
    { title: 'Notificaciones', icon: 'mdi-bell', to: '/admin' },
    { title: 'Equipos', icon: 'mdi-printer', to: '/admin/equipos' },
    { title: 'Estadísticas', icon: 'mdi-chart-bar', to: '/admin/estadisticas' },
  ]" />

  <v-main class="bg-grey-lighten-4">
    <v-container>
      <h1 class="text-h5 mb-6">Solicitudes pendientes</h1>

      <v-row>
        <v-col cols="12" md="4">
          <v-card class="pa-4" color="orange-lighten-5">
            <div class="text-caption">Incidencias</div>
            <div class="text-h4 font-weight-bold">{{ notif.incidenciasPendientes.length }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="pa-4" color="blue-lighten-5">
            <div class="text-caption">Mantenimientos</div>
            <div class="text-h4 font-weight-bold">{{ notif.mantenimientosPendientes.length }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="pa-4" color="green-lighten-5">
            <div class="text-caption">Insumos</div>
            <div class="text-h4 font-weight-bold">{{ notif.solicitudesInsumosPendientes.length }}</div>
          </v-card>
        </v-col>
      </v-row>

      <h2 class="text-h6 mt-8 mb-3">Últimas incidencias</h2>
      <v-table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Motivo</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inc in notif.incidenciasPendientes" :key="inc.id">
            <td>{{ inc.equipoId }}</td>
            <td>{{ inc.motivo }}</td>
            <td>{{ formatearFecha(inc.fechaCreacion) }}</td>
            <td>
              <v-btn size="small" color="primary" variant="text">Asignar técnico</v-btn>
            </td>
          </tr>
          <tr v-if="notif.incidenciasPendientes.length === 0">
            <td colspan="4" class="text-center text-grey py-4">No hay incidencias pendientes</td>
          </tr>
          <v-dialog v-model="dialogAsignar" max-width="400">
            <v-card class="pa-4">
              <v-card-title>Asignar técnico</v-card-title>
              <v-card-text>
                <div class="text-body-2 text-grey-darken-1 mb-3">
                  {{ incidenciaSeleccionada?.motivo }}
                </div>
                <v-select v-model="tecnicoElegido" :items="tecnicos" item-title="nombre" item-value="id" label="Técnico"
                  variant="outlined" density="comfortable" />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="dialogAsignar = false">Cancelar</v-btn>
                <v-btn color="primary" :loading="asignando" @click="confirmarAsignacion">
                  Asignar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-btn size="small" color="primary" variant="text" @click="abrirAsignacion(inc)">
            Asignar técnico
          </v-btn>
        </tbody>

      </v-table>
    </v-container>
  </v-main>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificacionesStore } from '@/stores/notificaciones'
import { collection, doc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import AppSidebar from '@/components/shared/AppSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()
const notif = useNotificacionesStore()
const dialogAsignar = ref(false)
const incidenciaSeleccionada = ref(null)
const tecnicos = ref([])
const tecnicoElegido = ref(null)
const asignando = ref(false)

onMounted(() => {
  notif.iniciarEscucha()
})
onUnmounted(() => {
  notif.detenerEscucha()
})
onMounted(async () => {
  notif.iniciarEscucha()
  const snap = await getDocs(collection(db, 'tecnicos'))
  tecnicos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
})
function abrirAsignacion(incidencia) {
  incidenciaSeleccionada.value = incidencia
  tecnicoElegido.value = null
  dialogAsignar.value = true
}

async function confirmarAsignacion() {
  if (!tecnicoElegido.value) return
  asignando.value = true
  try {
    await updateDoc(doc(db, 'incidencias', incidenciaSeleccionada.value.id), {
      tecnicoAsignado: tecnicoElegido.value,
      estatus: 'asignado',
      fechaAsignacion: serverTimestamp(),
    })
    dialogAsignar.value = false
  } catch (e) {
    console.error('Error al asignar técnico:', e)
  } finally {
    asignando.value = false
  }
}

function formatearFecha(timestamp) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function handleLogout() {
  notif.detenerEscucha()
  await authStore.logout()
  router.push('/login')
}
</script>