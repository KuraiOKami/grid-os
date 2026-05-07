// ── emailQueue.ts ─────────────────────────────────────────────────────────────
// Timed and conditional email delivery system.
//
// Emails sit in a queue with a `deliverAt` timestamp (ms) and an optional
// `condition` guard. The tick() function is called by the app at a regular
// interval (e.g. every 30s) and flushes any emails that are ready.
//
// STORY_MAP.md email timeline is the canonical source of truth.
// Only Phase 0 (boot sequence) emails are seeded here for M-01/M-02/M-03.
// Later phases add their queued emails dynamically via `queueEmail()`.
//
// Usage:
//   import { useEmailQueueStore } from './emailQueue'
//   const { tick, queueEmail } = useEmailQueueStore()

import { create } from 'zustand'
import type { Mail } from './mailStore'

export interface QueuedEmail {
  id:          string
  deliverAt:   number                   // Date.now() + delay ms
  condition?:  () => boolean            // if present, must return true to deliver
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

// ── Boot sequence emails ──────────────────────────────────────────────────────
// These are seeded at game start. Delays are relative to the time queueBootSequence()
// is called — call it immediately when the game initializes.
//
// Phase 0 sequence per STORY_MAP.md:
//   E-01 — immediate on game start
//   E-02 — +2 min after E-01 read  → queued by triggerEngine after E-01 read
//   E-03 — immediate after M-01 complete → queued by triggerEngine on M-01 complete
//   E-04 — +5 min after E-03 read   → queued by triggerEngine after E-03 read
//
// Only E-01 is pre-seeded here since it fires immediately. All subsequent
// emails in the chain are queued dynamically by the trigger engine.

export const BOOT_EMAILS = {
  'E-01': {
    tag:     'SYSTEM' as const,
    from:    'greta-7@gridos.corp',
    subject: 'Welcome to GridOS',
    date:    new Date().toLocaleString('en-GB', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ' //'),
    dot:     '#00e5ff',
    body:
`Welcome, citizen.

Your node has been initialized. GridOS is your terminal, your workspace, and your record.

Everything you do here is logged.

To get started:
  — Open the browser and visit gridos.corp
  — Check your inbox — you have more messages waiting
  — Open the file manager when you're ready

I'll be here if you need guidance.

— GRETA-7 // Citizen Onboarding System`,
  },

  'E-02': {
    tag:     'NPC' as const,
    from:    'mtell@gridos.corp',
    subject: 'Your first shift',
    date:    '',  // set dynamically at delivery time
    dot:     '#aaaaaa',
    body:
`Hey.

You've been assigned to the open contracts queue. There are jobs listed at gridos.corp/careers and at clearpath.gridcorp.net.

Pick one. Complete it. That's the job.

Don't overthink it.

— Marcus Tell
  Infrastructure Division, GridOS`,
  },

  'E-03': {
    tag:     'SYSTEM' as const,
    from:    'hr@gridos.corp',
    subject: 'Your employment agreement',
    date:    '',
    dot:     '#00e5ff',
    body:
`GRIDCORP CITIZEN SERVICES — EMPLOYMENT AGREEMENT

By continuing to use this terminal, you acknowledge and agree to the following:

  1. All activity on this node is logged and retained indefinitely.
  2. Contract earnings are disbursed in GridCredits (₳) to your registered wallet.
  3. Behavioral compliance is tracked. Your score is visible to GridOS operators.
  4. GridOS reserves the right to adjust, suspend, or terminate any citizen account at any time.

This agreement takes effect immediately upon first job completion.

Stay productive.

— GridOS Human Resources`,
  },

  'E-04': {
    tag:     'SYSTEM' as const,
    from:    'greta-7@gridos.corp',
    subject: 'Tips for new employees',
    date:    '',
    dot:     '#00e5ff',
    body:
`A few things that might help:

  — Your reputation score has two axes: Compliance and Shadow.
    Compliance goes up when you work with GridOS. Shadow goes up when you don't.
    You can have both high. You can have both low. Neither is better.

  — The browser has a history. Things you visit leave traces.

  — Some jobs require specific tools or access levels. Read carefully.

  — If you have questions, I'm always listening.

— GRETA-7`,
  },

  'E-10': {
    tag:     'ANON' as const,
    from:    'null@void.null',
    subject: '[no subject]',
    date:    '',
    dot:     '#ff9900',
    body:
`You've been looking at the right things. That's unusual.

I have work, if you're interested. The pay is real. The risk is real too.

Reply to this address if you want to know more. If you forward it, you won't hear from me again.

— Null`,
  },
} satisfies Record<string, Omit<Mail, 'id' | 'unread'>>

// ── Store ─────────────────────────────────────────────────────────────────────

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
      const isReady = now >= entry.deliverAt
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
      date:   new Date().toLocaleString('en-GB', {
        month:   '2-digit',
        day:     '2-digit',
        hour:    '2-digit',
        minute:  '2-digit',
        hour12:  false,
      }).replace(',', ' //'),
    }))
  },

  cancelEmail: (id) =>
    set(s => ({ queue: s.queue.filter(e => e.id !== id) })),
}))

// ── Helper ────────────────────────────────────────────────────────────────────
// Queue E-01 immediately at game boot.
// Call this once from the app's initialization logic (e.g. App.tsx useEffect).
export function queueBootEmail() {
  useEmailQueueStore.getState().queueEmail({
    deliverAt: Date.now(),
    mail:      BOOT_EMAILS['E-01'],
  })
}
