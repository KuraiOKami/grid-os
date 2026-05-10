// ── saveStore.ts ──────────────────────────────────────────────────────────────
// Manual save/load system. 3 slots stored in localStorage.
// Snapshots all key stores. Restores on load. Hard reset on New Game.

import { useStoryStore }      from './storyStore'
import { useMissionStore }    from './missionStore'
import { useUnlockStore }     from './unlockStore'
import { useRepStore }        from './reputationStore'
import { useWalletStore }     from './walletStore'
import { useMailStore }       from './mailStore'
import { useCitizenStore }   from './citizenStore'

export type SlotId = 1 | 2 | 3

export interface SaveMeta {
  slot:        SlotId
  citizenId:   string
  handle:      string
  savedAt:     number
  playtime:    number   // seconds
  phase:       number
  activeMission: string | null
}

export interface SaveData extends SaveMeta {
  story: {
    phase:            number
    missions:         Record<string, string>
    flags:            string[]
    credits:          number
    overseerFlag:     number
    browserHistory:   string[]
    jobsCompleted:    string[]
    factionalChoices: string[]
    gridfallChoice:   string | null
  }
  missions: {
    missions: Record<string, {
      status:     string
      objectives: { id: string; complete: boolean }[]
    }>
  }
  unlocks:  { installed: string[] }
  rep:      { compliance: number; shadow: number }
  wallet:   { balance: number; log: any[] }
  mails:    { mails: any[] }
}

function lsKey(slot: SlotId) { return `gridos_save_${slot}` }

// ── Snapshot all stores ────────────────────────────────────────────────────────

export function createSave(slot: SlotId, playtime: number): SaveData {
  const story    = useStoryStore.getState()
  const missions = useMissionStore.getState()
  const unlocks  = useUnlockStore.getState()
  const rep      = useRepStore.getState()
  const wallet   = useWalletStore.getState()
  const mails    = useMailStore.getState()
  const citizen  = useCitizenStore.getState()

  const activeMission = Object.entries(missions.missions)
    .find(([, m]) => m.status === 'active')?.[1].title ?? null

  const data: SaveData = {
    slot,
    citizenId:     citizen.profile?.citizenId ?? '????',
    handle:        citizen.profile?.handle    ?? 'unknown',
    savedAt:       Date.now(),
    playtime,
    phase:         story.phase,
    activeMission,

    story: {
      phase:            story.phase,
      missions:         story.missions as Record<string, string>,
      flags:            [...story.flags],
      credits:          story.credits,
      overseerFlag:     story.overseerFlag,
      browserHistory:   story.browserHistory,
      jobsCompleted:    story.jobsCompleted,
      factionalChoices: story.factionalChoices,
      gridfallChoice:   story.gridfallChoice,
    },

    missions: {
      missions: Object.fromEntries(
        Object.entries(missions.missions).map(([id, m]) => [id, {
          status:     m.status,
          objectives: m.objectives.map(o => ({ id: o.id, complete: o.complete })),
        }])
      ),
    },

    unlocks: { installed: unlocks.installed },
    rep:     { compliance: rep.compliance, shadow: rep.shadow },
    wallet:  { balance: wallet.balance, log: wallet.log },
    mails:   { mails: mails.mails },
  }

  localStorage.setItem(lsKey(slot), JSON.stringify(data))
  return data
}

// ── Restore all stores ────────────────────────────────────────────────────────

export function loadSave(slot: SlotId): boolean {
  try {
    const raw = localStorage.getItem(lsKey(slot))
    if (!raw) return false
    const data: SaveData = JSON.parse(raw)

    // story
    const story = useStoryStore.getState()
    story.setPhase(data.story.phase as any)
    data.story.flags.forEach(f => story.setFlag(f as any))
    Object.entries(data.story.missions).forEach(([id, status]) =>
      story.setMission(id as any, status as any)
    )

    // missions — restore statuses + objectives
    const missions = useMissionStore.getState()
    Object.entries(data.missions.missions).forEach(([id, saved]) => {
      missions.setMissionStatus(id as any, saved.status as any)
      saved.objectives.forEach(o => {
        if (o.complete) missions.setObjectiveComplete(id as any, o.id)
      })
    })

    // unlocks
    const unlocks = useUnlockStore.getState()
    data.unlocks.installed.forEach(id => unlocks.install(id))

    // rep
    const rep = useRepStore.getState()
    rep.adjust('compliance', data.rep.compliance - rep.compliance)
    rep.adjust('shadow',     data.rep.shadow     - rep.shadow)

    // wallet — reset balance
    const wallet = useWalletStore.getState()
    const diff = data.wallet.balance - wallet.balance
    if (diff > 0) wallet.credit(diff, 'Loaded from save')
    else if (diff < 0) wallet.debit(-diff, 'Loaded from save')

    return true
  } catch (e) {
    console.error('[saveStore] loadSave failed', e)
    return false
  }
}

// ── Get slot metadata (without loading) ───────────────────────────────────────

export function getSlotMeta(slot: SlotId): SaveMeta | null {
  try {
    const raw = localStorage.getItem(lsKey(slot))
    if (!raw) return null
    const data: SaveData = JSON.parse(raw)
    return {
      slot:          data.slot,
      citizenId:     data.citizenId,
      handle:        data.handle,
      savedAt:       data.savedAt,
      playtime:      data.playtime,
      phase:         data.phase,
      activeMission: data.activeMission,
    }
  } catch { return null }
}

export function deleteSlot(slot: SlotId) {
  localStorage.removeItem(lsKey(slot))
}

export function newGame() {
  // Clear saves + citizen profile
  ;([1, 2, 3] as SlotId[]).forEach(deleteSlot)
  localStorage.removeItem('gridos_citizen')
  window.location.reload()
}

export function fmtPlaytime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
