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

const SEED_MAILS: Mail[] = [
  {
    id: 'sys-001',
    tag: 'SYSTEM',
    from: 'system@gridos.corp',
    subject: 'Welcome to GridOS — Citizen Onboarding',
    date: '06.05 // 09:00',
    unread: true,
    dot: '#00e5ff',
    body: `Your node has been registered.

You have been assigned a standard-tier citizen profile. All activity on this terminal is logged and may be reviewed by a Compliance Operator at any time.

Stay productive. Stay visible.

— GridOS Citizen Services`,
  },
  {
    id: 'lore-001',
    tag: 'LORE',
    from: 'no-reply@pulse.news',
    subject: 'Your daily digest is ready',
    date: '06.05 // 09:14',
    unread: true,
    body: `PULSE NETWORK  //  MORNING DIGEST

──────────────────────────────────────
ROOT BLOOM NETWORK — third cell disrupted this week. GridOS officials say containment is "proceeding as scheduled." Anonymous sources say otherwise.

CIVIC ARCHIVE — access suspended pending routine maintenance. Estimated downtime: indefinite.

GRIDMART EXPANSION — three new fulfillment nodes brought online in Sector 9. Workforce integration underway.

ANONYMOUS COURIER GUILD — two members listed as inactive. No further details provided.
──────────────────────────────────────

Stay informed. Stay compliant.
— Pulse Network`,
  },
  {
    id: 'job-001',
    tag: 'JOB',
    from: 'contracts@gridos.corp',
    subject: 'New contract available — Compliance Analyst, Level 1',
    date: '06.05 // 10:02',
    unread: true,
    dot: '#00cc88',
    watchCode: 'WATCH-GRID-01',
    body: `A contract position has been approved for your profile.

ROLE: Compliance Review Analyst — Level 1
CLIENT: GridOS Corp
PAY: ₢ 120 / review session
CLEARANCE: Standard

This role requires access to the Watch compliance review system.

To install Watch, open the App Store and locate it under RESTRICTED apps.
Access code: WATCH-GRID-01

This code is single-use and tied to your citizen ID. Do not share it.

— GridOS Contract Services`,
  },
  {
    id: 'npc-001',
    tag: 'NPC',
    from: 'anon@void.null',
    subject: 're: you were asking about the archive...',
    date: '06.05 // 11:47',
    unread: true,
    body: `You didn't ask. But you would have eventually.

The civic archive is still partially accessible. Not through the front door.

Some apps on the official store aren't the only ones that exist.

That's all I'm saying.

— [sender scrubbed]`,
  },
  {
    id: 'threat-001',
    tag: 'THREAT',
    from: 'system@gridos.corp',
    subject: '[AUTOMATED] Suspicious activity detected on your node',
    date: '06.05 // 13:30',
    unread: true,
    dot: '#ff3b5c',
    body: `[AUTOMATED SECURITY NOTICE]

Unusual access patterns have been detected on your terminal.

This notice has been logged.

If you believe this is an error, no action is required. Your compliance record will reflect this event regardless.

— GridOS Security Division`,
  },
]

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
