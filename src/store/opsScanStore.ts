// opsScanStore.ts — persists OPS scan history across sessions
import { create } from 'zustand'

export interface ScanRecord {
  target: string
  scannedAt: string
  kind: 'site' | 'player' | 'not_found'
  data: Record<string, string>
}

interface OpsScanStore {
  history: ScanRecord[]
  addRecord: (record: ScanRecord) => void
  clearHistory: () => void
}

export const useOpsScanStore = create<OpsScanStore>((set) => ({
  history: [],
  addRecord: (record) =>
    set((state) => ({
      history: [
        record,
        ...state.history.filter((r) => r.target !== record.target),
      ].slice(0, 50),
    })),
  clearHistory: () => set({ history: [] }),
}))
