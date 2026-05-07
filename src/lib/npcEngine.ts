// ── npcEngine.ts ──────────────────────────────────────────────────────────────
// The NPC AI engine. Handles:
//   1. generatePost(npcId)       — generate a social feed post for an NPC
//   2. generateReply(npcId, msg) — generate a conversation reply
//   3. shouldPost(npc, state)    — decide if an NPC posts this tick
//
// All LLM calls go through Supabase Edge Functions so the API key
// never touches the client. The edge function is at:
//   /functions/v1/npc-generate
//
// World state modifiers:
//   - watch_heat > 60  → NEXUS NPCs post more, PHANTOM NPCs go quiet
//   - underground_heat > 60 → PHANTOM posts increase, NEXUS gets paranoid
//   - market_heat > 60 → Voss and SYND NPCs become active
//   - silenced flag → NPC stops posting (suppression event)
//   - agitated flag → posts become shorter, more urgent

import { supabase }          from './supabase'
import { NPC_PERSONAS, type NpcPersona } from './npcPersonas'
import { useStoryStore }     from '../store/storyStore'
import { useNpcStore }       from '../store/npcStore'
import type { WorldHeat }    from '../store/npcStore'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NpcPost {
  id:          string
  npcId:       string
  handle:      string
  displayName: string
  avatar:      string
  faction:     string | null
  content:     string
  timestamp:   number
  likes:       number
  replies:     number
  isRead:      boolean
}

export interface NpcMessage {
  id:        string
  npcId:     string
  role:      'npc' | 'player'
  content:   string
  timestamp: number
}

// ── Post generation ───────────────────────────────────────────────────────────

export async function generateNpcPost(npcId: string): Promise<NpcPost | null> {
  const npc = NPC_PERSONAS[npcId]
  if (!npc) return null
  if (npc.silenced) return null

  const story   = useStoryStore.getState()
  const heat    = useNpcStore.getState().worldHeat
  const context = _buildPostContext(npc, heat, story)

  const topic = _pickTopic(npc, heat)

  const prompt = [
    `Write a single social media post as ${npc.displayName} (${npc.handle}).`,
    `Topic area: ${topic}`,
    npc.agitated ? 'The post should feel urgent, terse, or slightly alarmed.' : '',
    `Keep it under 180 characters. No hashtags. No emojis unless it fits the character.`,
    `Context: ${context}`,
    `Write only the post text. No quotes, no attribution.`,
  ].filter(Boolean).join('\n')

  const content = await _callNpcGenerate(npc.systemPrompt, prompt)
  if (!content) return null

  return {
    id:          `post_${npcId}_${Date.now()}`,
    npcId,
    handle:      npc.handle,
    displayName: npc.displayName,
    avatar:      npc.avatar,
    faction:     npc.faction,
    content,
    timestamp:   Date.now(),
    likes:       _fakeLikes(npc.postFrequency),
    replies:     _fakeReplies(npc.postFrequency),
    isRead:      false,
  }
}

// ── Conversation reply generation ─────────────────────────────────────────────

export async function generateNpcReply(
  npcId:   string,
  history: NpcMessage[],
  playerMessage: string,
): Promise<string | null> {
  const npc   = NPC_PERSONAS[npcId]
  if (!npc) return null

  const story = useStoryStore.getState()

  // Build conversation history for the LLM
  const messages = history.map(m => ({
    role:    m.role === 'player' ? 'user' : 'assistant',
    content: m.content,
  }))

  // Inject knowledge gate context into system prompt
  const gateContext = _buildGateContext(npc, story)
  const augmentedSystemPrompt = npc.systemPrompt + (gateContext ? `\n\n${gateContext}` : '')

  return _callNpcGenerateChat(augmentedSystemPrompt, messages, playerMessage)
}

// ── Post scheduling decision ──────────────────────────────────────────────────

export function shouldNpcPost(npc: NpcPersona, heat: WorldHeat): boolean {
  if (npc.silenced) return false

  const story = useStoryStore.getState()

  // Check knowledge gates — gated NPCs don't appear until flags are set
  if (npc.knowledgeGate.length > 0) {
    const hasAccess = npc.knowledgeGate.some(flag => story.hasFlag(flag))
    if (!hasAccess) return false
  }

  // Base probability by frequency
  const baseChance: Record<NpcPersona['postFrequency'], number> = {
    high:   0.7,
    medium: 0.4,
    low:    0.15,
  }

  let chance = baseChance[npc.postFrequency]

  // World heat modifiers
  if (npc.faction === 'nexus' && heat.watch_heat > 60)       chance += 0.2
  if (npc.faction === 'phantom' && heat.watch_heat > 60)     chance -= 0.15
  if (npc.faction === 'phantom' && heat.underground_heat > 60) chance += 0.25
  if (npc.faction === 'synd' && heat.market_heat > 60)       chance += 0.2
  if (npc.agitated)                                          chance += 0.3

  return Math.random() < chance
}

// ── Apply world state to NPC behaviors ───────────────────────────────────────
// Call this when world_heat changes to update NPC flags.

export function applyWorldStateToNpcs(heat: WorldHeat) {
  const personas = Object.values(NPC_PERSONAS)

  for (const npc of personas) {
    // High watch_heat: PHANTOM cells go quiet (suppressed)
    if (npc.faction === 'phantom') {
      npc.silenced  = heat.watch_heat > 80
      npc.agitated  = heat.watch_heat > 60 && heat.watch_heat <= 80
    }

    // High corporate_heat: NEXUS NPCs become more active and authoritative
    if (npc.faction === 'nexus') {
      npc.agitated = heat.corporate_heat > 70
    }

    // High underground_heat: SYND and IRON go quiet
    if (npc.faction === 'synd' || npc.faction === 'iron') {
      npc.silenced = heat.underground_heat > 75
    }
  }
}

// ── Supabase Edge Function calls ──────────────────────────────────────────────
// These call /functions/v1/npc-generate which holds the LLM API key.
// The function signature is defined in supabase/functions/npc-generate/index.ts

async function _callNpcGenerate(
  systemPrompt: string,
  userPrompt:   string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('npc-generate', {
      body: { systemPrompt, userPrompt, mode: 'post' },
    })
    if (error || !data?.content) return null
    return data.content as string
  } catch {
    return null
  }
}

async function _callNpcGenerateChat(
  systemPrompt: string,
  history:      { role: string; content: string }[],
  playerMessage: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('npc-generate', {
      body: { systemPrompt, history, playerMessage, mode: 'chat' },
    })
    if (error || !data?.content) return null
    return data.content as string
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _pickTopic(npc: NpcPersona, heat: WorldHeat): string {
  const topics = [...npc.postTopics]

  // Weight toward heat-relevant topics
  if (heat.watch_heat > 60 && npc.faction === 'nexus') {
    const urgentTopics = topics.filter(t =>
      t.includes('surveillance') || t.includes('anomaly') || t.includes('sector')
    )
    if (urgentTopics.length > 0) return urgentTopics[Math.floor(Math.random() * urgentTopics.length)]
  }

  return topics[Math.floor(Math.random() * topics.length)]
}

function _buildPostContext(npc: NpcPersona, heat: WorldHeat, story: ReturnType<typeof useStoryStore.getState>): string {
  const parts: string[] = []
  if (heat.watch_heat > 60)       parts.push('NEXUS surveillance activity is elevated right now.')
  if (heat.underground_heat > 60) parts.push('Underground network activity is unusually high.')
  if (heat.market_heat > 60)      parts.push('Market prices are volatile and rising.')
  if (story.phase >= 2)           parts.push('The OVERSEER anomaly is becoming public knowledge in some circles.')
  return parts.join(' ') || 'The Grid is operating normally.'
}

function _buildGateContext(npc: NpcPersona, story: ReturnType<typeof useStoryStore.getState>): string {
  const unlockedSecrets = npc.secrets.filter((_, i) => {
    const requiredFlag = npc.knowledgeGate[i]
    return !requiredFlag || story.hasFlag(requiredFlag)
  })
  if (unlockedSecrets.length === 0) return ''
  return `The player has earned access to these topics: ${unlockedSecrets.join('; ')}. You may now discuss them if directly and genuinely asked.`
}

function _fakeLikes(freq: NpcPersona['postFrequency']): number {
  const ranges = { high: [12, 180], medium: [3, 60], low: [0, 20] }
  const [min, max] = ranges[freq]
  return Math.floor(Math.random() * (max - min) + min)
}

function _fakeReplies(freq: NpcPersona['postFrequency']): number {
  const ranges = { high: [1, 24], medium: [0, 8], low: [0, 3] }
  const [min, max] = ranges[freq]
  return Math.floor(Math.random() * (max - min) + min)
}
