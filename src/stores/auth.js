import { defineStore } from 'pinia'
import { auth, db } from '@/firebase/config'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    rol: null,        // 'cliente_admin' | 'cliente_usuario' | 'tecnico' | 'admin'
    clienteId: null,
    loading: true,
  }),
  actions: {
    async login(email, password) {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      await this.cargarPerfil(cred.user.uid)
    },
    async logout() {
      await signOut(auth)
      this.user = null
      this.rol = null
    },
    async cargarPerfil(uid) {
      const snap = await getDoc(doc(db, 'usuarios', uid))
      if (snap.exists()) {
        const data = snap.data()
        this.rol = data.rol
        this.clienteId = data.clienteId || null
      }
    },
    initAuthListener() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.user = user
          if (user) {
            await this.cargarPerfil(user.uid)
          } else {
            this.rol = null
            this.clienteId = null
          }
          this.loading = false
          resolve()
        })
      })
    },
  },
})