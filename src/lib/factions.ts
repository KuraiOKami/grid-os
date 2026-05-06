// ── factions.ts ────────────────────────────────────────────────────────────
// Single source of truth for all faction metadata.
// Import this anywhere you need faction colors, names, or descriptions.

export type FactionId = 'nexus' | 'synd' | 'phantom' | 'guild' | 'iron'

export interface Faction {
  id:          FactionId
  name:        string
  shortName:   string
  color:       string
  tagline:     string
  description: string
  alignment:   string
  badge:       string   // short sigil shown in UI
}

export const FACTIONS: Record<FactionId, Faction> = {
  nexus: {
    id:          'nexus',
    name:        'NEXUS AUTHORITY',
    shortName:   'NEXUS',
    color:       '#00e5ff',
    tagline:     'Order. Prosperity. Compliance.',
    description: 'The corporation-state that runs the Grid. Offers the best contracts and highest pay, but tracks everything. The closer you get to NEXUS, the harder it is to leave.',
    alignment:   'Compliance',
    badge:       '[N]',
  },
  synd: {
    id:          'synd',
    name:        'THE SYNDICATE',
    shortName:   'SYND',
    color:       '#ffaa00',
    tagline:     'Every transaction has a price.',
    description: 'Organized crime that went corporate. They own the black market, the underground exchange, the smuggling lanes. Not evil — just business. They deal with everyone.',
    alignment:   'Neutral / Power',
    badge:       '[S]',
  },
  phantom: {
    id:          'phantom',
    name:        'PHANTOM',
    shortName:   'PHX',
    color:       '#d6a2ff',
    tagline:     'The Grid lies. We expose it.',
    description: 'Leaderless hacktivist collective operating in cells. They expose NEXUS corruption, run counter-surveillance, and broadcast leaks. Joining costs you compliance. Refusing costs you conscience.',
    alignment:   'Shadow',
    badge:       '[P]',
  },
  guild: {
    id:          'guild',
    name:        'THE GUILD',
    shortName:   'GUILD',
    color:       '#00cc88',
    tagline:     'Craft is currency.',
    description: 'A skilled labor union that became indispensable. Everyone needs a Guild member. Apolitical by charter, powerful by necessity. They make the things that make the world run.',
    alignment:   'Neutral / Craft',
    badge:       '[G]',
  },
  iron: {
    id:          'iron',
    name:        'IRON CIRCUIT',
    shortName:   'IRON',
    color:       '#ff3b5c',
    tagline:     'We do the work nobody else will.',
    description: 'Mercenary faction. No ideology, no questions. Muscle-for-hire, black ops, enforcement. Feared by NEXUS, contracted by SYND, respected by GUILD. They exist because violence is a service.',
    alignment:   'Shadow / Force',
    badge:       '[I]',
  },
}

export const FACTION_LIST = Object.values(FACTIONS)

// Faction apps — gated by faction standing
export interface FactionApp {
  id:       string
  name:     string
  faction:  FactionId
  icon:     string
  tagline:  string
  minRep:   number    // minimum faction rep required to install
}

export const FACTION_APPS: FactionApp[] = [
  // NEXUS
  { id: 'civtrack',    name: 'CivTrack',     faction: 'nexus',   icon: '[ID]', tagline: 'Citizen compliance dashboard',       minRep: 10  },
  { id: 'gridwork',    name: 'GridWork',     faction: 'nexus',   icon: '[JB]', tagline: 'Official NEXUS contract terminal',    minRep: 20  },
  // SYND
  { id: 'blackmarket', name: 'BlackMarket',  faction: 'synd',    icon: '[BM]', tagline: 'Underground item exchange',           minRep: 15  },
  { id: 'ledger',      name: 'Ledger',       faction: 'synd',    icon: '[$]',  tagline: 'Shadow stock market',                minRep: 30  },
  // PHANTOM
  { id: 'ghostshell',  name: 'GhostShell',  faction: 'phantom', icon: '[GS]', tagline: 'Encrypted trace & decrypt terminal',  minRep: 20  },
  { id: 'broadcast',   name: 'Broadcast',   faction: 'phantom', icon: '[>>]', tagline: 'Anonymous pirate broadcast board',    minRep: 10  },
  // GUILD
  { id: 'workbench',   name: 'Workbench',   faction: 'guild',   icon: '[WB]', tagline: 'Crafting & component assembly',       minRep: 10  },
  { id: 'contracthub', name: 'ContractHub', faction: 'guild',   icon: '[CH]', tagline: 'Skilled labor marketplace',           minRep: 20  },
  // IRON
  { id: 'dispatch',    name: 'Dispatch',    faction: 'iron',    icon: '[DX]', tagline: 'Covert mission board',               minRep: 15  },
  { id: 'armory',      name: 'Armory',      faction: 'iron',    icon: '[AR]', tagline: 'Loadout & countermeasure upgrades',   minRep: 25  },
]
