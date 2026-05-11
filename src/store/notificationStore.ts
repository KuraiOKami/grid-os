// ── notificationStore.ts ──────────────────────────────────────────────────────────
// Windows-style bottom-right toast notifications.
// Usage anywhere:
//   useNotificationStore.getState().push({ title: 'Mission', body: 'M-01 activated' })

import { create } from 'zustand'

export type NotifType = 'info' | 'success' | 'warning' | 'danger' | 'mission' | 'mail'

export interface Notification {
  id:        string
  title:     string
  body?:     string
  type?:     NotifType
  /** ms until auto-dismiss. Default 5000. Pass 0 to persist. */
  duration?: number
  /** ISO timestamp */
  at:        string
}

interface NotifState {
  toasts: Notification[]
  push:   (n: Omit<Notification, 'id' | 'at'>) => void
  dismiss: (id: string) => void
  clear:   () => void
}

export const useNotificationStore = create<NotifState>((set) => ({
  toasts: [],

  push: (n) => {
    const id  = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const dur = n.duration ?? 5000
    const toast: Notification = { ...n, id, at: new Date().toISOString() }

    set(s => ({ toasts: [...s.toasts, toast] }))

    if (dur > 0) {
      setTimeout(() => {
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
      }, dur)
    }
  },

  dismiss: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}))
