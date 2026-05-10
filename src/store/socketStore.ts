import { create } from 'zustand'

export interface SocketMessage {
  id:   string
  from: 'you' | 'them'
  body: string
  ts:   number
}

export interface SocketContact {
  id:       string
  handle:   string
  status:   'online' | 'offline' | 'away'
  unread:   number
  faction?: string
  bio?:     string
}

// Scripted NPC replies — cycled through as player sends messages
const NPC_REPLIES: Record<string, string[]> = {
  'anon-7731': [
    'Acknowledged.',
    'Don\'t use names. Ever.',
    'The data you need is behind a gate. You know what to do.',
    'I\'ve used four different nodes to send you this. Don\'t make me regret it.',
    'Payment clears on delivery. VoidBay escrow. No disputes.',
    'Time-sensitive. ROOT BLOOM is cycling in 48 hours. After that the source nodes are gone.',
    '...',
  ],
  'fixr-kad': [
    'Yo. Heard you were operational.',
    'Got a job. Off-books. Interested?',
    'Standard rate. Half up front, half on delivery. You know the deal.',
    'Don\'t ask me where it came from.',
    'I don\'t know you. You don\'t know me. We\'re good.',
  ],
  'guild-op': [
    'The Guild values discretion above all.',
    'We\'ve been watching your work. Promising.',
    'There\'s a place for skilled operators who know when to act and when to observe.',
    'Every record has a price. Every secret has a buyer. We find both.',
    'When you\'re ready to formalize things, you know where to find us.',
  ],
}

const seed = (id: string, from: 'you' | 'them', body: string, ago: number): SocketMessage => ({
  id, from, body, ts: Date.now() - ago,
})

const INITIAL_CONVERSATIONS: Record<string, SocketMessage[]> = {
  'anon-7731': [
    seed('a1', 'them', 'You don\'t know me. That\'s intentional.', 7_200_000),
    seed('a2', 'them', 'I need a civic.archive exfil — the redacted ROOT BLOOM timeline records. ₳1,400 on delivery. VoidBay escrow. No names, no logs.', 3_600_000),
  ],
  'fixr-kad': [],
  'guild-op': [
    seed('g1', 'them', 'The Guild is watching. You\'ve been flagged as a person of interest — not a threat. An opportunity. When you\'re ready to talk, we\'re here.', 86_400_000),
  ],
}

interface SocketState {
  contacts:      SocketContact[]
  conversations: Record<string, SocketMessage[]>
  activeContact: string | null
  replyTimers:   Record<string, number>   // contactId → reply index

  setActiveContact: (id: string | null) => void
  sendMessage:      (contactId: string, body: string) => void
  markRead:         (contactId: string) => void
  receiveMessage:   (contactId: string, body: string) => void
  advanceReply:     (contactId: string) => void
}

export const useSocketStore = create<SocketState>((set, get) => ({
  contacts: [
    { id: 'anon-7731', handle: 'ANON_7731',    status: 'online',  unread: 2 },
    { id: 'fixr-kad',  handle: 'FIXR_KAD',     status: 'offline', unread: 0, faction: 'synd', bio: 'Fixer. Syndicate-adjacent. Don\'t ask.' },
    { id: 'guild-op',  handle: 'GUILD_HANDLER', status: 'away',    unread: 1, faction: 'guild', bio: 'Official Guild operations channel.' },
  ],
  conversations: INITIAL_CONVERSATIONS,
  activeContact: null,
  replyTimers:   {},

  setActiveContact: (id) => set({ activeContact: id }),

  sendMessage: (contactId, body) => {
    const msg: SocketMessage = { id: Date.now().toString(), from: 'you', body, ts: Date.now() }
    set(s => ({
      conversations: {
        ...s.conversations,
        [contactId]: [...(s.conversations[contactId] ?? []), msg],
      },
    }))

    // Schedule NPC reply
    const replies   = NPC_REPLIES[contactId]
    const idx       = get().replyTimers[contactId] ?? 0
    if (replies && replies[idx] !== undefined) {
      setTimeout(() => {
        get().receiveMessage(contactId, replies[idx])
        get().advanceReply(contactId)
      }, 2000 + Math.random() * 3000)
    }
  },

  markRead: (contactId) => set(s => ({
    contacts: s.contacts.map(c => c.id === contactId ? { ...c, unread: 0 } : c),
  })),

  receiveMessage: (contactId, body) => {
    const msg: SocketMessage = { id: Date.now().toString(), from: 'them', body, ts: Date.now() }
    set(s => ({
      conversations: {
        ...s.conversations,
        [contactId]: [...(s.conversations[contactId] ?? []), msg],
      },
      contacts: s.contacts.map(c =>
        c.id === contactId && s.activeContact !== contactId
          ? { ...c, unread: c.unread + 1 } : c
      ),
    }))
  },

  advanceReply: (contactId) => set(s => ({
    replyTimers: { ...s.replyTimers, [contactId]: (s.replyTimers[contactId] ?? 0) + 1 },
  })),
}))
