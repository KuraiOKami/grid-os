// ── npcScheduler.ts ───────────────────────────────────────────────────────────
// The NPC activity scheduler. Drives the living world by:
//   1. Ticking every TICK_INTERVAL ms
//   2. Each tick: deciding which NPCs post, generating their posts
//   3. Applying world heat decay over time
//   4. Syncing world_heat from Supabase world_state (when available)
//
// Usage:
//   import { startNpcScheduler, stopNpcScheduler } from '../lib/npcScheduler'
//
//   // In App.tsx or a top-level provider:
//   useEffect(() => {
//     startNpcScheduler()
//     return () => stopNpcScheduler()
//   }, [])
//
// The scheduler is intentionally lightweight — all the heavy lifting
// (LLM calls) is async and non-blocking.

import { NPC_PERSONAS, CANON_NPCS, GATED_NPCS } from './npcPersonas'
import { generateNpcPost, shouldNpcPost, applyWorldStateToNpcs } from './npcEngine'
import { useNpcStore }  from '../store/npcStore'
import { useStoryStore } from '../store/storyStore'
import { supabase }     from './supabase'

// ── Config ────────────────────────────────────────────────────────────────────

const TICK_INTERVAL      = 4 * 60 * 1000   // 4 minutes between ticks
const HEAT_DECAY_RATE    = 1               // heat decays by 1 per tick
const MAX_POSTS_PER_TICK = 2              // max NPC posts generated per tick
const WORLD_SYNC_INTERVAL = 60 * 1000    // sync world_state from Supabase every 60s

// ── State ─────────────────────────────────────────────────────────────────────

let tickTimer:     ReturnType<typeof setInterval> | null = null
let syncTimer:     ReturnType<typeof setInterval> | null = null
let isRunning = false

// ── Public API ────────────────────────────────────────────────────────────────

export function startNpcScheduler() {
  if (isRunning) return
  isRunning = true

  // Run one tick immediately on start to populate the feed
  _runTick()

  tickTimer = setInterval(_runTick, TICK_INTERVAL)
  syncTimer = setInterval(_syncWorldState, WORLD_SYNC_INTERVAL)

  console.info('[NpcScheduler] Started')
}

export function stopNpcScheduler() {
  if (tickTimer) clearInterval(tickTimer)
  if (syncTimer) clearInterval(syncTimer)
  isRunning = false
  console.info('[NpcScheduler] Stopped')
}

// Force an immediate tick (useful for testing or story triggers)
export function forceTick() {
  _runTick()
}

// ── Tick ──────────────────────────────────────────────────────────────────────

async function _runTick() {
  const heat  = useNpcStore.getState().worldHeat
  const story = useStoryStore.getState()

  // Apply world state to NPC behavior flags
  applyWorldStateToNpcs(heat)

  // Build the pool of eligible NPCs for this tick
  const eligibleNpcs = _getEligibleNpcs(story)

  // Shuffle and filter by shouldPost
  const candidates = _shuffle(eligibleNpcs)
    .filter(npcId => shouldNpcPost(NPC_PERSONAS[npcId], heat))
    .slice(0, MAX_POSTS_PER_TICK)

  // Generate posts (async, non-blocking)
  for (const npcId of candidates) {
    generateNpcPost(npcId)
      .then(post => {
        if (post) {
          useNpcStore.getState().addPost(post)
        }
      })
      .catch(err => console.warn(`[NpcScheduler] Post failed for ${npcId}:`, err))
  }

  // Decay world heat
  _decayHeat()
}

// ── World state sync from Supabase ────────────────────────────────────────────

async function _syncWorldState() {
  try {
    const { data, error } = await supabase
      .from('world_state')
      .select('watch_heat, market_heat, underground_heat, corporate_heat')
      .single()

    if (error || !data) return

    useNpcStore.getState().setWorldHeat({
      watch_heat:       data.watch_heat,
      market_heat:      data.market_heat,
      underground_heat: data.underground_heat,
      corporate_heat:   data.corporate_heat,
    })
  } catch {
    // Supabase unavailable — continue with local heat values
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _getEligibleNpcs(story: ReturnType<typeof useStoryStore.getState>): string[] {
  const eligible: string[] = [...CANON_NPCS]

  for (const npcId of GATED_NPCS) {
    const npc = NPC_PERSONAS[npcId]
    if (!npc) continue
    // NPC appears once any of their gate flags is set
    const unlocked = npc.knowledgeGate.length === 0
      || npc.knowledgeGate.some(flag => story.hasFlag(flag))
    if (unlocked) eligible.push(npcId)
  }

  return eligible
}

function _decayHeat() {
  const { worldHeat, bumpHeat } = useNpcStore.getState()
  const axes = ['watch_heat', 'market_heat', 'underground_heat', 'corporate_heat'] as const
  for (const axis of axes) {
    if (worldHeat[axis] > 0) bumpHeat(axis, -HEAT_DECAY_RATE)
  }
}

function _shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
