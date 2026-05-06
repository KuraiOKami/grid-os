// ── nodeStore.ts ────────────────────────────────────────────────────────────
// Zustand store for NODE — the in-world social media platform.
// Signals (posts), uplinks (likes), relays (retweets), follows.

import { create } from 'zustand'
import type { FactionId } from '@/lib/factions'

export type AccountType = 'citizen' | 'verified' | 'anon' | 'bot'

export interface NodeAccount {
  id:       string
  handle:   string          // @handle
  display:  string          // display name
  type:     AccountType
  faction?: FactionId
  avatar:   string          // short string used as pixel avatar placeholder
  bio:      string
  subs:     number          // subscriber count (NPC accounts)
}

export interface Signal {
  id:        string
  authorId:  string
  body:      string
  ts:        number         // unix ms
  uplinks:   number
  relays:    number
  tags:      string[]       // #tag strings
  pinned?:   boolean
  isPlayer?: boolean        // true if authored by local player
  relayOf?:  string         // original signal id if relay
}

interface NodeState {
  // feed
  signals:      Signal[]
  following:    string[]      // account ids player follows
  uplinked:     string[]      // signal ids player has uplinked
  relayed:      string[]      // signal ids player has relayed

  // compose
  drafting:     boolean
  draftBody:    string

  // actions
  postSignal:   (body: string, tags?: string[]) => void
  uplink:       (id: string) => void
  relay:        (id: string) => void
  follow:       (accountId: string) => void
  unfollow:     (accountId: string) => void
  setDraft:     (v: string) => void
  setDrafting:  (v: boolean) => void
}

// ── NPC Accounts ────────────────────────────────────────────────────────────
export const NPC_ACCOUNTS: NodeAccount[] = [
  {
    id: 'nexus-official', handle: 'nexus_authority', display: 'NEXUS AUTHORITY',
    type: 'verified', faction: 'nexus', avatar: 'N', subs: 2841033,
    bio: 'Official broadcast channel of the NEXUS AUTHORITY. Compliance is prosperity.',
  },
  {
    id: 'synd-whisper', handle: 'synd_whisper', display: 'Syndicate Whisper',
    type: 'anon', faction: 'synd', avatar: 'S', subs: 94200,
    bio: 'Market tips. No names. No traces. // encrypted',
  },
  {
    id: 'phx-leak', handle: 'PHX_LEAKS', display: '[REDACTED]',
    type: 'anon', faction: 'phantom', avatar: 'P', subs: 441700,
    bio: 'We are everywhere. We are no one. Signal when ready.',
  },
  {
    id: 'guild-notice', handle: 'guild_board', display: 'The Guild — Official',
    type: 'verified', faction: 'guild', avatar: 'G', subs: 380500,
    bio: 'Guild contract postings, craft advisories, and union news.',
  },
  {
    id: 'iron-dispatch', handle: 'IRON_OPS', display: 'Iron Circuit Dispatch',
    type: 'anon', faction: 'iron', avatar: 'I', subs: 128400,
    bio: 'Contracts available. Standards enforced. Do not DM.',
  },
  {
    id: 'citizen-vex', handle: 'v3x_runs', display: 'Vex',
    type: 'citizen', faction: 'phantom', avatar: 'V', subs: 3200,
    bio: 'runner. coder. trying not to get flagged. #PHX sympathizer',
  },
  {
    id: 'citizen-mira', handle: 'mira_guild', display: 'Mira ★',
    type: 'verified', faction: 'guild', avatar: 'M', subs: 12800,
    bio: 'Senior Craftworker, Guild Tier 3. Workbench tutorials & component reviews.',
  },
  {
    id: 'citizen-kade', handle: 'kade_synd', display: 'Kade',
    type: 'citizen', faction: 'synd', avatar: 'K', subs: 8800,
    bio: 'market watcher. if the ledger moves i post it. not financial advice.',
  },
  {
    id: 'bot-pulse', handle: 'PULSE_BOT', display: 'Pulse ⚡',
    type: 'bot', avatar: '!', subs: 55000,
    bio: 'Automated frequency tracker. Top signals every hour. Not affiliated.',
  },
]

// ── Seed signals ────────────────────────────────────────────────────────────
const NOW = Date.now()
const MIN = 60_000

const SEED_SIGNALS: Signal[] = [
  {
    id: 's1', authorId: 'nexus-official',
    body: 'Compliance window closes in 72 hours. All citizens must file their Sector 7 activity reports before the deadline or face automated review. This is your only reminder. #NexusAlert #Compliance',
    ts: NOW - 4 * MIN, uplinks: 18400, relays: 3200,
    tags: ['NexusAlert', 'Compliance'], pinned: true,
  },
  {
    id: 's2', authorId: 'phx-leak',
    body: 'NEXUS Sector 7 compliance push is a dragnet. They\'re looking for three specific citizens connected to the Varn data breach. Don\'t file. Don\'t engage. Sit quiet. // verified by two cells #PHX #OPSEC',
    ts: NOW - 3 * MIN, uplinks: 9200, relays: 4100,
    tags: ['PHX', 'OPSEC'],
  },
  {
    id: 's3', authorId: 'citizen-vex',
    body: 'so do i file the sector 7 report or not because i have two very different opinions in my feed right now and neither one wants to show their face',
    ts: NOW - 28 * MIN, uplinks: 441, relays: 88,
    tags: [],
  },
  {
    id: 's4', authorId: 'synd-whisper',
    body: 'Ledger position: SYN-7 futures up 14% since the sector report announcement. Compliance fear = NEXUS contract demand = SYND margin. As always. #Ledger #Trade',
    ts: NOW - 45 * MIN, uplinks: 2100, relays: 780,
    tags: ['Ledger', 'Trade'],
  },
  {
    id: 's5', authorId: 'guild-notice',
    body: 'CONTRACT POSTED — Client requests 3x Tier-2 Workbench fabricators for a 14-day infrastructure build. Guild members in good standing only. Apply via ContractHub before slot fills. #Guild #Contract',
    ts: NOW - 1.2 * 60 * MIN, uplinks: 880, relays: 230,
    tags: ['Guild', 'Contract'],
  },
  {
    id: 's6', authorId: 'citizen-mira',
    body: 'Reminder that Workbench v2.4 dropped yesterday. The new alloy recipes are worth grinding — especially the carbon lattice frame. Full breakdown on my page. #Guild #Workbench #Crafting',
    ts: NOW - 2 * 60 * MIN, uplinks: 3400, relays: 910,
    tags: ['Guild', 'Workbench', 'Crafting'],
  },
  {
    id: 's7', authorId: 'iron-dispatch',
    body: 'Three contracts fulfilled this cycle. Zero complications. If you need something done without a paper trail, you know where the door is. #IronCircuit',
    ts: NOW - 3 * 60 * MIN, uplinks: 1200, relays: 340,
    tags: ['IronCircuit'],
  },
  {
    id: 's8', authorId: 'citizen-kade',
    body: 'market watch: SYN-7 futures spiking, IRON options quietly climbing. someone knows something. not telling you to buy but i\'m not selling #Ledger',
    ts: NOW - 4 * 60 * MIN, uplinks: 560, relays: 200,
    tags: ['Ledger'],
  },
  {
    id: 's9', authorId: 'bot-pulse',
    body: '⚡ FREQUENCY REPORT — Top signals this hour: #NexusAlert #PHX #OPSEC #Ledger. Rising: #Sector7 #Varn. Declining: #GridWork. Anomaly detected in #IronCircuit volume. Monitoring.',
    ts: NOW - 5 * 60 * MIN, uplinks: 4400, relays: 1800,
    tags: ['NexusAlert', 'PHX', 'Ledger'],
  },
  {
    id: 's10', authorId: 'citizen-vex',
    body: 'successfully ran a ghost trace on three NEXUS nodes last night without triggering a flag. don\'t ask how. do ask if you need the tutorial #PHX #GhostShell',
    ts: NOW - 6 * 60 * MIN, uplinks: 2800, relays: 740,
    tags: ['PHX', 'GhostShell'],
  },
]

function makeId() {
  return 'sig-' + Math.random().toString(36).slice(2, 9)
}

export const useNodeStore = create<NodeState>((set, get) => ({
  signals:   SEED_SIGNALS,
  following: ['guild-notice', 'citizen-vex'],
  uplinked:  [],
  relayed:   [],
  drafting:  false,
  draftBody: '',

  postSignal: (body, tags = []) => {
    const signal: Signal = {
      id: makeId(),
      authorId:  'player',
      body,
      ts:        Date.now(),
      uplinks:   0,
      relays:    0,
      tags,
      isPlayer:  true,
    }
    set(s => ({ signals: [signal, ...s.signals], drafting: false, draftBody: '' }))
  },

  uplink: (id) => {
    const { uplinked } = get()
    const already = uplinked.includes(id)
    set(s => ({
      uplinked: already ? s.uplinked.filter(x => x !== id) : [...s.uplinked, id],
      signals:  s.signals.map(sig =>
        sig.id === id
          ? { ...sig, uplinks: sig.uplinks + (already ? -1 : 1) }
          : sig
      ),
    }))
  },

  relay: (id) => {
    const { relayed } = get()
    if (relayed.includes(id)) return
    const orig = get().signals.find(s => s.id === id)!
    const relay: Signal = {
      id:       makeId(),
      authorId: 'player',
      body:     orig.body,
      ts:       Date.now(),
      uplinks:  0,
      relays:   0,
      tags:     orig.tags,
      isPlayer: true,
      relayOf:  id,
    }
    set(s => ({
      relayed:  [...s.relayed, id],
      signals:  [relay, ...s.signals.map(sig =>
        sig.id === id ? { ...sig, relays: sig.relays + 1 } : sig
      )],
    }))
  },

  follow:   (id) => set(s => ({ following: [...s.following, id] })),
  unfollow: (id) => set(s => ({ following: s.following.filter(x => x !== id) })),
  setDraft:    (v) => set({ draftBody: v }),
  setDrafting: (v) => set({ drafting: v }),
}))
