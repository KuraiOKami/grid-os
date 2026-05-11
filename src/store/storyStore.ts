// ── storyStore.ts ─────────────────────────────────────────────────────────────
// Phase 1d alias: re-exports everything from storyStore.shim so that all
// existing imports of './storyStore' or '@/store/storyStore' automatically
// resolve to the Supabase-backed shim without touching every consumer.
//
// storyStore.legacy.ts  ← original pure-Zustand implementation (kept for diff)
// storyStore.shim.ts    ← Supabase-backed drop-in (source of truth)
// storyStore.ts         ← this file (re-export barrel, safe to delete after Phase 2)

export * from './storyStore.shim'
