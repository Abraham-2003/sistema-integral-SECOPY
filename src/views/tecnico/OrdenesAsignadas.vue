<template>
    <AppSidebar subtitulo="Panel técnico" :items="[
        { title: 'Mis órdenes', icon: 'mdi-clipboard-list', to: '/tecnico' },
    ]" />

    <v-main class="bg-grey-lighten-4">
        <v-container>
            <h1 class="text-h5 mb-6">Mis órdenes asignadas</h1>

            <v-card v-if="ordenes.length === 0" class="pa-6 text-center text-grey">
                No tienes órdenes asignadas por el momento.
            </v-card>

            <v-card v-for="orden in ordenes" :key="orden.id" class="pa-4 mb-3">
                <div class="d-flex justify-space-between align-start">
                    <div>
                        <div class="text-subtitle-1 font-weight-bold">{{ orden.motivo }}</div>
                        <div class="text-body-2 text-grey-darken-1">{{ orden.descripcion || 'Sin descripción adicional'
                            }}</div>
                        <v-chip size="small" color="primary" variant="tonal" class="mt-2">
                            {{ orden.estatus }}
                        </v-chip>
                    </div>
                    <v-btn v-if="orden.estatus === 'asignado'" color="accent" size="small"
                        @click="irADetalle(orden.id)">
                        Atender
                    </v-btn>
                </div>
            </v-card>
        </v-container>
    </v-main>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase/config'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/shared/AppSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()
const ordenes = ref([])
let unsub = null

onMounted(() => {
    const q = query(
        collection(db, 'incidencias'),
        where('tecnicoAsignado', '==', authStore.user.uid),
        where('estatus', 'in', ['asignado', 'en_proceso'])
    )
    unsub = onSnapshot(q, (snap) => {
        ordenes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    })
})

onUnmounted(() => {
    if (unsub) unsub()
})

function irADetalle(id) {
    router.push(`/tecnico/orden/${id}`)
}

async function handleLogout() {
    await authStore.logout()
    router.push('/login')
}
</script>