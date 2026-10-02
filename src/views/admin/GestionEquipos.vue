<template>
    <AppSidebar subtitulo="Panel administrador" :items="[
        { title: 'Notificaciones', icon: 'mdi-bell', to: '/admin' },
        { title: 'Equipos', icon: 'mdi-printer', to: '/admin/equipos' },
        { title: 'Estadísticas', icon: 'mdi-chart-bar', to: '/admin/estadisticas' },
    ]" />

    <v-main class="bg-grey-lighten-4">
        <v-container>
            <h1 class="text-h5 mb-6">Gestión de equipos</h1>

            <v-card class="pa-6 mb-8" max-width="600">
                <v-card-title class="px-0">Dar de alta un equipo</v-card-title>
                <v-form @submit.prevent="crearEquipo">
                    <v-text-field v-model="form.modelo" label="Modelo" variant="outlined" density="comfortable"
                        class="mb-2" required />
                    <v-text-field v-model="form.numeroSerie" label="Número de serie" variant="outlined"
                        density="comfortable" class="mb-2" required />
                    <v-select v-model="form.clienteId" :items="clientes" item-title="nombre" item-value="id"
                        label="Cliente" variant="outlined" density="comfortable" class="mb-2" required />
                    <v-text-field v-model="form.sucursal" label="Sucursal / ubicación" variant="outlined"
                        density="comfortable" class="mb-2" />

                    <v-btn type="submit" color="primary" :loading="guardando">Guardar y generar QR</v-btn>
                </v-form>
            </v-card>

            <v-card v-if="qrGenerado" class="pa-6" max-width="400">
                <v-card-title class="px-0">Etiqueta del equipo</v-card-title>
                <div class="text-center">
                    <img :src="qrGenerado" alt="QR del equipo" width="220" height="220" />
                    <div class="text-caption text-grey-darken-1 mt-2">Folio: {{ ultimoEquipoId }}</div>
                </div>
                <v-btn block color="accent" class="mt-4" @click="descargarQR">
                    Descargar etiqueta
                </v-btn>
            </v-card>
        </v-container>
    </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/firebase/config'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import QRCode from 'qrcode'
import AppSidebar from '@/components/shared/AppSidebar.vue'

const clientes = ref([])
const guardando = ref(false)
const qrGenerado = ref(null)
const ultimoEquipoId = ref('')

const form = ref({
    modelo: '',
    numeroSerie: '',
    clienteId: '',
    sucursal: '',
})

onMounted(async () => {
    const snap = await getDocs(collection(db, 'clientes'))
    clientes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
})

async function crearEquipo() {
    guardando.value = true
    try {
        const docRef = await addDoc(collection(db, 'equipos'), {
            modelo: form.value.modelo,
            numeroSerie: form.value.numeroSerie,
            clienteId: form.value.clienteId,
            sucursal: form.value.sucursal,
            estatus: 'activo',
            fechaInstalacion: serverTimestamp(),
        })

        const urlIncidencia = `${window.location.origin}/incidencia/${docRef.id}`
        qrGenerado.value = await QRCode.toDataURL(urlIncidencia, { width: 220, margin: 1 })
        ultimoEquipoId.value = docRef.id

        form.value = { modelo: '', numeroSerie: '', clienteId: '', sucursal: '' }
    } catch (e) {
        console.error('Error al crear equipo:', e)
    } finally {
        guardando.value = false
    }
}

function descargarQR() {
    const link = document.createElement('a')
    link.href = qrGenerado.value
    link.download = `qr-equipo-${ultimoEquipoId.value}.png`
    link.click()
}
</script>