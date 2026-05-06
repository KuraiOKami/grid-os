// careerStore.ts — tracks XP and level per career path
import { create } from 'zustand'

export type CareerKey = 'hacker' | 'auditor' | 'courier' | 'broker' | 'archivist'

export type CareerProgress = {
  key: CareerKey
  xp: number
  level: number      // 1–10
}

interface CareerStore {
  careers: Record<CareerKey, CareerProgress>
  addXP: (career: CareerKey, amount: number) => void
}

const XP_PER_LEVEL = 100   // simple flat threshold for now

const DEFAULT = (key: CareerKey): CareerProgress => ({ key, xp: 0, level: 1 })

export const useCareerStore = create<CareerStore>((set) => ({
  careers: {
    hacker:    DEFAULT('hacker'),
    auditor:   DEFAULT('auditor'),
    courier:   DEFAULT('courier'),
    broker:    DEFAULT('broker'),
    archivist: DEFAULT('archivist'),
  },

  addXP: (career, amount) => set(s => {
    const prev = s.careers[career]
    const newXP = prev.xp + amount
    const newLevel = Math.min(10, Math.floor(newXP / XP_PER_LEVEL) + 1)
    return {
      careers: {
        ...s.careers,
        [career]: { ...prev, xp: newXP, level: newLevel },
      },
    }
  }),
}))
