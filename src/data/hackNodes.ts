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
