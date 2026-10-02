import { defineStore } from 'pinia'
import { db } from '@/firebase/config'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'

export const useNotificacionesStore = defineStore('notificaciones', {
  state: () => ({
    incidenciasPendientes: [],
    mantenimientosPendientes: [],
    solicitudesInsumosPendientes: [],
    unsubs: [],
  }),
  getters: {
    totalPendientes: (state) =>
      state.incidenciasPendientes.length +
      state.mantenimientosPendientes.length +
      state.solicitudesInsumosPendientes.length,
  },
  actions: {
    iniciarEscucha() {
      this.detenerEscucha() // evita listeners duplicados si se llama dos veces

      const qIncidencias = query(
        collection(db, 'incidencias'),
        where('estatus', '==', 'pendiente'),
        orderBy('fechaCreacion', 'desc')
      )
      const qMantenimientos = query(
        collection(db, 'mantenimientos'),
        where('estatus', '==', 'pendiente')
      )
      const qInsumos = query(
        collection(db, 'solicitudesInsumos'),
        where('estatus', '==', 'pendiente')
      )

      this.unsubs.push(
        onSnapshot(qIncidencias, (snap) => {
          this.incidenciasPendientes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        })
      )
      this.unsubs.push(
        onSnapshot(qMantenimientos, (snap) => {
          this.mantenimientosPendientes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        })
      )
      this.unsubs.push(
        onSnapshot(qInsumos, (snap) => {
          this.solicitudesInsumosPendientes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        })
      )
    },
    detenerEscucha() {
      this.unsubs.forEach(unsub => unsub())
      this.unsubs = []
    },
  },
})