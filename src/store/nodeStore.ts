// ── nodeStore.ts ────────────────────────────────────────────────────────────
// Zustand store for NODE — the in-world social media platform.
// Signals (posts), uplinks (likes), relays (retweets), follows.
// Idle system: deployable scripts, influence currency, inbox, NPC ticker.

import { create } from 'zustand'
import type { FactionId } from '@/lib/factions'

export type AccountType = 'citizen' | 'verified' | 'anon' | 'bot'

export interface NodeAccount {
  id:       string
  handle:   string
  display:  string
  type:     AccountType
  faction?: FactionId
  avatar:   string
  bio:      string
  subs:     number
}

export interface Signal {
  id:        string
  authorId:  string
  body:      string
  ts:        number
  uplinks:   number
  relays:    number
  tags:      string[]
  pinned?:   boolean
  isPlayer?: boolean
  relayOf?:  string
}

// ── Script System ─────────────────────────────────────────────────────────────

export interface ScriptDef {
  id:            string
  name:          string
  tag:           string
  desc:          string
  category:      'network' | 'surveillance' | 'underground'
  costInfluence: number
  minShadow?:    number
  yieldPerTick:  number   // influence earned per TICK_MS interval
  logTemplates:  string[]
}

export interface RunningScript {
  defId:      string
  deployedAt: number
  lastTickAt: number
  tickCount:  number
  totalYield: number
  log:        string[]    // last 5 log lines
}

export interface InboxMessage {
  id:     string
  ts:     number
  fromId: string
  type:   'reply' | 'mention' | 'alert' | 'system'
  body:   string
  read:   boolean
}

export const TICK_MS = 30_000   // 30 seconds per script yield cycle

export const SCRIPT_DEFS: ScriptDef[] = [
  {
    id: 'relay_bot', name: 'relay_bot', tag: '[RELAY]',
    desc: 'Crawls the feed and auto-relays high-signal content through your node. Expands your network footprint passively.',
    category: 'network', costInfluence: 0, yieldPerTick: 1,
    logTemplates: [
      'Relayed signal from @phx-leak',
      'Relayed signal from @nexus_authority',
      'Node footprint expanded — 3 new relay hops registered',
      'Traffic routed: +8 signals this cycle',
      'Auto-relay active: high-signal content forwarded',
      'Relay chain extended through sector 4',
      'Backlog cleared — 12 signals processed',
    ],
  },
  {
    id: 'tag_watcher', name: 'tag_watcher', tag: '[WATCH]',
    desc: 'Monitors the Frequency board for spike patterns. Drops alerts to your inbox when a tag moves fast.',
    category: 'surveillance', costInfluence: 5, yieldPerTick: 0.5,
    logTemplates: [
      'Monitoring 8 active tags this cycle',
      '#GhostShell spike detected — volume up 34%',
      '#PHX frequency anomaly logged',
      '#NexusAlert trending in sector feeds',
      'Frequency baseline recalibrated',
      '#OPSEC movement flagged — alerting inbox',
      '#Sector7 volume elevated — watching',
    ],
  },
  {
    id: 'uplink_farm', name: 'uplink_farm', tag: '[FARM]',
    desc: 'Cycles through high-traffic signals and uplinks them for reciprocal attention. Boosts your signal visibility across the network.',
    category: 'network', costInfluence: 12, yieldPerTick: 2,
    logTemplates: [
      'Uplinked 4 signals this cycle',
      'Reciprocal uplinks received: +12',
      'Network engagement up — visibility growing',
      'Farm loop: 6 uplinks sent, 9 received',
      'Signal amplification active',
      'Engagement loop running — ROI positive',
      'High-traffic node targeted — yield up',
    ],
  },
  {
    id: 'ghost_relay', name: 'ghost_relay', tag: '[GHOST]',
    desc: 'Routes anonymous underground traffic through your node. Off the ledger. Increases shadow exposure — use carefully.',
    category: 'underground', costInfluence: 0, minShadow: 15, yieldPerTick: 1,
    logTemplates: [
      'Ghost packet routed — no trace logged',
      'Underground traffic: 3 anonymous hops',
      'Signal masked — source obfuscated',
      'Relay confirmed — recipient unknown',
      'Ghost chain active through sector 7',
      'Packet delivered — ledger clean',
      'Anonymous hop confirmed — identity scrubbed',
    ],
  },
]

// ── NPC Post Templates ────────────────────────────────────────────────────────

const NPC_POST_TEMPLATES: Record<string, string[]> = {
  'nexus-official': [
    'Compliance window closes in 36 hours. File your Sector reports. Non-compliance is logged automatically. #NexusAlert #Compliance',
    'GridOS infrastructure operating at 99.7% uptime this cycle. Report anomalies through official channels only. #ComplianceUpdate',
    'Reminder: NODE account activity is subject to Frequency Audit under Compact Article 9. #NexusAlert',
    'Citizens with pending Identity Verification must complete review before next cycle. Access restrictions may apply. #NexusAlert #Compliance',
  ],
  'phx-leak': [
    'three more ghost nodes went dark last night. someone is cleaning up. save your mirrors. #PHX #GhostShell',
    'if you\'re running anything sensitive, do it before the compliance window closes. the window is smaller than they say. #OPSEC',
    'word from inside: they\'re not looking for data. they\'re looking for the people who moved it. stay quiet. #PHX',
    'new relay path confirmed. details in the next drop. watch the dead box. #PHX #GhostShell',
  ],
  'citizen-vex': [
    'okay who else is seeing weird latency on the relay nodes lately. feels like something routing through this sector #GhostShell',
    'ran the ghost trace again. different topology than last time. the map is changing. #PHX',
    'filed the sector 7 report. immediately got a "verification pending" flag. so that\'s fun',
    'successfully avoided three flag triggers tonight. new route is holding. #GhostShell #OPSEC',
  ],
  'citizen-mira': [
    'new Guild advisory: Tier-2 fabrication requires updated certs after this cycle. get your docs in order. #Guild #Crafting',
    'carbon lattice alloy recipe is finally stable after three failed batches. worth the grind. #Workbench #Guild',
    'reminder that ContractHub closes applications 6 hours before the build window. plan accordingly. #Guild #Contract',
  ],
  'citizen-kade': [
    'SYN-7 holding steady but IronCircuit volumes are sus. watching closely. #Ledger #IronCircuit',
    'quiet market today. too quiet. when the ledger flatlines, something is moving underneath it. #Ledger',
    'small IronCircuit long. not financial advice. just watching the dispatch board. #Ledger',
  ],
  'synd-whisper': [
    'position update: SYND futures up on compliance fear. as always. #Ledger #Trade',
    'someone is quietly accumulating IronCircuit contracts. not financial advice. pattern is interesting. #Ledger',
    'compliance anxiety = NEXUS contract demand = SYND margin. formula hasn\'t changed. #Ledger #Trade',
  ],
  'iron-dispatch': [
    'NOTICE: Circuit rates adjusted upward this cycle. New contract minimum ₳ 800. Standards unchanged. #IronCircuit',
    'Two contracts posted this cycle. High risk, high pay. You know where the door is. #IronCircuit',
    'Circuit fulfilled 4 contracts this week. Zero complications. Reliability is the product. #IronCircuit',
  ],
  'bot-pulse': [
    '⚡ FREQUENCY UPDATE — anomaly detected: #GhostShell volume tripled in 4 hours. Origin unclear. Monitoring. #FrequencyReport',
    '⚡ HOURLY REPORT — Top: #NexusAlert #PHX #Ledger. Trending: #Sector7. Declining: #GridWork. #FrequencyReport',
    '⚡ Signal spike in #OPSEC channel. Cross-referencing with known PHX relay patterns. #FrequencyReport',
  ],
  'guild-notice': [
    'CONTRACT POSTED — 2x Tier-1 Assemblers needed for 7-day infrastructure build. Guild members only. Apply via ContractHub. #Guild #Contract',
    'Guild quarterly standings published. Tier promotions open for review next cycle. Check your rating. #Guild',
    'Workbench v2.5 introduces breaking changes to alloy chains. Review the changelog before your next build. #Guild #Crafting',
  ],
}

const NPC_REPLY_TEMPLATES: Record<string, string[]> = {
  'citizen-vex': [
    'yeah @you this tracks with what i\'ve been seeing lately',
    'solid signal. relaying this.',
    'okay for someone new this is a sharp take',
    'this is exactly the kind of thing people don\'t want to hear',
  ],
  'citizen-mira': [
    'interesting. how does this connect to the Guild contracts?',
    'noted. adding this to my watch list.',
    'worth relaying. good signal.',
  ],
  'citizen-kade': [
    'market implications are interesting if this plays out',
    'signal logged. watching the ledger.',
    'can\'t say i disagree with this read',
  ],
  'bot-pulse': [
    '⚡ Signal from @you is gaining traction. Monitoring.',
    '⚡ Signal from @you logged — adding to frequency tracking.',
    '⚡ Engagement spike detected on @you\'s recent signal.',
  ],
}

// ── NPC Accounts ──────────────────────────────────────────────────────────────

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

// ── Seed Signals ──────────────────────────────────────────────────────────────

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

function makeInboxId() {
  return 'inbox-' + Math.random().toString(36).slice(2, 9)
}

// ── Store Interface ────────────────────────────────────────────────────────────

interface NodeState {
  // feed
  signals:   Signal[]
  following: string[]
  uplinked:  string[]
  relayed:   string[]

  // compose
  drafting:  boolean
  draftBody: string

  // idle system
  influence: number
  scripts:   RunningScript[]
  inbox:     InboxMessage[]

  // actions — feed
  postSignal:  (body: string, tags?: string[]) => void
  uplink:      (id: string) => void
  relay:       (id: string) => void
  follow:      (accountId: string) => void
  unfollow:    (accountId: string) => void
  setDraft:    (v: string) => void
  setDrafting: (v: boolean) => void

  // actions — idle
  deployScript: (defId: string, playerShadow: number) => void
  stopScript:   (defId: string) => void
  tick:         () => void
  tickNPC:      () => void
  addInbox:     (msg: Omit<InboxMessage, 'id' | 'read'>) => void
  markAllRead:  () => void
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const useNodeStore = create<NodeState>((set, get) => ({
  signals:   SEED_SIGNALS,
  following: ['guild-notice', 'citizen-vex'],
  uplinked:  [],
  relayed:   [],
  drafting:  false,
  draftBody: '',
  influence: 0,
  scripts:   [],
  inbox:     [],

  // ── Feed actions ────────────────────────────────────────────────────────────

  postSignal: (body, tags = []) => {
    const signal: Signal = {
      id:       makeId(),
      authorId: 'player',
      body,
      ts:       Date.now(),
      uplinks:  0,
      relays:   0,
      tags,
      isPlayer: true,
    }
    set(s => ({ signals: [signal, ...s.signals], drafting: false, draftBody: '' }))

    // Schedule 1-2 NPC reactions after 30-90 seconds
    const candidates = ['citizen-vex', 'citizen-mira', 'bot-pulse', 'citizen-kade']
    const numReactions = Math.random() < 0.35 ? 2 : 1
    for (let i = 0; i < numReactions; i++) {
      const delay = 30_000 + Math.random() * 60_000
      const npcId = candidates[Math.floor(Math.random() * candidates.length)]
      const pool  = NPC_REPLY_TEMPLATES[npcId] ?? []
      if (!pool.length) continue
      const replyBody = pool[Math.floor(Math.random() * pool.length)]
      setTimeout(() => {
        get().addInbox({ ts: Date.now(), fromId: npcId, type: 'reply', body: replyBody })
      }, delay + i * 15_000)
    }
  },

  uplink: (id) => {
    const { uplinked } = get()
    const already = uplinked.includes(id)
    set(s => ({
      uplinked: already ? s.uplinked.filter(x => x !== id) : [...s.uplinked, id],
      signals:  s.signals.map(sig =>
        sig.id === id ? { ...sig, uplinks: sig.uplinks + (already ? -1 : 1) } : sig
      ),
    }))
  },

  relay: (id) => {
    const { relayed } = get()
    if (relayed.includes(id)) return
    const orig = get().signals.find(s => s.id === id)!
    const relaySignal: Signal = {
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
      signals:  [relaySignal, ...s.signals.map(sig =>
        sig.id === id ? { ...sig, relays: sig.relays + 1 } : sig
      )],
    }))
  },

  follow:      (id) => set(s => ({ following: [...s.following, id] })),
  unfollow:    (id) => set(s => ({ following: s.following.filter(x => x !== id) })),
  setDraft:    (v)  => set({ draftBody: v }),
  setDrafting: (v)  => set({ drafting: v }),

  // ── Idle actions ────────────────────────────────────────────────────────────

  deployScript: (defId, playerShadow) => {
    const { influence, scripts } = get()
    const def = SCRIPT_DEFS.find(d => d.id === defId)
    if (!def) return
    if (scripts.some(s => s.defId === defId)) return
    if (influence < def.costInfluence) return
    if ((def.minShadow ?? 0) > playerShadow) return

    const now = Date.now()
    const script: RunningScript = {
      defId,
      deployedAt: now,
      lastTickAt: now,
      tickCount:  0,
      totalYield: 0,
      log:        [`[INIT] ${def.name} deployed — monitoring active`],
    }
    set(s => ({
      influence: s.influence - def.costInfluence,
      scripts:   [...s.scripts, script],
    }))
  },

  stopScript: (defId) => {
    set(s => ({ scripts: s.scripts.filter(sc => sc.defId !== defId) }))
  },

  tick: () => {
    const { scripts } = get()
    const now = Date.now()
    let gained = 0

    const updated = scripts.map(s => {
      const def = SCRIPT_DEFS.find(d => d.id === s.defId)
      if (!def) return s
      const elapsed = now - s.lastTickAt
      if (elapsed < TICK_MS) return s

      const ticks  = Math.floor(elapsed / TICK_MS)
      const yield_ = def.yieldPerTick * ticks
      gained += yield_

      const logLine = def.logTemplates[Math.floor(Math.random() * def.logTemplates.length)]
      return {
        ...s,
        lastTickAt: s.lastTickAt + ticks * TICK_MS,
        tickCount:  s.tickCount + ticks,
        totalYield: s.totalYield + yield_,
        log:        [logLine, ...s.log].slice(0, 5),
      }
    })

    if (gained > 0) {
      set(s => ({ scripts: updated, influence: Math.round((s.influence + gained) * 10) / 10 }))
    } else {
      set({ scripts: updated })
    }
  },

  tickNPC: () => {
    if (Math.random() > 0.35) return
    const npcIds = Object.keys(NPC_POST_TEMPLATES)
    const npcId  = npcIds[Math.floor(Math.random() * npcIds.length)]
    const pool   = NPC_POST_TEMPLATES[npcId]
    const body   = pool[Math.floor(Math.random() * pool.length)]

    const tagMatches = body.match(/#(\w+)/g) ?? []
    const tags = tagMatches.map(t => t.slice(1))

    const signal: Signal = {
      id:      makeId(),
      authorId: npcId,
      body,
      ts:      Date.now(),
      uplinks: Math.floor(Math.random() * 600 + 50),
      relays:  Math.floor(Math.random() * 200 + 10),
      tags,
    }
    set(s => ({ signals: [signal, ...s.signals].slice(0, 120) }))
  },

  addInbox: (msg) => {
    set(s => ({
      inbox: [{ ...msg, id: makeInboxId(), read: false }, ...s.inbox].slice(0, 50),
    }))
  },

  markAllRead: () => {
    set(s => ({ inbox: s.inbox.map(m => ({ ...m, read: true })) }))
  },
}))
