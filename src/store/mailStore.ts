// ── mailStore.ts ─────────────────────────────────────────────────────────────
// Global mail store. Emails are the primary delivery channel for:
//   - Job offers from corps and anonymous contacts
//   - App unlock codes from the App Store
//   - Lore / world events
//   - NPC replies when player actions affect them

import { create } from 'zustand'

export type MailTag = 'job' | 'system' | 'lore' | 'unlock' | 'npc' | 'threat'

export interface Mail {
  id: string
  from: string
  subject: string
  body: string          // plain text, may contain \n for line breaks
  timestamp: string     // display string e.g. "06.05 // 14:32"
  tag: MailTag
  read: boolean
  // If set, opening this mail fires a side-effect (e.g. unlock a flag)
  onOpen?: () => void
}

interface MailStore {
  mails: Mail[]
  send:  (mail: Omit<Mail, 'id' | 'read'>) => void
  markRead: (id: string) => void
  unreadCount: () => number
}

function uid() { return `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }
function now() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm} // ${hh}:${min}`
}

// ─ seed inbox ──────────────────────────────────────────────────────────────────
const SEED_MAILS: Mail[] = [
  {
    id: 'seed-001',
    from: 'system@gridos.corp',
    subject: 'Welcome to GridOS — Citizen Onboarding',
    body: `Your node has been registered.

You have been assigned a standard-tier citizen profile.
All activity on this terminal is logged and may be reviewed
by a Compliance Operator at any time.

Stay productive. Stay visible.

— GridOS Citizen Services`,
    timestamp: '06.05 // 09:00',
    tag: 'system',
    read: false,
  },
  {
    id: 'seed-002',
    from: 'no-reply@pulse.news',
    subject: 'Your daily digest is ready',
    body: `Headlines for today:

■ GridOS quarterly compliance rate reaches 94.7%
■ Civic Archive access suspended pending review
■ Anonymous courier network reports record volume
■ ROOT BLOOM: officials call claims "fabricated"

Read more at pulse.news`,
    timestamp: '06.05 // 09:14',
    tag: 'lore',
    read: false,
  },
  {
    id: 'seed-003',
    from: 'contracts@gridos.corp',
    subject: 'New contract available — Compliance Analyst',
    body: `A position has opened in our Compliance Review division.

Role: Analyst I — Citizen Review
Pay: ₳ 420 / session
Clearance required: Standard

This role involves reviewing citizen activity logs
and submitting recommendations to our oversight team.

To accept this contract, install the Watch app
via the App Store.

Access code: WATCH-GRID-01

— GridOS Contract Services`,
    timestamp: '06.05 // 10:02',
    tag: 'job',
    read: false,
  },
  {
    id: 'seed-004',
    from: 'anon@void.null',
    subject: 're: you were asking about the archive',
    body: `Don't use your real handle for this.

The archive is real. The flowering pages are cached.
If you want access, you know what to do.

Find the right jobs. Make the right calls.
Some apps aren't on the official store.

— [sender address scrubbed]`,
    timestamp: '06.05 // 11:47',
    tag: 'npc',
    read: false,
  },
  {
    id: 'seed-005',
    from: 'system@gridos.corp',
    subject: '[AUTOMATED] Suspicious activity detected on your node',
    body: `Our systems have flagged unusual browsing patterns
on your registered terminal.

This notice is for your awareness.
No action has been taken at this time.

Continued anomalous activity may result in
a compliance review being opened on your account.

If you believe this is an error, do nothing.

— GridOS Automated Security`,
    timestamp: '06.05 // 13:30',
    tag: 'threat',
    read: false,
  },
]

export const useMailStore = create<MailStore>((set, get) => ({
  mails: SEED_MAILS,

  send: (mail) =>
    set(state => ({
      mails: [{ ...mail, id: uid(), read: false }, ...state.mails],
    })),

  markRead: (id) =>
    set(state => ({
      mails: state.mails.map(m =>
        m.id === id ? { ...m, read: true } : m
      ),
    })),

  unreadCount: () => get().mails.filter(m => !m.read).length,
}))
