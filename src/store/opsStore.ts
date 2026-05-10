// ── opsStore.ts ──────────────────────────────────────────────────────────
// Shared state between the OPS terminal session and the GridBrowser OPS panel.
// The terminal WRITES here; the browser panel READS here.

import { create } from 'zustand'

export type OpsPhase = 'idle' | 'scanning' | 'probing' | 'ready' | 'exec'

export interface ScanResult {
  target:      string
  resolvedIP:  string
  nodeOwner:   string
  firewallGrade: string
  openPorts:   string
  compliance:  string
  ghostTraffic: number   // percentage 0-100
  lastPing:    string
  behaviorFlags: string[]
}

export interface ProbeResult {
  module:  string
  output:  string[]
  ts:      number
}

export interface OpsState {
  phase:         OpsPhase
  target:        string | null
  scanResult:    ScanResult | null
  probeResults:  ProbeResult[]
  sessionLog:    string[]
  pendingTarget: string | null   // set by OPS panel; Terminal picks this up on open

  // actions
  startSession:    (target: string) => void
  setScan:         (result: ScanResult) => void
  addProbe:        (result: ProbeResult) => void
  log:             (line: string) => void
  setPhase:        (phase: OpsPhase) => void
  clearSession:    () => void
  setPendingTarget:(target: string | null) => void
}

export const useOpsStore = create<OpsState>((set) => ({
  phase:         'idle',
  target:        null,
  scanResult:    null,
  probeResults:  [],
  sessionLog:    [],
  pendingTarget: null,

  startSession: (target) => set({
    target,
    phase:        'scanning',
    scanResult:   null,
    probeResults: [],
    sessionLog:   [`[OPS] Session started → target: ${target}`],
  }),

  setScan: (result) => set((s) => ({
    scanResult:  result,
    phase:       'ready',
    sessionLog:  [...s.sessionLog, `[SCAN] ${result.target} resolved to ${result.resolvedIP}`],
  })),

  addProbe: (result) => set((s) => ({
    probeResults: [...s.probeResults, result],
    phase:        'ready',
    sessionLog:   [...s.sessionLog, `[PROBE] module:${result.module} ran at ${new Date(result.ts).toLocaleTimeString()}`],
  })),

  log: (line) => set((s) => ({ sessionLog: [...s.sessionLog, line] })),

  setPhase: (phase) => set({ phase }),

  clearSession: () => set({
    phase:        'idle',
    target:       null,
    scanResult:   null,
    probeResults: [],
    sessionLog:   [],
  }),

  setPendingTarget: (target) => set({ pendingTarget: target }),
}))

// ── OPS node database ─────────────────────────────────────────────────────
// Each entry maps a target string (domain/username/IP) to simulated scan data.
// Missions inject targets here or match against hackNodes.

export interface OpsNodeData {
  target:        string
  resolvedIP:    string
  nodeOwner:     string
  firewallGrade: string
  openPorts:     string
  compliance:    string
  ghostTraffic:  number
  lastPing:      string
  behaviorFlags: string[]
  probeModules:  Record<string, string[]>  // module name → output lines
}

export const OPS_NODES: OpsNodeData[] = [
  {
    target:        'gridos.corp',
    resolvedIP:    '64.236.180.163',
    nodeOwner:     'PROXY-RELAY',
    firewallGrade: 'D',
    openPorts:     '443 only',
    compliance:    'NON-COMPLIANT',
    ghostTraffic:  14,
    lastPing:      '308ms',
    behaviorFlags: ['Ghost traffic detected (14%)', 'Proxy relay in path'],
    probeModules: {
      whois: [
        'Registrant:    GridOS Corporation',
        'Registered:    2041-03-12',
        'Nameservers:   ns1.grid-dns.net, ns2.grid-dns.net',
        'Status:        LOCKED — regulatory hold',
        'Contact:       [REDACTED per UAC §44]',
      ],
      portmap: [
        'PORT    STATE   SERVICE',
        '443/tcp open    https',
        '80/tcp  closed  http  (redirect enforced)',
        '22/tcp  filtered ssh',
        '8080/tcp filtered  dev-proxy',
      ],
      headers: [
        'Server:            GridOS-Nginx/4.4.1',
        'X-Frame-Options:   DENY',
        'X-Powered-By:      GridOS/9.4',
        'X-Trace-ID:        <dynamic>',
        'Strict-Transport-Security: max-age=31536000',
        'X-Compliance-Token: <redacted>',
      ],
      dns: [
        'A      gridos.corp         → 64.236.180.163',
        'CNAME  www.gridos.corp     → gridos.corp',
        'MX     mail.gridos.corp    → 10 smtp.grid-relay.net',
        'TXT    gridos.corp         → v=spf1 include:grid-relay.net ~all',
        'NS                         → ns1.grid-dns.net',
      ],
    },
  },
  {
    target:        'ghostlily.blog',
    resolvedIP:    '10.44.77.212',
    nodeOwner:     'UNKNOWN — MIRROR',
    firewallGrade: 'F',
    openPorts:     '80, 443',
    compliance:    'NON-COMPLIANT',
    ghostTraffic:  71,
    lastPing:      '612ms',
    behaviorFlags: ['Ghost traffic (71%)', 'Tor exit node in relay chain', 'Identity masking active'],
    probeModules: {
      whois: [
        'Registrant:    [PRIVACY PROTECTED]',
        'Registered:    2053-11-01 via offshore registrar',
        'Nameservers:   private.dns.onion (non-resolvable)',
        'Status:        ACTIVE — unregistered domain',
        'Note:          GridOS routing tables list this as 404',
      ],
      dns: [
        'A      ghostlily.blog  → 10.44.77.212  (private range — mirror only)',
        'No MX records found',
        'No TXT/SPF records found',
        'WARNING: DNS chain inconsistency — possible split-horizon routing',
      ],
    },
  },
  {
    target:        'voidbay.net',
    resolvedIP:    '0.0.0.0',
    nodeOwner:     'UNKNOWN',
    firewallGrade: 'UNRATED',
    openPorts:     'HIDDEN',
    compliance:    'NON-COMPLIANT — BLACKLISTED',
    ghostTraffic:  98,
    lastPing:      'TIMEOUT',
    behaviorFlags: ['Onion routed', 'GridOS blacklist entry #4882', 'Zero cleartext traffic'],
    probeModules: {
      whois: [
        'ERROR: Domain not found in ICANN registry',
        'ERROR: Domain not found in Grid DNS registry',
        'Note: Address exists on non-Grid routing infrastructure',
        'Accessing this node may trigger a compliance flag.',
      ],
    },
  },
]

export function getOpsNode(target: string): OpsNodeData | undefined {
  return OPS_NODES.find(n =>
    n.target === target ||
    target.startsWith(n.target) ||
    n.resolvedIP === target
  )
}
