// ── emailQueue.ts ────────────────────────────────────────────────────────
// Timed and conditional email delivery system.
//
// Emails sit in a queue with a `deliverAt` timestamp (ms) and an optional
// `condition` guard. The tick() function is called by the app at a regular
// interval (e.g. every 30s) and flushes any emails that are ready.
//
// All email content lives in the Supabase `mail_templates` table.
// Game code calls fetchMailTemplate(storyId) — no hardcoded bodies here.
//
// Usage:
//   import { useEmailQueueStore } from './emailQueue'
//   const { tick, queueEmail } = useEmailQueueStore()

import { create } from 'zustand'
import type { Mail } from './mailStore'
import { fetchMailTemplate } from '../lib/mailTemplates'

export interface QueuedEmail {
  id:          string
  deliverAt:   number            // Date.now() + delay ms
  condition?:  () => boolean     // if present, must return true to deliver
  mail:        Omit<Mail, 'id' | 'unread'>
}

interface EmailQueueState {
  queue: QueuedEmail[]

  // Queue a new email for future delivery
  queueEmail: (entry: Omit<QueuedEmail, 'id'>) => void

  // Called by the app on an interval. Delivers any due emails.
  // Returns the mails that were delivered this tick (caller adds them to mailStore).
  tick: () => Array<Omit<Mail, 'id'>>

  // Remove a specific queued email (e.g. if a condition makes it irrelevant)
  cancelEmail: (id: string) => void
}

// ── Store ───────────────────────────────────────────────────────────────────
export const useEmailQueueStore = create<EmailQueueState>((set, get) => ({
  queue: [],

  queueEmail: (entry) => {
    const id = `queued-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set(s => ({ queue: [...s.queue, { ...entry, id }] }))
  },

  tick: () => {
    const now = Date.now()
    const { queue } = get()
    const toDeliver: QueuedEmail[] = []
    const remaining: QueuedEmail[] = []

    for (const entry of queue) {
      const isReady      = now >= entry.deliverAt
      const conditionMet = entry.condition == null || entry.condition()
      if (isReady && conditionMet) {
        toDeliver.push(entry)
      } else {
        remaining.push(entry)
      }
    }

    if (toDeliver.length > 0) {
      set({ queue: remaining })
    }

    return toDeliver.map(e => ({
      ...e.mail,
      unread: true,
      date: new Date().toLocaleString('en-GB', {
        month:   '2-digit',
        day:     '2-digit',
        hour:    '2-digit',
        minute:  '2-digit',
        hour12:  false,
      }).replace(',', ' //'),
    }))
  },

  cancelEmail: (id) => set(s => ({ queue: s.queue.filter(e => e.id !== id) })),
}))

// ── Helper ───────────────────────────────────────────────────────────────────────
// Queue E-01 immediately at game boot by fetching it from Supabase.
// Call this once from the app's initialization logic (e.g. App.tsx useEffect).
export async function queueBootEmail(): Promise<void> {
  const template = await fetchMailTemplate('E-01')
  if (!template) {
    console.error('[emailQueue] Failed to load E-01 boot email from Supabase')
    return
  }
  useEmailQueueStore.getState().queueEmail({
    deliverAt: Date.now(),
    mail: {
      storyId:   template.storyId,
      tag:       template.tag,
      from:      template.from,
      subject:   template.subject,
      dot:       template.dot ?? '',
      watchCode: template.watchCode,
      body:      template.body,
      date:      '',   // set by tick() at delivery time
    },
  })
}

// Queue any story email by storyId (used by trigger engine for E-02, E-03, E-04, E-10, etc.)
export async function queueStoryEmail(
  storyId: string,
  delayMs: number = 0,
  condition?: () => boolean
): Promise<void> {
  const template = await fetchMailTemplate(storyId)
  if (!template) {
    console.error(`[emailQueue] Failed to load story email "${storyId}" from Supabase`)
    return
  }
  useEmailQueueStore.getState().queueEmail({
    deliverAt: Date.now() + delayMs,
    condition,
    mail: {
      storyId:   template.storyId,
      tag:       template.tag,
      from:      template.from,
      subject:   template.subject,
      dot:       template.dot ?? '',
      watchCode: template.watchCode,
      body:      template.body,
      date:      '',   // set by tick() at delivery time
    },
  })
}
