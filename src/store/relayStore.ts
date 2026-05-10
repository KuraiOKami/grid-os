import { create } from 'zustand'

export interface RelayNode {
  id:      string
  label:   string
  latency: string
  trust:   'low' | 'med' | 'high'
  up:      boolean
  note?:   string
}

export const RELAY_NODES: RelayNode[] = [
  { id: 'dark-1',   label: 'relay.dark.net',      latency: '12ms',  trust: 'low',  up: true,  note: 'Fast. No logs. Owned by nobody.' },
  { id: 'exit-9',   label: 'exit-node-9',          latency: '38ms',  trust: 'med',  up: true,  note: 'Reliable exit node. Mid-tier trust.' },
  { id: 'onion-3',  label: 'onion-proxy-3',        latency: '94ms',  trust: 'high', up: true,  note: 'Slow but nearly untraceable.' },
  { id: 'ghost-7',  label: 'ghost-7.relay',        latency: '61ms',  trust: 'med',  up: false, note: 'Currently offline — burned last cycle.' },
  { id: 'void-2',   label: 'void-exit-2.net',      latency: '127ms', trust: 'high', up: true,  note: 'VoidSyndicate-operated. Highest anonymity.' },
  { id: 'corp-4',   label: 'leaked-corp-node-4',   latency: '8ms',   trust: 'low',  up: true,  note: 'Hijacked corp node. Fast but risky.' },
  { id: 'guild-r',  label: 'guild.relay.private',  latency: '44ms',  trust: 'med',  up: true,  note: 'Guild-operated. Stable. Members only.' },
]

interface RelayState {
  chain:  string[]   // ordered node IDs
  active: boolean

  addHop:     (id: string) => void
  removeHop:  (id: string) => void
  clearChain: () => void
  setActive:  (v: boolean) => void
}

export const useRelayStore = create<RelayState>((set) => ({
  chain:  [],
  active: false,

  addHop:     (id) => set(s => ({
    chain: s.chain.includes(id) ? s.chain : [...s.chain, id],
  })),
  removeHop:  (id) => set(s => ({ chain: s.chain.filter(x => x !== id), active: false })),
  clearChain: ()   => set({ chain: [], active: false }),
  setActive:  (v)  => set({ active: v }),
}))

export function relayHeatMultiplier(chain: string[]): number {
  // Each hop reduces heat by 25%, min 10% of original
  return Math.max(0.1, 1 - chain.length * 0.25)
}
