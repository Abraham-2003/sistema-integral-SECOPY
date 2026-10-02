<template>
    <v-container class="py-8" max-width="600">
        <v-card v-if="cargando" class="pa-6 text-center">
            <v-progress-circular indeterminate color="primary" />
        </v-card>

        <v-card v-else-if="errorAcceso" class="pa-6">
            <v-icon icon="mdi-alert-circle" color="error" size="40" class="mb-2" />
            <div class="text-body-2 text-grey-darken-1">{{ errorAcceso }}</div>
        </v-card>

        <v-card v-else-if="finalizado" class="pa-6 text-center">
            <v-icon icon="mdi-check-circle" color="primary" size="48" class="mb-3" />
            <div class="text-h6 mb-2">Orden finalizada</div>
            <div class="text-body-2 text-grey-darken-1 mb-4">
                La hoja de recibido fue generada y guardada en el historial del cliente.
            </div>
            <v-btn color="primary" to="/tecnico">Volver a mis órdenes</v-btn>
        </v-card>

        <template v-else>
            <v-card class="pa-6 mb-4">
                <v-card-title class="px-0">{{ incidencia.motivo }}</v-card-title>
                <div class="text-body-2 text-grey-darken-1 mb-1">
                    Equipo: {{ equipo.modelo }} — {{ equipo.numeroSerie }}
                </div>
                <div class="text-body-2 text-grey-darken-1">
                    Descripción del cliente: {{ incidencia.descripcion || 'Sin descripción' }}
                </div>
                <img v-if="incidencia.fotoUrl" :src="incidencia.fotoUrl" class="mt-3 rounded" width="100%"
                    style="max-width: 300px;" />
            </v-card>

            <!-- Paso 1: diagnóstico -->
            <v-card v-if="!diagnosticoConfirmado" class="pa-6">
                <v-card-title class="px-0">Diagnóstico y solución</v-card-title>
                <v-textarea v-model="form.diagnostico" label="Diagnóstico" variant="outlined" density="comfortable"
                    rows="3" class="mb-2" />
                <v-text-field v-model="form.refaccionUsada" label="Refacción / insumo usado (opcional)"
                    variant="outlined" density="comfortable" class="mb-2" />
                <v-btn color="primary" block :disabled="!form.diagnostico" @click="diagnosticoConfirmado = true">
                    Continuar a firma del cliente
                </v-btn>
            </v-card>

            <!-- Paso 2: firma -->
            <v-card v-else class="pa-6">
                <v-card-title class="px-0">Firma de recibido</v-card-title>
                <div class="text-body-2 text-grey-darken-1 mb-3">
                    Pide al cliente firmar en la pantalla para confirmar el servicio.
                </div>

                <div class="border rounded mb-3" style="border: 1px solid #ccc; touch-action: none;">
                    <canvas ref="canvasFirma" style="width: 100%; height: 200px; touch-action: none;"></canvas>
                </div>

                <div class="d-flex ga-2 mb-4">
                    <v-btn variant="outlined" @click="limpiarFirma">Limpiar</v-btn>
                    <v-btn variant="text" @click="diagnosticoConfirmado = false">Regresar</v-btn>
                </div>

                <v-alert v-if="errorFinalizar" type="error" density="compact" class="mb-4">
                    {{ errorFinalizar }}
                </v-alert>

                <v-btn color="accent" block size="large" :loading="finalizando" @click="finalizarOrden">
                    Finalizar y generar hoja de recibido
                </v-btn>
            </v-card>
        </template>
    </v-container>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db, storage } from '@/firebase/config'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage'
import { useAuthStore } from '@/stores/auth'
import SignaturePad from 'signature_pad'
import jsPDF from 'jspdf'

const route = useRoute()
const authStore = useAuthStore()

const cargando = ref(true)
const errorAcceso = ref('')
const incidencia = ref({})
const equipo = ref({})

const diagnosticoConfirmado = ref(false)
const form = ref({ diagnostico: '', refaccionUsada: '' })

const canvasFirma = ref(null)
let signaturePad = null

const finalizando = ref(false)
const finalizado = ref(false)
const errorFinalizar = ref('')

onMounted(async () => {
    const incidenciaId = route.params.incidenciaId
    const snap = await getDoc(doc(db, 'incidencias', incidenciaId))

    if (!snap.exists()) {
        errorAcceso.value = 'Esta orden no existe.'
        cargando.value = false
        return
    }

    const data = snap.data()

    if (data.tecnicoAsignado !== authStore.user.uid) {
        errorAcceso.value = 'Esta orden no está asignada a ti.'
        cargando.value = false
        return
    }

    incidencia.value = { id: snap.id, ...data }

    const equipoSnap = await getDoc(doc(db, 'equipos', data.equipoId))
    if (equipoSnap.exists()) equipo.value = equipoSnap.data()

    cargando.value = false
})

// Inicializamos el signature pad hasta que el canvas exista en el DOM (paso 2)
watch(diagnosticoConfirmado, async (val) => {
  if (val) {
    await nextTick()
    const canvas = canvasFirma.value
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d').scale(ratio, ratio)
    signaturePad = new SignaturePad(canvas)
  }
})

function limpiarFirma() {
    signaturePad?.clear()
}

async function finalizarOrden() {
    errorFinalizar.value = ''

    if (!signaturePad || signaturePad.isEmpty()) {
        errorFinalizar.value = 'Se requiere la firma del cliente para finalizar.'
        return
    }

    finalizando.value = true
    try {
        const firmaDataUrl = signaturePad.toDataURL('image/png')

        // 1. Subir firma a Storage
        const firmaRef = storageRef(storage, `firmas/${incidencia.value.id}.png`)
        await uploadString(firmaRef, firmaDataUrl, 'data_url')
        const firmaUrl = await getDownloadURL(firmaRef)

        // 2. Generar PDF de la hoja de recibido
        const fechaTexto = new Date().toLocaleString('es-MX')
        const pdf = new jsPDF()
        pdf.setFontSize(16)
        pdf.text('Hoja de Recibido de Servicio', 20, 20)
        pdf.setFontSize(11)
        pdf.text(`Folio: ${incidencia.value.id}`, 20, 35)
        pdf.text(`Fecha: ${fechaTexto}`, 20, 42)
        pdf.text(`Equipo: ${equipo.value.modelo} — ${equipo.value.numeroSerie}`, 20, 49)
        pdf.text(`Motivo reportado: ${incidencia.value.motivo}`, 20, 56)
        pdf.text('Diagnóstico:', 20, 66)
        pdf.text(pdf.splitTextToSize(form.value.diagnostico, 170), 20, 73)
        if (form.value.refaccionUsada) {
            pdf.text(`Refacción/insumo usado: ${form.value.refaccionUsada}`, 20, 90)
        }
        pdf.text('Firma del cliente:', 20, 110)
        pdf.addImage(firmaDataUrl, 'PNG', 20, 115, 80, 35)

        const pdfBlob = pdf.output('blob')
        const pdfRef = storageRef(storage, `hojas-recibido/${incidencia.value.id}.pdf`)
        await uploadBytes(pdfRef, pdfBlob)
        const hojaRecibidoUrl = await getDownloadURL(pdfRef)

        // 3. Actualizar la incidencia
        await updateDoc(doc(db, 'incidencias', incidencia.value.id), {
            estatus: 'resuelto',
            diagnostico: form.value.diagnostico,
            refaccionUsada: form.value.refaccionUsada || null,
            firmaUrl,
            hojaRecibidoUrl,
            fechaFinalizacion: serverTimestamp(),
        })

        finalizado.value = true
    } catch (e) {
        console.error(e)
        errorFinalizar.value = 'Hubo un problema al finalizar la orden. Intenta de nuevo.'
    } finally {
        finalizando.value = false
    }
}
</script>