<template>
  <v-container class="py-8" max-width="600">
    <v-card v-if="cargando" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" />
    </v-card>

    <v-card v-else-if="errorAcceso" class="pa-6">
      <v-icon icon="mdi-alert-circle" color="error" size="40" class="mb-2" />
      <div class="text-h6 mb-2">No se puede levantar esta incidencia</div>
      <div class="text-body-2 text-grey-darken-1">{{ errorAcceso }}</div>
    </v-card>

    <v-card v-else-if="enviado" class="pa-6 text-center">
      <v-icon icon="mdi-check-circle" color="primary" size="48" class="mb-3" />
      <div class="text-h6 mb-2">Solicitud enviada</div>
      <div class="text-body-2 text-grey-darken-1 mb-4">
        Folio: <strong>{{ folioGenerado }}</strong><br />
        Te avisaremos cuando un técnico sea asignado.
      </div>
      <v-btn color="primary" to="/cliente">Volver a mi panel</v-btn>
    </v-card>

    <v-card v-else class="pa-6">
      <v-card-title class="px-0">Reportar falla</v-card-title>
      <div class="text-body-2 text-grey-darken-1 mb-4">
        Equipo: <strong>{{ equipo.modelo }}</strong> — {{ equipo.numeroSerie }}
        <span v-if="equipo.sucursal">· {{ equipo.sucursal }}</span>
      </div>

      <v-form @submit.prevent="enviarIncidencia">
        <v-select
          v-model="form.motivo"
          :items="motivos"
          label="Motivo de la falla"
          variant="outlined"
          density="comfortable"
          class="mb-2"
          required
        />
        <v-textarea
          v-model="form.descripcion"
          label="Descripción (opcional)"
          variant="outlined"
          density="comfortable"
          rows="3"
          class="mb-2"
        />
        <v-file-input
          v-model="foto"
          label="Foto (opcional)"
          accept="image/*"
          variant="outlined"
          density="comfortable"
          prepend-icon="mdi-camera"
          class="mb-2"
        />

        <v-alert v-if="errorEnvio" type="error" density="compact" class="mb-4">
          {{ errorEnvio }}
        </v-alert>

        <v-btn type="submit" color="primary" block size="large" :loading="enviando">
          Enviar reporte
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db, storage } from '@/firebase/config'
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const cargando = ref(true)
const errorAcceso = ref('')
const equipo = ref({})

const motivos = [
  'No imprime',
  'Atasco de papel',
  'Calidad de impresión deficiente',
  'Error de conexión',
  'Ruido anormal',
  'Otro',
]

const form = ref({ motivo: '', descripcion: '' })
const foto = ref(null)
const enviando = ref(false)
const enviado = ref(false)
const errorEnvio = ref('')
const folioGenerado = ref('')

onMounted(async () => {
  const equipoId = route.params.equipoId
  const snap = await getDoc(doc(db, 'equipos', equipoId))

  if (!snap.exists()) {
    errorAcceso.value = 'Este código no corresponde a ningún equipo registrado.'
    cargando.value = false
    return
  }

  const data = snap.data()

  if (data.clienteId !== authStore.clienteId) {
    errorAcceso.value = 'Este equipo no pertenece a tu empresa. Si crees que es un error, contacta al proveedor.'
    cargando.value = false
    return
  }

  equipo.value = { id: snap.id, ...data }
  cargando.value = false
})

async function enviarIncidencia() {
  errorEnvio.value = ''
  if (!form.value.motivo) {
    errorEnvio.value = 'Selecciona un motivo.'
    return
  }

  enviando.value = true
  try {
    let fotoUrl = null
    if (foto.value) {
      const archivo = Array.isArray(foto.value) ? foto.value[0] : foto.value
      const ref_ = storageRef(storage, `incidencias/${equipo.value.id}-${Date.now()}-${archivo.name}`)
      await uploadBytes(ref_, archivo)
      fotoUrl = await getDownloadURL(ref_)
    }

    const docRef = await addDoc(collection(db, 'incidencias'), {
      equipoId: equipo.value.id,
      clienteId: authStore.clienteId,
      motivo: form.value.motivo,
      descripcion: form.value.descripcion,
      fotoUrl,
      estatus: 'pendiente',
      tecnicoAsignado: null,
      fechaCreacion: serverTimestamp(),
      fechaFinalizacion: null,
    })

    folioGenerado.value = docRef.id
    enviado.value = true
  } catch (e) {
    console.error(e)
    errorEnvio.value = 'Hubo un problema al enviar tu reporte. Intenta de nuevo.'
  } finally {
    enviando.value = false
  }
}
</script>