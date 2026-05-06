// ── locations.ts ─────────────────────────────────────────────────────────────
// Physical world locations with scannable signals.
// Signals link to the hack system (hackNodeId) or have direct sniff loot.

export type SignalType = 'wifi' | 'bluetooth' | 'device' | 'phone'

export interface SignalLoot {
  type:      'credits' | 'data'
  amount?:   number     // credits
  filename?: string     // data file written to ~/filename
  content?:  string
  label:     string     // shown in result toast
}

export interface LocationSignal {
  id:          string
  type:        SignalType
  name:        string
  tier:        0 | 1 | 2 | 3 | 4
  secured:     boolean         // false = directly sniffable
  owner?:      string          // NPC handle shown in detail
  hackNodeId?: string          // connect <hackNodeId> in Terminal
  sniffLoot?:  SignalLoot      // yield on successful sniff (only if !secured)
  sniffTimeMs: number          // how long the sniff takes
}

export interface LocationConnection {
  id:    string   // destination location ID
  ms:    number   // travel time in milliseconds
}

export interface Location {
  id:          string
  name:        string
  district:    string
  flavor:      string
  riskLevel:   0 | 1 | 2 | 3   // 0 = none, 3 = heavy GridOS presence
  gridCoverage: boolean
  mapX:        number            // node center in 240×300 map canvas
  mapY:        number
  connections: LocationConnection[]
  signals:     LocationSignal[]
}

export const LOCATIONS: Location[] = [

  // ─ Sector 7: Residential Block ──────────────────────────────────────────
  {
    id:          'sector-7/home',
    name:        'Residential Block 7',
    district:    'SECTOR 7',
    flavor:      'Your base of operations. Low foot traffic. Few signals of interest.',
    riskLevel:   0,
    gridCoverage: false,
    mapX: 60, mapY: 55,
    connections: [
      { id: 'sector-7/market',      ms: 12_000 },
      { id: 'sector-4/relay-hub',   ms: 22_000 },
    ],
    signals: [
      {
        id:          'home-wifi-own',
        type:        'wifi',
        name:        'HOME_NET_4471',
        tier:        0,
        secured:     false,
        sniffTimeMs: 3_000,
        sniffLoot:   { type: 'credits', amount: 0, label: 'Your own network. Nothing useful.' },
      },
    ],
  },

  // ─ Sector 7: Market District ────────────────────────────────────────────
  {
    id:          'sector-7/market',
    name:        'Sector 7 Market',
    district:    'SECTOR 7',
    flavor:      'Open-air market. High foot traffic. GridOS kiosks on every corner. Lots of signals.',
    riskLevel:   1,
    gridCoverage: true,
    mapX: 180, mapY: 55,
    connections: [
      { id: 'sector-7/home',        ms: 12_000 },
      { id: 'sector-4/relay-hub',   ms: 18_000 },
      { id: 'sector-4/underground', ms: 28_000 },
    ],
    signals: [
      {
        id:          'market-wifi-guest',
        type:        'wifi',
        name:        'GRIDMART_GUEST',
        tier:        0,
        secured:     false,
        sniffTimeMs: 5_000,
        sniffLoot: {
          type:   'credits',
          amount: 95,
          label:  'Cleartext payment traffic — intercepted ₳ 95 from unencrypted session.',
        },
      },
      {
        id:          'market-phone-unknown',
        type:        'phone',
        name:        'phone_3f7_unknown',
        tier:        1,
        secured:     true,
        owner:       'unknown citizen',
        sniffTimeMs: 6_000,
      },
      {
        id:          'market-wifi-internal',
        type:        'wifi',
        name:        'GRIDMART_INTERNAL',
        tier:        2,
        secured:     true,
        sniffTimeMs: 8_000,
      },
    ],
  },

  // ─ Sector 4: Transit Relay Hub ──────────────────────────────────────────
  {
    id:          'sector-4/relay-hub',
    name:        'Sector 4 Relay Hub',
    district:    'SECTOR 4',
    flavor:      'Transit infrastructure node. Relay-node R-114 is physically located here. Moderate GridOS presence.',
    riskLevel:   1,
    gridCoverage: true,
    mapX: 60, mapY: 160,
    connections: [
      { id: 'sector-7/home',        ms: 22_000 },
      { id: 'sector-7/market',      ms: 18_000 },
      { id: 'sector-4/underground', ms: 10_000 },
      { id: 'nexus/plaza',          ms: 35_000 },
    ],
    signals: [
      {
        id:          'r114-device',
        type:        'device',
        name:        'relay-node-r114',
        tier:        0,
        secured:     false,
        hackNodeId:  'r114',
        sniffTimeMs: 4_000,
        sniffLoot: {
          type:    'data',
          filename:'relay_r114_log.txt',
          content: [
            '# Relay Node R-114 — Traffic Log',
            'cycle_14 :: 18,440 packets routed',
            'cycle_14 :: 2 anonymous payloads flagged (auto-cleared)',
            'cycle_14 :: PKG-4471-R deposited by ANON_CLIENT',
            'cycle_14 :: no maintenance required',
          ].join('\n'),
          label: 'Traffic log from R-114 — saved to your home folder.',
        },
      },
      {
        id:          'relay-wifi-admin',
        type:        'wifi',
        name:        'RELAY_ADMIN_24',
        tier:        2,
        secured:     true,
        sniffTimeMs: 8_000,
      },
    ],
  },

  // ─ Sector 4: The Pit (underground café) ─────────────────────────────────
  {
    id:          'sector-4/underground',
    name:        'The Pit',
    district:    'SECTOR 4',
    flavor:      'Basement café. No GridOS kiosks. Unofficial meeting point for freelancers and runners.',
    riskLevel:   0,
    gridCoverage: false,
    mapX: 180, mapY: 160,
    connections: [
      { id: 'sector-7/market',      ms: 28_000 },
      { id: 'sector-4/relay-hub',   ms: 10_000 },
      { id: 'nexus/plaza',          ms: 25_000 },
    ],
    signals: [
      {
        id:          'pit-wifi-ghost',
        type:        'wifi',
        name:        'ghost_net_55',
        tier:        0,
        secured:     false,
        sniffTimeMs: 5_000,
        sniffLoot: {
          type:     'data',
          filename: 'ghost_net_capture.txt',
          content: [
            '# ghost_net_55 — packet capture',
            'ANON_A → ANON_B :: "drop confirmed, box 7, cycle end"',
            'ANON_B → ANON_A :: "R-114 still clean?"',
            'ANON_A → ANON_B :: "for now. move the other package before cycle 16"',
            '[END CAPTURE]',
          ].join('\n'),
          label:  'Encrypted traffic fragment — saved to your home folder.',
        },
      },
      {
        id:          'pit-bt-device',
        type:        'bluetooth',
        name:        'device_881_unknown',
        tier:        1,
        secured:     true,
        sniffTimeMs: 6_000,
      },
      {
        id:          'pit-wifi-void',
        type:        'wifi',
        name:        'void_relay_internal',
        tier:        2,
        secured:     true,
        sniffTimeMs: 8_000,
      },
    ],
  },

  // ─ Nexus District: Public Plaza ─────────────────────────────────────────
  {
    id:          'nexus/plaza',
    name:        'Nexus Public Plaza',
    district:    'NEXUS DISTRICT',
    flavor:      'The corporate heart of the Grid. Heavy surveillance. High-value signals — high risk.',
    riskLevel:   3,
    gridCoverage: true,
    mapX: 120, mapY: 255,
    connections: [
      { id: 'sector-4/relay-hub',   ms: 35_000 },
      { id: 'sector-4/underground', ms: 25_000 },
    ],
    signals: [
      {
        id:          'nexus-wifi-visitor',
        type:        'wifi',
        name:        'NEXUS_VISITOR_PUBLIC',
        tier:        1,
        secured:     false,
        sniffTimeMs: 5_000,
        sniffLoot: {
          type:   'credits',
          amount: 210,
          label:  'Corporate session tokens — converted ₳ 210. Compliance risk elevated.',
        },
      },
      {
        id:          'nexus-wifi-secure',
        type:        'wifi',
        name:        'NEXUS_SECURE_A',
        tier:        3,
        secured:     true,
        sniffTimeMs: 8_000,
      },
      {
        id:          'nexus-device-regional',
        type:        'device',
        name:        'gridos-regional-01',
        tier:        3,
        secured:     true,
        hackNodeId:  'corp-443',
        sniffTimeMs: 8_000,
      },
      {
        id:          'nexus-phone-exec',
        type:        'phone',
        name:        'exec_device_44',
        tier:        2,
        secured:     true,
        owner:       'GridOS Director',
        sniffTimeMs: 7_000,
      },
    ],
  },
]

export function getLocation(id: string): Location | undefined {
  return LOCATIONS.find(l => l.id === id)
}

export function isAdjacent(fromId: string, toId: string): boolean {
  const loc = getLocation(fromId)
  return loc?.connections.some(c => c.id === toId) ?? false
}

export function travelTime(fromId: string, toId: string): number {
  const loc = getLocation(fromId)
  return loc?.connections.find(c => c.id === toId)?.ms ?? 0
}
