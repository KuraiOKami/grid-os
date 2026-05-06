// inventoryStore.ts — player's owned items
import { create } from 'zustand'
import type { ShopItem } from '@/data/shopItems'

export type OwnedItem = {
  id: string
  itemId: string
  label: string
  usesLeft: number | null   // null = permanent
  acquiredAt: number
}

interface InventoryStore {
  items: OwnedItem[]
  addItem: (item: ShopItem) => void
  consumeItem: (id: string) => void
  hasItem: (itemId: string) => boolean
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],

  addItem: (item) => {
    const owned: OwnedItem = {
      id: crypto.randomUUID(),
      itemId: item.id,
      label: item.name,
      usesLeft: item.uses ?? null,
      acquiredAt: Date.now(),
    }
    set(s => ({ items: [...s.items, owned] }))
  },

  consumeItem: (id) => set(s => ({
    items: s.items
      .map(i => i.id === id && i.usesLeft !== null ? { ...i, usesLeft: i.usesLeft - 1 } : i)
      .filter(i => i.usesLeft === null || i.usesLeft > 0),
  })),

  hasItem: (itemId) => get().items.some(i => i.itemId === itemId),
}))
