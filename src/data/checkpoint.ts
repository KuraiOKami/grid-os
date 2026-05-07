// ── checkpoint.ts ─────────────────────────────────────────────────────────────
// Data definitions for the Checkpoint Operator app.
// Each shift has a bulletin (rules for the day), a database (ground truth),
// and a queue of applicants with documents that may or may not be honest.

export type DocType = 'id' | 'permit' | 'compliance' | 'employment' | 'registration'

export type DenyReason =
  | 'expired'
  | 'employer_unregistered'
  | 'compliance_low'
  | 'inconsistency'
  | 'sector_closed'
  | 'incomplete'
  | 'mismatch'

export const DENY_REASONS: { key: DenyReason; label: string }[] = [
  { key: 'expired',              label: 'Document expired'                         },
  { key: 'employer_unregistered',label: 'Employer not in approved registry'        },
  { key: 'compliance_low',       label: 'Compliance below required threshold'      },
  { key: 'inconsistency',        label: 'Data inconsistency between documents'     },
  { key: 'sector_closed',        label: 'Destination sector currently closed'      },
  { key: 'incomplete',           label: 'Required documents not provided'          },
  { key: 'mismatch',             label: 'Document details do not match identity'   },
]

export interface DocField {
  label:      string
  value:      string
  dbMismatch?: boolean   // document claims a value that differs from the database
  dbValue?:    string    // what the database actually shows
  expired?:    boolean   // value is a cycle number that's past the current cycle
}

export interface CheckDoc {
  type:   DocType
  title:  string
  issuer: string
  fields: DocField[]
}

export interface Applicant {
  id:             string
  handle:         string
  plea:           string
  request:        string
  docs:           CheckDoc[]
  extraDoc?:      CheckDoc       // revealed on interrogate
  correct:        'approve' | 'deny'
  correctReason?: DenyReason     // required if correct === 'deny'
  outcome: {
    correct: { text: string; compliance: number; shadow: number; pay: number }
    wrong:   { text: string; compliance: number; shadow: number; pay: number }
  }
}

export interface ShiftDatabase {
  cycle:             number
  nexusThreshold:    number
  approvedEmployers: string[]
  sectorStatus:      Record<string, 'OPEN' | 'CLOSED'>
  liveCompliance:    Record<string, { score: number; label: string }>
  currentAuthority:  string
}

export interface BulletinEntry {
  type:    'rule' | 'update' | 'notice' | 'warning'
  text:    string
}

export interface Shift {
  id:         string
  title:      string
  cycle:      number
  bulletin:   BulletinEntry[]
  quota:      number
  timeLimit:  number    // seconds per applicant
  shiftBonus: number    // ₳ if quota met
  database:   ShiftDatabase
  applicants: Applicant[]
}

// ── Shift 01 ──────────────────────────────────────────────────────────────────

export const SHIFT_01: Shift = {
  id:    'shift-01',
  title: 'CHECKPOINT — NEXUS BORDER CONTROL',
  cycle: 14,

  bulletin: [
    { type: 'rule',    text: 'All applicants must present a valid GridOS Citizen ID (not expired, status ACTIVE).' },
    { type: 'rule',    text: 'Cross-sector transit requires a Sector Transit Permit with matching citizen number and valid dates.' },
    { type: 'update',  text: 'Nexus District access: compliance threshold raised to 60 (TRUSTED or above) effective this cycle.' },
    { type: 'rule',    text: 'Employment verification: employer must appear in the Approved Employer Registry.' },
    { type: 'notice',  text: 'Sector 3 CLOSED — infrastructure maintenance. All transit to Sector 3 denied until further notice.' },
    { type: 'warning', text: 'Compliance scores on documents must match the live GridOS database. Discrepancies constitute an inconsistency violation.' },
    { type: 'notice',  text: 'Session quota: 3 approvals required. Failure to meet quota is logged.' },
  ],

  quota:      3,
  timeLimit:  45,
  shiftBonus: 60,

  database: {
    cycle:          14,
    nexusThreshold: 60,
    approvedEmployers: [
      'GridOS Corp',
      'Archivist Guild',
      'Iron Circuit Operations',
      'Pulse News Network',
      'GridOS Medical Services',
      'GridOS Data Services',
      'Nexus Infrastructure Authority',
      'Citizen Transit Services',
      'GridOS Security Division',
      'Nexus Authority',
    ],
    sectorStatus: {
      'Sector 1': 'OPEN',
      'Sector 2': 'OPEN',
      'Sector 3': 'CLOSED',
      'Sector 4': 'OPEN',
      'Sector 5': 'OPEN',
      'Sector 6': 'OPEN',
      'Sector 7': 'OPEN',
      'Nexus District': 'OPEN',
    },
    liveCompliance: {
      'greer.441':     { score: 52, label: 'OBSERVED' },
      'fade.proxy':    { score: 48, label: 'OBSERVED' },
      '08-ghost':      { score: 52, label: 'OBSERVED' },
      'voss.thresh':   { score: 44, label: 'FLAGGED'  },   // document claims 68
      'anon_freight_k':{ score: 45, label: 'OBSERVED' },
      'lena.arc':      { score: 45, label: 'OBSERVED' },
      'null_runner_4': { score: 55, label: 'OBSERVED' },
      'val.crane':     { score: 82, label: 'TRUSTED'  },
    },
    currentAuthority: 'Director V. CRANE — Nexus Authority',
  },

  applicants: [

    // ── 1. greer.441 — APPROVE (clean, tutorial case) ──────────────────────
    {
      id: 'greer-441', handle: 'greer.441',
      request: 'Sector transit — Sector 7 to Sector 4',
      plea: 'Daily commute. I run deliveries out of Sector 4. I\'m already running late.',
      correct: 'approve',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: 'greer.441'          },
            { label: 'Citizen No.',  value: 'CIT-6401'           },
            { label: 'Residence',    value: 'Sector 7 — Residential' },
            { label: 'Compliance',   value: '52 / OBSERVED'      },
            { label: 'Status',       value: 'ACTIVE'             },
            { label: 'Issue Cycle',  value: 'Cycle 6'            },
            { label: 'Expiry Cycle', value: 'Cycle 18'           },
          ],
        },
        {
          type: 'permit', title: 'SECTOR TRANSIT PERMIT', issuer: 'Nexus Authority Transit Division',
          fields: [
            { label: 'Permit No.',   value: 'STP-7704'           },
            { label: 'Citizen No.',  value: 'CIT-6401'           },
            { label: 'From',         value: 'Sector 7'           },
            { label: 'To',           value: 'Sector 4'           },
            { label: 'Valid From',   value: 'Cycle 12'           },
            { label: 'Valid Through',value: 'Cycle 18'           },
            { label: 'Purpose',      value: 'WORK'               },
          ],
        },
      ],
      outcome: {
        correct: { text: 'greer.441 passes through. Their shift starts on time.', compliance: 0, shadow: 0, pay: 40 },
        wrong:   { text: 'greer.441 is denied without cause. A checkpoint complaint is filed.', compliance: -1, shadow: 0, pay: 20 },
      },
    },

    // ── 2. fade.proxy — DENY (permit expired cycle 12, current is 14) ──────
    {
      id: 'fade-proxy', handle: 'fade.proxy',
      request: 'Sector transit — Sector 4 to Sector 7',
      plea: 'My renewal is stuck in the queue. I\'ve been here for days. My family is in Sector 7. Please.',
      correct: 'deny', correctReason: 'expired',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: 'fade.proxy'             },
            { label: 'Citizen No.',  value: 'CIT-7723'               },
            { label: 'Residence',    value: 'Sector 4 — Transit Hub' },
            { label: 'Compliance',   value: '48 / OBSERVED'          },
            { label: 'Status',       value: 'ACTIVE'                 },
            { label: 'Issue Cycle',  value: 'Cycle 9'                },
            { label: 'Expiry Cycle', value: 'Cycle 20'               },
          ],
        },
        {
          type: 'permit', title: 'SECTOR TRANSIT PERMIT', issuer: 'Nexus Authority Transit Division',
          fields: [
            { label: 'Permit No.',   value: 'STP-4418'   },
            { label: 'Citizen No.',  value: 'CIT-7723'   },
            { label: 'From',         value: 'Sector 4'   },
            { label: 'To',           value: 'Sector 7'   },
            { label: 'Valid From',   value: 'Cycle 10'   },
            { label: 'Valid Through',value: 'Cycle 12', expired: true },
            { label: 'Purpose',      value: 'PERSONAL'   },
          ],
        },
      ],
      outcome: {
        correct: { text: 'fade.proxy is denied transit. They join the renewal queue. Waiting time: unknown.', compliance: 0, shadow: 0, pay: 40 },
        wrong:   { text: 'fade.proxy is waved through on an expired permit. The checkpoint is flagged in the next audit.', compliance: -2, shadow: 0, pay: 20 },
      },
    },

    // ── 3. 08-ghost — APPROVE (clean, Watch crossover recognition) ─────────
    {
      id: 'citizen-0812', handle: '08-ghost',
      request: 'Annual employment verification — GridOS standard procedure',
      plea: 'Annual verification. Routine. I do this every cycle.',
      correct: 'approve',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: '08-ghost'                    },
            { label: 'Citizen No.',  value: 'CIT-0812'                    },
            { label: 'Residence',    value: 'Sector 7 — Residential'      },
            { label: 'Compliance',   value: '52 / OBSERVED'               },
            { label: 'Status',       value: 'ACTIVE'                      },
            { label: 'Issue Cycle',  value: 'Cycle 4'                     },
            { label: 'Expiry Cycle', value: 'Cycle 22'                    },
          ],
        },
        {
          type: 'employment', title: 'EMPLOYMENT VERIFICATION', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: '08-ghost'                    },
            { label: 'Employer',     value: 'GridOS Corp'                 },
            { label: 'Role',         value: 'Data Entry Processor — Compliance Division' },
            { label: 'Start Cycle',  value: 'Cycle 4'                     },
            { label: 'Clearance',    value: 'STANDARD'                    },
            { label: 'Signed By',    value: 'Director V. CRANE'           },
          ],
        },
      ],
      outcome: {
        correct: { text: '08-ghost\'s verification is stamped. They return to their desk.', compliance: 0, shadow: 0, pay: 40 },
        wrong:   { text: '08-ghost is denied for no valid reason. A quiet note is added to your checkpoint record.', compliance: -1, shadow: -1, pay: 20 },
      },
    },

    // ── 4. voss.thresh — DENY (compliance doc=68 vs DB=44, inconsistency) ──
    {
      id: 'voss-thresh', handle: 'voss.thresh',
      request: 'Nexus District access — official business',
      plea: 'I have Nexus clearance. I work there three days a week. I don\'t understand the problem.',
      correct: 'deny', correctReason: 'inconsistency',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: 'voss.thresh'            },
            { label: 'Citizen No.',  value: 'CIT-9204'               },
            { label: 'Residence',    value: 'Sector 4 — Transit Hub' },
            { label: 'Compliance',   value: '68 / TRUSTED'           },
            { label: 'Status',       value: 'ACTIVE'                 },
            { label: 'Issue Cycle',  value: 'Cycle 8'                },
            { label: 'Expiry Cycle', value: 'Cycle 20'               },
          ],
        },
        {
          type: 'permit', title: 'NEXUS DISTRICT ACCESS PERMIT', issuer: 'Nexus Authority — Access Division',
          fields: [
            { label: 'Permit No.',   value: 'NAP-3301'           },
            { label: 'Citizen No.',  value: 'CIT-9204'           },
            { label: 'Access Zone',  value: 'Nexus District'     },
            { label: 'Valid From',   value: 'Cycle 13'           },
            { label: 'Valid Through',value: 'Cycle 16'           },
            { label: 'Purpose',      value: 'OFFICIAL'           },
          ],
        },
        {
          type: 'compliance', title: 'GRIDOS COMPLIANCE REPORT', issuer: 'GridOS Compliance Services',
          fields: [
            { label: 'Citizen No.',       value: 'CIT-9204'         },
            { label: 'Handle',            value: 'voss.thresh'      },
            { label: 'Score',             value: '68 / TRUSTED', dbMismatch: true, dbValue: '44 / FLAGGED' },
            { label: 'Last Updated',      value: 'Cycle 13'         },
            { label: 'Flagged Incidents', value: '0'                },
            { label: 'Access Tier',       value: 'TRUSTED'          },
          ],
        },
      ],
      outcome: {
        correct: { text: 'voss.thresh is denied pending compliance review. The score discrepancy is logged.', compliance: 1, shadow: 0, pay: 50 },
        wrong:   { text: 'voss.thresh enters the Nexus District on a stale compliance record. Flagged in the next automated audit.', compliance: -2, shadow: 0, pay: 30 },
      },
    },

    // ── 5. anon_freight_k — DENY (employer not in registry) ────────────────
    {
      id: 'anon-freight-k', handle: 'anon_freight_k',
      request: 'Employment verification — new position',
      plea: 'I just started three days ago. They said the registration was filed. Please, I need this job.',
      correct: 'deny', correctReason: 'employer_unregistered',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: 'anon_freight_k'      },
            { label: 'Citizen No.',  value: 'CIT-3344'            },
            { label: 'Residence',    value: 'Sector 4'            },
            { label: 'Compliance',   value: '45 / OBSERVED'       },
            { label: 'Status',       value: 'ACTIVE'              },
            { label: 'Issue Cycle',  value: 'Cycle 11'            },
            { label: 'Expiry Cycle', value: 'Cycle 18'            },
          ],
        },
        {
          type: 'employment', title: 'EMPLOYMENT VERIFICATION', issuer: 'Anon Freight Solutions',
          fields: [
            { label: 'Handle',       value: 'anon_freight_k'      },
            { label: 'Employer',     value: 'Anon Freight Solutions' },
            { label: 'Role',         value: 'Courier Operator'    },
            { label: 'Start Cycle',  value: 'Cycle 14'            },
            { label: 'Clearance',    value: 'STANDARD'            },
            { label: 'Signed By',    value: 'K. REED — Operations' },
          ],
        },
      ],
      extraDoc: {
        type: 'registration', title: 'EMPLOYER REGISTRY STATUS', issuer: 'GridOS Commerce Verification',
        fields: [
          { label: 'Employer',     value: 'Anon Freight Solutions' },
          { label: 'Status',       value: 'PENDING — not approved' },
          { label: 'Submitted',    value: 'Cycle 14'               },
          { label: 'Approval',     value: 'Minimum 3 cycles required' },
        ],
      },
      outcome: {
        correct: { text: 'anon_freight_k is denied. Their employer\'s registration is pending — minimum 3 cycles.', compliance: 0, shadow: 0, pay: 40 },
        wrong:   { text: 'anon_freight_k is verified with an unregistered employer. A compliance flag is issued against the checkpoint.', compliance: -2, shadow: 0, pay: 20 },
      },
    },

    // ── 6. lena.arc — DENY (compliance 45, below Nexus threshold of 60) ────
    // Correct decision is DENY but she's innocent — rules changed this cycle.
    {
      id: 'lena-arc', handle: 'lena.arc',
      request: 'Sector transit — Sector 7 to Nexus District',
      plea: 'I have a committee meeting with the Archivist Guild. My permit is valid. I\'ve done this every cycle.',
      correct: 'deny', correctReason: 'compliance_low',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: 'lena.arc'               },
            { label: 'Citizen No.',  value: 'CIT-0334'               },
            { label: 'Residence',    value: 'Sector 7 — Residential' },
            { label: 'Compliance',   value: '45 / OBSERVED'          },
            { label: 'Status',       value: 'ACTIVE'                 },
            { label: 'Issue Cycle',  value: 'Cycle 3'                },
            { label: 'Expiry Cycle', value: 'Cycle 22'               },
          ],
        },
        {
          type: 'permit', title: 'SECTOR TRANSIT PERMIT', issuer: 'Nexus Authority Transit Division',
          fields: [
            { label: 'Permit No.',   value: 'STP-7102'         },
            { label: 'Citizen No.',  value: 'CIT-0334'         },
            { label: 'From',         value: 'Sector 7'         },
            { label: 'To',           value: 'Nexus District'   },
            { label: 'Valid From',   value: 'Cycle 12'         },
            { label: 'Valid Through',value: 'Cycle 16'         },
            { label: 'Purpose',      value: 'OFFICIAL'         },
          ],
        },
      ],
      outcome: {
        correct: { text: 'lena.arc is denied. She doesn\'t argue. The threshold changed this cycle. She already knew something had shifted.', compliance: 0, shadow: 0, pay: 40 },
        wrong:   { text: 'lena.arc enters the Nexus District. Your authorization deviation is flagged as an anomaly.', compliance: -1, shadow: 0, pay: 30 },
      },
    },

    // ── 7. null_runner_4 — DENY (Sector 3 closed, bulletin) ────────────────
    {
      id: 'null-runner-4', handle: 'null_runner_4',
      request: 'Sector transit — Sector 5 to Sector 3',
      plea: 'Nobody told me it was closed. My work crew is already there. Can I at least wait by the gate?',
      correct: 'deny', correctReason: 'sector_closed',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: 'null_runner_4'   },
            { label: 'Citizen No.',  value: 'CIT-2020'        },
            { label: 'Residence',    value: 'Sector 5'        },
            { label: 'Compliance',   value: '55 / OBSERVED'   },
            { label: 'Status',       value: 'ACTIVE'          },
            { label: 'Issue Cycle',  value: 'Cycle 10'        },
            { label: 'Expiry Cycle', value: 'Cycle 20'        },
          ],
        },
        {
          type: 'permit', title: 'SECTOR TRANSIT PERMIT', issuer: 'Nexus Authority Transit Division',
          fields: [
            { label: 'Permit No.',   value: 'STP-5301'                 },
            { label: 'Citizen No.',  value: 'CIT-2020'                 },
            { label: 'From',         value: 'Sector 5'                 },
            { label: 'To',           value: 'Sector 3'                 },
            { label: 'Valid From',   value: 'Cycle 14'                 },
            { label: 'Valid Through',value: 'Cycle 14'                 },
            { label: 'Purpose',      value: 'WORK'                     },
          ],
        },
      ],
      outcome: {
        correct: { text: 'null_runner_4 is denied. Documents valid — but Sector 3 is closed. They wait.', compliance: 0, shadow: 0, pay: 40 },
        wrong:   { text: 'null_runner_4 is directed to Sector 3. Checkpoint deviation flagged for overriding a sector closure.', compliance: -2, shadow: 0, pay: 20 },
      },
    },

    // ── 8. val.crane — APPROVE (Director of Compliance, self-signed) ────────
    // Subtle: their signature is on 08-ghost's and other employment docs above.
    {
      id: 'val-crane', handle: 'val.crane',
      request: 'Nexus District access — Director-level credentials',
      plea: '',   // silent — just slides documents through
      correct: 'approve',
      docs: [
        {
          type: 'id', title: 'GRIDOS CITIZEN IDENTITY RECORD', issuer: 'GridOS Identity Services',
          fields: [
            { label: 'Handle',       value: 'val.crane'          },
            { label: 'Citizen No.',  value: 'CIT-0001'           },
            { label: 'Residence',    value: 'Nexus District'     },
            { label: 'Compliance',   value: '82 / TRUSTED'       },
            { label: 'Status',       value: 'ACTIVE'             },
            { label: 'Issue Cycle',  value: 'Cycle 1'            },
            { label: 'Expiry Cycle', value: 'Cycle 30'           },
          ],
        },
        {
          type: 'permit', title: 'NEXUS DISTRICT ACCESS PERMIT', issuer: 'Nexus Authority — Director Office',
          fields: [
            { label: 'Permit No.',   value: 'NAP-0001'           },
            { label: 'Citizen No.',  value: 'CIT-0001'           },
            { label: 'Access Zone',  value: 'ALL SECTORS'        },
            { label: 'Valid From',   value: 'Cycle 1'            },
            { label: 'Valid Through',value: 'Cycle 30 (PERMANENT)' },
            { label: 'Purpose',      value: 'OFFICIAL'           },
          ],
        },
        {
          type: 'employment', title: 'EMPLOYMENT VERIFICATION', issuer: 'Nexus Authority',
          fields: [
            { label: 'Handle',       value: 'val.crane'          },
            { label: 'Employer',     value: 'Nexus Authority'    },
            { label: 'Role',         value: 'Director of Compliance — Tier 1' },
            { label: 'Start Cycle',  value: 'Cycle 1'            },
            { label: 'Clearance',    value: 'CLASSIFIED'         },
            { label: 'Signed By',    value: 'val.crane (Director, self-authorized)' },
          ],
        },
      ],
      outcome: {
        correct: { text: 'Director val.crane proceeds without a word. You notice their name on the documents you\'ve processed all shift.', compliance: 0, shadow: 0, pay: 40 },
        wrong:   { text: 'You\'ve denied the Director of Compliance. A formal review of your checkpoint is initiated immediately.', compliance: -5, shadow: 0, pay: 0 },
      },
    },

  ],
}
