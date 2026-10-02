import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const secopyTheme = {
  dark: false,
  colors: {
    primary: '#1A3A6B',
    'primary-darken-1': '#0F2440',
    secondary: '#4A5A73',
    accent: '#C41E3A',
    error: '#C41E3A',
    success: '#1B7A4D',
    background: '#F7F8FA',
    surface: '#FFFFFF',
    'on-primary': '#FFFFFF',
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'secopyTheme',
    themes: { secopyTheme },
  },
  defaults: {
    VCard: { elevation: 0, border: true, rounded: 'lg' },
    VBtn: { rounded: 'lg' },
    VTextField: { rounded: 'lg' },
  },
})