// OpsApp.tsx — OPS Backdoor Tool
// Overlay recon & execution suite. Attaches to active app context.

import { useState, useEffect } from 'react'
import { KNOWN_DOMAINS } from '@/lib/gridTargets'
import { NPC_ACCOUNTS } from '@/store/nodeStore'
import { useOpsStore, getOpsNode, OpsNodeData } from '@/store/opsStore'
import { useOSStore } from '@/store/osStore'

const KNOWN_HANDLES = new Set(NPC_ACCOUNTS.map(a => a.handle.toLowerCase()))

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/

function isValidOpsTarget(raw: string): boolean {
  const t = raw.toLowerCase().trim()
  if (!t) return false
  if (IP_RE.test(t)) return true
  const domain = t.split('/')[0]
  if (KNOWN_DOMAINS.has(domain)) return true
  if (KNOWN_HANDLES.has(t)) return true
  return false
}

// ─── Types ────────────────────────────────────────────────────────────────

type OpsPanel = 'scan' | 'probe'

interface ScanResult {
  label: string
  value: string
  status: 'clean' | 'warn' | 'critical' | 'unknown'
}

interface ProbeEntry {
  key: string
  value: string
}

// ─── Fake intel generators (fiction-layer) ────────────────────────────────

const FIREWALL_GRADES = ['A+', 'A', 'B', 'C', 'D', 'F', 'NONE', 'UNKNOWN']
const NODE_OWNERS = [
  'GRIDOS CORP', 'UNREGISTERED', 'PROXY-RELAY', 'CITIZEN NODE',
  'DARK RELAY', 'GHOST NODE', 'GOV SECTOR 4', 'PRIVATE CORP'
]
const PORT_SETS = [
  '80, 443, 8080', '22, 80, 443', '80, 443, 3306, 8443',
  '443 only', '21, 22, 80, 443, 8080, 9000', 'NONE VISIBLE'
]
const BEHAVIORS = [
  'Logging all inbound', 'Rate-limiting suspicious IPs', 'Honeypot active on port 9001',
  'Ghost traffic detected (14%)', 'No anomalies detected', 'Deep packet inspection enabled',
  'Compliance beacon transmitting', 'Behavior profiling: ACTIVE'
]

function seedRng(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  return () => { h ^= h << 13; h ^= h >> 7; h ^= h << 17; return (h >>> 0) / 0xFFFFFFFF }
}

function fakeIp(rng: () => number) {
  return `${Math.floor(rng() * 223) + 1}.${Math.floor(rng() * 254) + 1}.${Math.floor(rng() * 254) + 1}.${Math.floor(rng() * 254) + 1}`
}

function generateScan(target: string): ScanResult[] {
  const rng = seedRng(target || 'null')
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]
  const fw = pick(FIREWALL_GRADES)
  const fwStatus = ['A+', 'A'].includes(fw) ? 'clean' : ['B', 'C'].includes(fw) ? 'warn' : 'critical'

  return [
    { label: 'RESOLVED IP', value: fakeIp(rng), status: 'unknown' },
    { label: 'NODE OWNER', value: pick(NODE_OWNERS), status: rng() > 0.5 ? 'warn' : 'clean' },
    { label: 'FIREWALL GRADE', value: fw, status: fwStatus },
    { label: 'OPEN PORTS', value: pick(PORT_SETS), status: rng() > 0.6 ? 'warn' : 'clean' },
    { label: 'GRID COMPLIANCE', value: rng() > 0.5 ? 'COMPLIANT' : 'NON-COMPLIANT', status: rng() > 0.5 ? 'clean' : 'critical' },
    { label: 'BEHAVIOR FLAGS', value: pick(BEHAVIORS), status: rng() > 0.7 ? 'warn' : 'clean' },
    { label: 'GHOST TRAFFIC', value: `${Math.floor(rng() * 40)}%`, status: rng() > 0.6 ? 'critical' : 'clean' },
    { label: 'LAST PING', value: `${Math.floor(rng() * 800) + 12}ms`, status: 'unknown' },
  ]
}

function generateProbe(target: string): ProbeEntry[] {
  const rng = seedRng(target + '_probe')
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]
  return [
    { key: 'host', value: target || '(no target)' },
    { key: 'resolved_at', value: new Date(Date.now() - Math.floor(rng() * 3600000)).toISOString() },
    { key: 'cert_issuer', value: pick(['GridOS CA', 'CorpNet CA', 'SELF-SIGNED', 'EXPIRED', 'UnifiedTrust']) },
    { key: 'cert_expiry', value: rng() > 0.3 ? '2026-' + String(Math.floor(rng() * 12) + 1).padStart(2, '0') + '-15' : 'EXPIRED' },
    { key: 'redirect_chain', value: pick(['none', `${target} → relay.g.net → ${target}`, 'loop detected']) },
    { key: 'waf_vendor', value: pick(['GridShield v4', 'none', 'unknown', 'Cloudwall', 'DeepFilter']) },
    { key: 'headers_leak', value: pick(['none', 'Server: nginx/1.18', 'X-Powered-By: GridOS/3.2', 'X-Debug: true']) },
    { key: 'content_hash', value: '#' + Math.abs(seedRng(target)() * 0xffffff | 0).toString(16).padStart(6, '0').toUpperCase() },
  ]
}

// ─── Real node data → scan rows ───────────────────────────────────────────

function opsNodeToScanRows(n: OpsNodeData): ScanResult[] {
  const fw = n.firewallGrade
  const fwStatus: ScanResult['status'] = ['A+', 'A'].includes(fw) ? 'clean' : ['B', 'C'].includes(fw) ? 'warn' : 'critical'
  return [
    { label: 'RESOLVED IP',     value: n.resolvedIP,                                              status: 'unknown' },
    { label: 'NODE OWNER',      value: n.nodeOwner,                                               status: n.nodeOwner.includes('CORP') ? 'warn' : 'clean' },
    { label: 'FIREWALL GRADE',  value: fw,                                                         status: fwStatus },
    { label: 'OPEN PORTS',      value: n.openPorts,                                               status: n.openPorts === 'HIDDEN' ? 'critical' : 'clean' },
    { label: 'GRID COMPLIANCE', value: n.compliance,                                              status: n.compliance.includes('NON') ? 'critical' : 'clean' },
    { label: 'BEHAVIOR FLAGS',  value: n.behaviorFlags[0] ?? 'No anomalies detected',             status: n.behaviorFlags.length > 0 ? 'warn' : 'clean' },
    { label: 'GHOST TRAFFIC',   value: `${n.ghostTraffic}%`,                                      status: n.ghostTraffic > 50 ? 'critical' : n.ghostTraffic > 20 ? 'warn' : 'clean' },
    { label: 'LAST PING',       value: n.lastPing,                                                status: 'unknown' },
  ]
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ScanResult['status'] }) {
  const c = { clean: 'bg-green-500', warn: 'bg-yellow-500', critical: 'bg-red-500', unknown: 'bg-zinc-500' }[status]
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${c} shrink-0 mt-1.5`} />
}

function ScanRow({ row, reveal }: { row: ScanResult; reveal: boolean }) {
  return (
    <div className={`flex items-start gap-2.5 py-1.5 border-b border-green-950/40 last:border-0 transition-all duration-300 ${reveal ? 'opacity-100' : 'opacity-0 translate-y-1'}`}>
      <StatusDot status={row.status} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-green-700/60 uppercase tracking-widest leading-none mb-0.5">{row.label}</div>
        <div className={`text-xs font-mono leading-tight ${row.status === 'critical' ? 'text-red-400' : row.status === 'warn' ? 'text-yellow-400' : 'text-green-300'}`}>
          {row.value}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────

interface OpsAppProps {
  // Injected by the OS shell — the current active app's context string
  activeTarget?: string
}

export default function OpsApp({ activeTarget }: OpsAppProps) {
  const [panel, setPanel]             = useState<OpsPanel>('scan')
  const [target, setTarget]           = useState(activeTarget ?? '')
  const [inputTarget, setInputTarget] = useState(activeTarget ?? '')
  const [targetError, setTargetError] = useState('')

  const [scanResults, setScanResults]   = useState<ScanResult[]>([])
  const [scanDone, setScanDone]         = useState(false)
  const [scanning, setScanning]         = useState(false)
  const [revealedRows, setRevealedRows] = useState<boolean[]>([])

  const [probeResults, setProbeResults] = useState<ProbeEntry[]>([])
  const [probing, setProbing]           = useState(false)
  const [probeDone, setProbeDone]       = useState(false)

  const openApp = useOSStore(s => s.openApp)

  useEffect(() => {
    if (activeTarget && activeTarget !== target) {
      setTarget(activeTarget)
      setInputTarget(activeTarget)
      resetAll()
    }
  }, [activeTarget])

  function resetAll() {
    setScanResults([]); setScanDone(false); setScanning(false); setRevealedRows([])
    setProbeResults([]); setProbeDone(false); setProbing(false)
  }

  function applyTarget() {
    const t = inputTarget.trim()
    if (!isValidOpsTarget(t)) {
      setTargetError('Unknown target. Must be a Grid domain or @handle.')
      return
    }
    setTargetError('')
    setTarget(t)
    resetAll()
  }

  async function runScan() {
    if (!target || scanning) return
    setScanning(true); setScanDone(false); setScanResults([]); setRevealedRows([])

    const nodeData = getOpsNode(target)
    const results  = nodeData ? opsNodeToScanRows(nodeData) : generateScan(target)

    if (nodeData) {
      useOpsStore.getState().setScan({
        target:        nodeData.target,
        resolvedIP:    nodeData.resolvedIP,
        nodeOwner:     nodeData.nodeOwner,
        firewallGrade: nodeData.firewallGrade,
        openPorts:     nodeData.openPorts,
        compliance:    nodeData.compliance,
        ghostTraffic:  nodeData.ghostTraffic,
        lastPing:      nodeData.lastPing,
        behaviorFlags: nodeData.behaviorFlags,
      })
    }

    setScanResults(results)
    for (let i = 0; i < results.length; i++) {
      await new Promise(r => setTimeout(r, 220 + Math.random() * 180))
      setRevealedRows(prev => { const n = [...prev]; n[i] = true; return n })
    }
    setScanDone(true); setScanning(false)
  }

  async function runProbe() {
    if (!target || probing) return
    setProbing(true); setProbeDone(false); setProbeResults([])
    await new Promise(r => setTimeout(r, 1400))
    setProbeResults(generateProbe(target))
    setProbeDone(true); setProbing(false)
  }

  function sendToTerminal() {
    useOpsStore.getState().setPendingTarget(target)
    openApp('terminal')
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 font-mono text-xs select-none overflow-hidden">

      {/* ── Header ── */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-400 tracking-widest uppercase">OPS</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Surveillance Suite</span>
        <div className="ml-auto text-xs text-zinc-700">v0.9.1-unregistered</div>
      </div>

      {/* ── Target bar ── */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 shrink-0">
        <div className="px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-zinc-600 uppercase tracking-widest shrink-0">TARGET</span>
          <input
            value={inputTarget}
            onChange={e => { setInputTarget(e.target.value); setTargetError('') }}
            onKeyDown={e => e.key === 'Enter' && applyTarget()}
            placeholder="gridos.corp or @handle"
            className={`flex-1 bg-zinc-800 rounded px-2 py-1 text-xs text-green-300 placeholder-zinc-600 focus:outline-none min-w-0 border ${targetError ? 'border-red-700 focus:border-red-600' : 'border-zinc-700 focus:border-green-700'}`}
          />
          <button onClick={applyTarget} className="text-xs px-2 py-1 border border-zinc-700 rounded text-zinc-400 hover:border-green-700 hover:text-green-400 transition-colors">
            LOCK
          </button>
          {target && !targetError && (
            <span className="text-xs text-green-700 truncate max-w-24 shrink-0" title={target}>
              ● {target.length > 18 ? target.slice(0, 16) + '…' : target}
            </span>
          )}
        </div>
        {targetError && (
          <div className="px-3 pb-2 text-xs text-red-500 font-mono">{targetError}</div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {(['scan', 'probe'] as OpsPanel[]).map(p => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            className={`flex-1 py-1.5 text-xs uppercase tracking-widest font-bold transition-colors border-b-2 ${
              panel === p
                ? p === 'scan'
                  ? 'border-green-500 text-green-400 bg-green-950/10'
                  : 'border-yellow-500 text-yellow-400 bg-yellow-950/10'
                : 'border-transparent text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Panel body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* SCAN */}
        {panel === 'scan' && (
          <div className="p-3 space-y-3">
            {!target && (
              <div className="text-xs text-zinc-600 py-4 text-center">Lock a target above to begin scan.</div>
            )}
            {target && !scanDone && !scanning && (
              <button onClick={runScan} className="w-full py-2 border border-green-900/50 rounded text-xs text-green-500 hover:border-green-600 hover:bg-green-950/20 transition-colors font-bold tracking-wider uppercase">
                ▶ INITIATE SCAN
              </button>
            )}
            {scanning && (
              <div className="flex items-center gap-2 text-xs text-green-700 py-1">
                <span className="animate-pulse">◉</span>
                <span className="animate-pulse">Scanning {target}…</span>
              </div>
            )}
            {scanResults.length > 0 && (
              <div className="border border-green-950/40 rounded bg-green-950/5 px-3 py-1 divide-y divide-green-950/20">
                {scanResults.map((row, i) => (
                  <ScanRow key={i} row={row} reveal={!!revealedRows[i]} />
                ))}
              </div>
            )}
            {scanDone && (
              <div className="space-y-2">
                <button onClick={runScan} className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-green-600 hover:border-green-900 transition-colors">
                  ↺ RE-SCAN
                </button>
                <button
                  onClick={sendToTerminal}
                  className="w-full py-2 border border-green-700/60 rounded text-xs text-green-400 hover:bg-green-950/30 hover:border-green-500 transition-colors font-bold tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <span>▶</span> SEND TO TERMINAL
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROBE */}
        {panel === 'probe' && (
          <div className="p-3 space-y-3">
            {!target && (
              <div className="text-xs text-zinc-600 py-4 text-center">Lock a target above to probe.</div>
            )}
            {target && !probeDone && !probing && (
              <button onClick={runProbe} className="w-full py-2 border border-yellow-900/50 rounded text-xs text-yellow-500 hover:border-yellow-600 hover:bg-yellow-950/20 transition-colors font-bold tracking-wider uppercase">
                ▶ DEEP PROBE
              </button>
            )}
            {probing && (
              <div className="text-xs text-yellow-700 animate-pulse py-2 text-center">
                ◉ Probing {target}… fingerprinting in progress
              </div>
            )}
            {probeDone && probeResults.length > 0 && (
              <>
                <div className="border border-yellow-900/30 rounded bg-yellow-950/5">
                  <div className="px-3 py-1.5 border-b border-yellow-900/20 text-xs text-yellow-700/50 uppercase tracking-widest">
                    Node Intelligence Report
                  </div>
                  <div className="divide-y divide-yellow-900/10">
                    {probeResults.map((entry, i) => (
                      <div key={i} className="flex gap-3 px-3 py-2">
                        <span className="text-yellow-900/60 shrink-0 w-28 uppercase tracking-wide">{entry.key}</span>
                        <span className={`text-xs flex-1 break-all ${entry.value.includes('EXPIRED') || entry.value.includes('true') ? 'text-red-400' : 'text-yellow-300'}`}>
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={runProbe} className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-yellow-600 hover:border-yellow-900 transition-colors">
                  ↺ RE-PROBE
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
        <span className="text-xs text-zinc-700">OPS // surveillance only // exec via Terminal</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-xs text-red-900">DARK</span>
        </div>
      </div>
    </div>
  )
}