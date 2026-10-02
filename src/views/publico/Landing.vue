<template>
  <div>
    <v-app-bar flat color="white">
      <v-container class="d-flex align-center">
        <span class="text-h6 font-weight-bold">SECOPY</span>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="$router.push('/login')">
          Iniciar sesión
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-sheet color="grey-lighten-4" class="py-16">
      <v-container class="text-center">
        <h1 class="text-h3 font-weight-bold mb-4">
          Renta de impresoras y papelería para tu empresa
        </h1>
        <p class="text-body-1 text-grey-darken-1 mb-6">
          Equipos, mantenimiento e insumos, sin complicaciones. Nosotros nos encargamos del servicio técnico.
        </p>
        <v-btn color="primary" size="large" @click="$router.push('/login')">
          Acceder a mi cuenta
        </v-btn>
      </v-container>
    </v-sheet>

    <v-container class="py-12">
      <v-row>
        <v-col cols="12" md="4" v-for="item in servicios" :key="item.titulo">
          <v-card class="pa-6 h-100" variant="outlined">
            <v-icon :icon="item.icono" size="36" color="primary" class="mb-3" />
            <div class="text-h6 mb-2">{{ item.titulo }}</div>
            <div class="text-body-2 text-grey-darken-1">{{ item.descripcion }}</div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <v-footer class="justify-center pa-6" color="grey-lighten-3">
      <span class="text-caption text-grey-darken-1">© {{ new Date().getFullYear() }} SECOPY. Todos los derechos reservados.</span>
    </v-footer>
  </div>
</template>

<script setup>
const servicios = [
  {
    titulo: 'Renta de equipos',
    descripcion: 'Impresoras para tu oficina, con mantenimiento incluido.',
    icono: 'mdi-printer',
  },
  {
    titulo: 'Insumos y papelería',
    descripcion: 'Tóner, papel y consumibles, solicitados desde tu portal.',
    icono: 'mdi-package-variant',
  },
  {
    titulo: 'Soporte técnico',
    descripcion: 'Reporta una falla escaneando el QR de tu equipo y listo.',
    icono: 'mdi-qrcode-scan',
  },
]
</script>