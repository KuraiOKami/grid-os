// ── hackNodes.ts ─────────────────────────────────────────────────────────────
// Static definitions for hackable nodes.
// Tier 0 = unsecured (no breach sequence).
// Tier 1-4 = increasing difficulty (breach sequence required, not yet implemented).

export interface HackFile {
  name:    string
  size:    string
  content: string
}

export interface HackNode {
  id:          string
  name:        string
  tier:        number        // 0 = unsecured, 1–4 = firewalled
  status:      'unsecured' | 'firewalled' | 'ghost' | 'unknown'
  scanNote?:   string        // extra line shown next to node in scan output
  files:       HackFile[]
  jobId?:      string        // job completed when targetFile is exfilled
  targetFile?: string
}

export const HACK_NODES: HackNode[] = [
  // ── Tutorial node — unsecured, active contract ────────────────────────────
  {
    id:         'r114',
    name:       'relay-node-r114',
    tier:       0,
    status:     'unsecured',
    scanNote:   'anonymous drop — active retrieval contract',
    jobId:      'tutorial-hack-01',
    targetFile: 'data_packet.bin',
    files: [
      {
        name:    'data_packet.bin',
        size:    '4.2K',
        content: [
          '[BINARY PAYLOAD — use exfil to retrieve]',
          '',
          'Package-ID : PKG-4471-R',
          'Client     : ANONYMOUS',
          'Contents   : [ENCRYPTED]',
          'Status     : READY_FOR_RETRIEVAL',
        ].join('\n'),
      },
      {
        name:    'relay_config.cfg',
        size:    '1.1K',
        content: [
          '# Relay Node R-114 — Runtime Config',
          'host            = relay-node-r114.grid.local',
          'sector          = 4',
          'uplink_target   = sector-7-hub',
          'bandwidth       = 1.2Gbps',
          'auth_mode       = NONE',
          'last_service    = cycle_14',
          'status          = active',
        ].join('\n'),
      },
      {
        name:    'README.txt',
        size:    '0.3K',
        content: [
          'RELAY NODE R-114',
          'Sector 4 uplink station. Standard traffic routing.',
          'Last serviced: cycle 14.',
          '',
          '[NOTE] Data packet left by anonymous client. Marked for retrieval.',
          'Do not delete. Do not inspect contents.',
        ].join('\n'),
      },
    ],
  },

  // ── The Pit — underground open WiFi ──────────────────────────────────────
  {
    id:     'ghost-net-55',
    name:   'ghost_net_55',
    tier:   0,
    status: 'unsecured',
    files: [
      {
        name:    'board.txt',
        size:    '2.1K',
        content: [
          '# ghost_net_55 // open relay board',
          '# no logs. no names. no traces.',
          '',
          '[ANON_A] drop 441 confirmed. box 7, cycle end.',
          '[ANON_B] R-114 still clean?',
          '[ANON_A] for now. move the other package before cycle 16.',
          '[ANON_C] anyone have a spare mirror key? civic.archive mirrors going dark.',
          '[ANON_B] check voidbay. someone listed one last cycle.',
          '[ANON_D] PHX cell 3 went quiet. assume compromised. rotate contacts.',
          '[ANON_A] ROOT BLOOM is closer than they\'re saying. watch the sector 7 nodes.',
        ].join('\n'),
      },
      {
        name:    'drop_441.enc',
        size:    '0.8K',
        content: [
          '[ENCRYPTED DROP — PKG-441]',
          'Decryption key required.',
          'Contact: ANON_A via ghost_net relay.',
          '',
          'Metadata (unencrypted):',
          '  type    : civic_record_fragment',
          '  origin  : civic.archive/flowering',
          '  expires : cycle_16',
        ].join('\n'),
      },
      {
        name:    'contracts.txt',
        size:    '1.4K',
        content: [
          '# Pit board — open contracts',
          '',
          '[ ₳ 310 ] Data scrape — pull public node logs before next GridOS sweep.',
          '          Contact ANON_B. No identity check.',
          '',
          '[ ₳ 500 ] Mirror audit — verify integrity on three civic mirrors.',
          '          Time sensitive. Mirrors going dark.',
          '',
          '[ ₳ 750 ] Signal trace — locate source of ghost crawler pings in sector 4.',
          '          Danger pay included. Do not ask what you\'re looking for.',
        ].join('\n'),
      },
    ],
  },

  // ── Sector 7 Market — open guest WiFi ────────────────────────────────────
  {
    id:     'gridmart-guest',
    name:   'GRIDMART_GUEST',
    tier:   0,
    status: 'unsecured',
    files: [
      {
        name:    'session_log.txt',
        size:    '3.2K',
        content: [
          '# GRIDMART_GUEST — captured session log',
          '# cleartext HTTP traffic intercepted this cycle',
          '',
          'citizen_7741 :: purchase :: GridMart order #88123 :: ₳ 42',
          'citizen_2290 :: search :: "cheap relay tokens sector 4"',
          'citizen_5512 :: login :: session token exposed (unencrypted)',
          'citizen_0381 :: message_draft :: "I know what they did to the archive —"',
          '                [DRAFT SAVED — NOT SENT]',
          'citizen_7741 :: purchase :: GridMart order #88124 :: ₳ 17',
          '',
          '# Note: session token for citizen_5512 may be reusable.',
          '# This log is unencrypted because GRIDMART_GUEST has no TLS.',
        ].join('\n'),
      },
      {
        name:    'promo_tracking.bin',
        size:    '1.8K',
        content: [
          '[BINARY — GridMart ad tracking payload]',
          '',
          'Device fingerprints: 441 unique devices this cycle.',
          'Location pings: 441 → Sector 7 Market.',
          'Behaviour clusters: shopping (62%), browsing (28%), idle (10%).',
          '',
          '# Sellable to: data brokers, Syndicate market division.',
          '# Value estimate: ₳ 80–200 depending on buyer.',
        ].join('\n'),
      },
    ],
  },

  // ── Higher-tier nodes (locked until breach sequences are implemented) ─────
  {
    id:     'corp-443',
    name:   'gridos-regional-01',
    tier:   3,
    status: 'firewalled',
    files:  [],
  },
  {
    id:     'void-77',
    name:   'unknown',
    tier:   4,
    status: 'ghost',
    files:  [],
  },
]
