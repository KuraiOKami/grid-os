// ── npcStore.ts ───────────────────────────────────────────────────────────────
// Zustand store for:
//   - Social feed posts (NPC + eventually player)
//   - NPC conversation threads
//   - World heat (mirrors world_state table; local until Supabase sync)
//
// The feed is the core "living world" surface. Posts accumulate over the
// session, oldest drop off after MAX_FEED_SIZE.

import { create }                from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { NpcPost, NpcMessage } from '../lib/npcEngine'

const MAX_FEED_SIZE = 120

export interface WorldHeat {
  watch_heat:       number
  market_heat:      number
  underground_heat: number
  corporate_heat:   number
}

export interface ConversationThread {
  npcId:    string
  messages: NpcMessage[]
  unread:   number
}

export interface NpcState {
  // Feed
  feed:            NpcPost[]
  addPost:         (post: NpcPost) => void
  markPostRead:    (postId: string) => void
  clearFeed:       () => void
  unreadCount:     () => number

  // Conversations
  threads:         Record<string, ConversationThread>
  addMessage:      (npcId: string, message: NpcMessage) => void
  markThreadRead:  (npcId: string) => void
  getThread:       (npcId: string) => ConversationThread | undefined

  // World heat (local mirror of world_state table)
  worldHeat:       WorldHeat
  setWorldHeat:    (heat: Partial<WorldHeat>) => void
  bumpHeat:        (axis: keyof WorldHeat, delta: number) => void
}

export const useNpcStore = create<NpcState>()(
  persist(
    (set, get) => ({
      // ── Feed ───────────────────────────────────────────────────────────────
      feed: [],

      addPost: (post) =>
        set(state => {
          const next = [post, ...state.feed]
          return { feed: next.slice(0, MAX_FEED_SIZE) }
        }),

      markPostRead: (postId) =>
        set(state => ({
          feed: state.feed.map(p =>
            p.id === postId ? { ...p, isRead: true } : p
          ),
        })),

      clearFeed: () => set({ feed: [] }),

      unreadCount: () => get().feed.filter(p => !p.isRead).length,

      // ── Conversations ──────────────────────────────────────────────────────
      threads: {},

      addMessage: (npcId, message) =>
        set(state => {
          const existing = state.threads[npcId]
          const thread: ConversationThread = existing
            ? {
                ...existing,
                messages: [...existing.messages, message],
                unread: message.role === 'npc'
                  ? existing.unread + 1
                  : existing.unread,
              }
            : {
                npcId,
                messages: [message],
                unread: message.role === 'npc' ? 1 : 0,
              }
          return { threads: { ...state.threads, [npcId]: thread } }
        }),

      markThreadRead: (npcId) =>
        set(state => {
          const thread = state.threads[npcId]
          if (!thread) return state
          return {
            threads: {
              ...state.threads,
              [npcId]: { ...thread, unread: 0 },
            },
          }
        }),

      getThread: (npcId) => get().threads[npcId],

      // ── World heat ─────────────────────────────────────────────────────────
      worldHeat: {
        watch_heat:       0,
        market_heat:      0,
        underground_heat: 0,
        corporate_heat:   0,
      },

      setWorldHeat: (heat) =>
        set(state => ({
          worldHeat: { ...state.worldHeat, ...heat },
        })),

      bumpHeat: (axis, delta) =>
        set(state => ({
          worldHeat: {
            ...state.worldHeat,
            [axis]: Math.max(0, Math.min(100, state.worldHeat[axis] + delta)),
          },
        })),
    }),
    {
      name: 'gridos-npc-store',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist feed + threads, not heat (that comes from world_state)
      partialize: (state) => ({
        feed:    state.feed,
        threads: state.threads,
      }),
    },
  ),
)
