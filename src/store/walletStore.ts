// walletStore.ts — player's ₳ balance + transaction log
import { create } from 'zustand'

export type Transaction = {
  id: string
  amount: number        // positive = credit, negative = debit
  label: string
  timestamp: number
}

interface WalletStore {
  balance: number
  log: Transaction[]
  credit: (amount: number, label: string) => void
  debit: (amount: number, label: string) => boolean  // returns false if insufficient
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  balance: 500,   // starting ₳
  log: [
    { id: 'init', amount: 500, label: 'Starting credits', timestamp: Date.now() },
  ],

  credit: (amount, label) => {
    const tx: Transaction = { id: crypto.randomUUID(), amount, label, timestamp: Date.now() }
    set(s => ({ balance: s.balance + amount, log: [tx, ...s.log].slice(0, 100) }))
  },

  debit: (amount, label) => {
    const { balance } = get()
    if (balance < amount) return false
    const tx: Transaction = { id: crypto.randomUUID(), amount: -amount, label, timestamp: Date.now() }
    set(s => ({ balance: s.balance - amount, log: [tx, ...s.log].slice(0, 100) }))
    return true
  },
}))
