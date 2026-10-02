<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-6" elevation="4">
          <v-card-title class="text-h5 mb-4">Iniciar sesión</v-card-title>

          <v-form @submit.prevent="handleLogin">
            <v-text-field
              v-model="email"
              label="Correo electrónico"
              type="email"
              variant="outlined"
              class="mb-2"
              required
            />
            <v-text-field
              v-model="password"
              label="Contraseña"
              type="password"
              variant="outlined"
              class="mb-2"
              required
            />

            <v-alert v-if="error" type="error" density="compact" class="mb-4">
              {{ error }}
            </v-alert>

            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="cargando"
            >
              Entrar
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const rutaPorRol = {
  cliente_admin: '/cliente',
  cliente_usuario: '/cliente',
  tecnico: '/tecnico',
  admin: '/admin',
}

async function handleLogin() {
  error.value = ''
  cargando.value = true
  try {
    await authStore.login(email.value, password.value)
    const destino = route.query.redirect || rutaPorRol[authStore.rol]
    if (!rutaPorRol[authStore.rol]) {
      error.value = 'Tu usuario no tiene un rol asignado. Contacta al administrador.'
      await authStore.logout()
      return
    }
    router.push(destino)
  } catch (e) {
    error.value = 'Correo o contraseña incorrectos.'
  } finally {
    cargando.value = false
  }
}
</script>