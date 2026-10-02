<template>
  <v-app-bar :color="mobile ? 'primary' : 'surface'" :elevation="mobile ? 2 : 0" density="comfortable">
    <v-app-bar-nav-icon v-if="mobile" :color="mobile ? 'white' : undefined" @click="drawerAbierto = !drawerAbierto" />
    <v-app-bar-title v-if="mobile" class="text-white font-weight-medium">
      {{ subtitulo }}
    </v-app-bar-title>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawerAbierto"
    :permanent="!mobile"
    :temporary="mobile"
    color="primary"
    theme="dark"
  >
    <v-list-item class="pa-4">
      <span class="text-h6 font-weight-bold">SECOPY</span>
      <div class="text-caption">{{ subtitulo }}</div>
    </v-list-item>
    <v-divider />
    <v-list nav density="comfortable">
      <v-list-item
        v-for="item in items"
        :key="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        :to="item.to"
        rounded="lg"
        class="mx-2"
        @click="mobile && (drawerAbierto = false)"
      />
      <v-list-item
        prepend-icon="mdi-logout"
        title="Cerrar sesión"
        rounded="lg"
        class="mx-2"
        @click="handleLogout"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps({
  subtitulo: { type: String, default: '' },
  items: { type: Array, required: true },
})

const { mobile } = useDisplay()
const drawerAbierto = ref(!mobile.value)

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>