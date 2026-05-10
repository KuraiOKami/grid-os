// ── mailStore.ts ─────────────────────────────────────────────────────────────
// Zustand store for the in-game mail system.
// Seed mails load on first access. `send()` prepends a new mail.
// `markRead()` decrements the unread counter.

import { create } from 'zustand'

export interface Mail {
  id:       string
  storyId?: string  // e.g. 'E-01' — used by triggerEngine for objective matching
  tag:      'SYSTEM' | 'LORE' | 'JOB' | 'NPC' | 'THREAT' | 'ANON'
  from:     string
  subject:  string
  date:     string
  body:     string
  unread:   boolean
  dot?:     string
  watchCode?: string
}

// Inbox starts empty — all story mails arrive via the email queue on timers.
const SEED_MAILS: Mail[] = []

interface MailState {
  mails:       Mail[]
  unreadCount: () => number
  markRead:    (id: string) => void
  send:        (mail: Omit<Mail, 'id'>) => void
}

export const useMailStore = create<MailState>((set, get) => ({
  mails: SEED_MAILS,

  unreadCount: () => get().mails.filter(m => m.unread).length,

  markRead: (id: string) =>
    set(s => ({ mails: s.mails.map(m => m.id === id ? { ...m, unread: false } : m) })),

  send: (mail: Omit<Mail, 'id'>) => {
    const id = `mail-${Date.now()}`
    set(s => ({ mails: [{ ...mail, id }, ...s.mails] }))
  },
}))
