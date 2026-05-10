// OpsApp.tsx — OPS Backdoor Tool
// Overlay recon & execution suite. Attaches to active app context.

import { useState, useEffect, useRef } from 'react'
import { KNOWN_DOMAINS } from '@/lib/gridTargets'
import { NPC_ACCOUNTS } from '@/store/nodeStore'

const KNOWN_HANDLES = new Set(NPC_ACCOUNTS.map(a => a.handle.toLowerCase()))

function isValidOpsTarget(raw: string): boolean {
  const t = raw.toLowerCase().trim()
  if (!t) return false
  const domain = t.split('/')[0]
  if (KNOWN_DOMAINS.has(domain)) return true
  if (KNOWN_HANDLES.has(t)) return true
  return false
}

// ─── Types ────────────────────────────────────────────────────────────────

type OpsPanel = 'scan' | 'probe' | 'exec'

interface ScanResult {
  label: string
  value: string
  status: 'clean' | 'warn' | 'critical' | 'unknown'
}

interface ProbeEntry {
  key: string
  value: string
}

interface ExecLog {
  timestamp: string
  cmd: string
  args: string
  output: string
  ok: boolean
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

// ─── EXEC command definitions ──────────────────────────────────────────────

interface ExecCommand {
  id: string
  label: string
  desc: string
  risk: 'low' | 'medium' | 'high' | 'critical'
  args?: string   // placeholder hint
}

const EXEC_COMMANDS: ExecCommand[] = [
  { id: 'trace',   label: 'TRACE',   risk: 'low',      desc: 'Map full routing path to target node.' },
  { id: 'ghost',   label: 'GHOST',   risk: 'low',      desc: 'Anonymize your node address before next request.' },
  { id: 'spoof',   label: 'SPOOF',   risk: 'medium',   desc: 'Substitute a forged identity header on outbound traffic.', args: 'identity' },
  { id: 'bypass',  label: 'BYPASS',  risk: 'high',     desc: 'Attempt to route around target firewall via proxy chain.' },
  { id: 'exfil',   label: 'EXFIL',   risk: 'high',     desc: 'Extract cached node data from target before next refresh.', args: 'data_key' },
  { id: 'flood',   label: 'FLOOD',   risk: 'high',     desc: 'Saturate target relay with synthetic requests. Noisy.' },
  { id: 'inject',  label: 'INJECT',  risk: 'critical',  desc: 'Push a payload into unprotected node input field.', args: 'payload' },
  { id: 'wipe',    label: 'WIPE',    risk: 'critical',  desc: 'Erase OPS trace logs from current session. Irreversible.' },
]

function riskColor(risk: ExecCommand['risk']) {
  return {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-500',
  }[risk]
}

function riskBorder(risk: ExecCommand['risk']) {
  return {
    low: 'border-green-900/40',
    medium: 'border-yellow-900/40',
    high: 'border-orange-900/40',
    critical: 'border-red-900/60',
  }[risk]
}

function fakeExecOutput(cmd: ExecCommand, args: string, target: string): { output: string; ok: boolean } {
  const rng = seedRng(cmd.id + target + args)
  const roll = rng()
  const outcomes: Record<string, string[]> = {
    trace: [
      `TRACE OK: ${target}\n  → relay.g.net (12ms)\n  → node-441c (38ms)\n  → ${target} (71ms)\nHops: 3  Total: 121ms`,
      `TRACE PARTIAL: relay timeout at hop 2. Path incomplete.`,
    ],
    ghost: [
      `GHOST ACTIVE: Node address masked.\n  Alias: 192.168.${Math.floor(rng()*200)+10}.${Math.floor(rng()*200)+10}\n  TTL: 300s`,
      `GHOST FAILED: GridOS compliance beacon still transmitting. Cover blown.`,
    ],
    spoof: [
      `SPOOF OK: Identity header injected → "${args || 'citizen_0000'}"\n  Active for next 5 requests.`,
      `SPOOF REJECTED: Target validates headers server-side. No effect.`,
    ],
    bypass: [
      `BYPASS CHAIN: ${target}\n  Pivot 1: relay.dark.net ✓\n  Pivot 2: exit-node-9 ✓\n  FIREWALL: BYPASSED`,
      `BYPASS FAILED: Target firewall grade too high. No viable proxy found.`,
    ],
    exfil: [
      `EXFIL: 3 cache entries extracted for key "${args || '*'}"\n  /nav/links [12 items]\n  /meta/owner [1 item]\n  /log/behavior [47 items]\n  Saved to /ops/dump/${Date.now()}.log`,
      `EXFIL FAILED: Node cache encrypted. Key "${args || '*'}" not accessible.`,
    ],
    flood: [
      `FLOOD RUNNING: ${target}\n  Packets sent: 14,400\n  Target response rate: 3%\n  Status: DEGRADED`,
      `FLOOD BLOCKED: Target rate-limiting detected after 200 requests. Aborted.`,
    ],
    inject: [
      `INJECT: Payload delivered to open input.\n  Response: 500 Internal Error (likely hit)\n  Payload: "${args || '<script>ops()</script>'}"\n  Flag logged.`,
      `INJECT BLOCKED: WAF intercepted payload. No effect.`,
    ],
    wipe: [
      `WIPE COMPLETE: Session trace logs cleared.\n  Entries removed: ${Math.floor(rng() * 80) + 5}\n  Grid audit trail: UNAFFECTED (off-device)`,
      `WIPE PARTIAL: 2 of 3 log stores cleared. Remote backup may persist.`,
    ],
  }
  const pool = outcomes[cmd.id] ?? [`${cmd.id.toUpperCase()} OK.`]
  const ok = roll > 0.35
  return { output: ok ? pool[0] : pool[1], ok }
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
  const [panel, setPanel] = useState<OpsPanel>('scan')
  const [target, setTarget]           = useState(activeTarget ?? '')
  const [inputTarget, setInputTarget] = useState(activeTarget ?? '')
  const [targetError, setTargetError] = useState('')

  // SCAN state
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [scanDone, setScanDone] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [revealedRows, setRevealedRows] = useState<boolean[]>([])

  // PROBE state
  const [probeResults, setProbeResults] = useState<ProbeEntry[]>([])
  const [probing, setProbing] = useState(false)
  const [probeDone, setProbeDone] = useState(false)

  // EXEC state
  const [selectedCmd, setSelectedCmd] = useState<ExecCommand | null>(null)
  const [execArgs, setExecArgs] = useState('')
  const [execLog, setExecLog] = useState<ExecLog[]>([])
  const [confirming, setConfirming] = useState(false)
  const [running, setRunning] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll exec log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [execLog])

  // Sync if OS pushes a new active target
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
    setSelectedCmd(null); setConfirming(false); setRunning(false)
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

  // ── SCAN ─────────────────────────────────────────────────────────────────

  async function runScan() {
    if (!target || scanning) return
    setScanning(true); setScanDone(false); setScanResults([]); setRevealedRows([])
    const results = generateScan(target)
    setScanResults(results)
    // Reveal rows one by one with staggered delay
    for (let i = 0; i < results.length; i++) {
      await new Promise(r => setTimeout(r, 220 + Math.random() * 180))
      setRevealedRows(prev => { const n = [...prev]; n[i] = true; return n })
    }
    setScanDone(true); setScanning(false)
  }

  // ── PROBE ────────────────────────────────────────────────────────────────

  async function runProbe() {
    if (!target || probing) return
    setProbing(true); setProbeDone(false); setProbeResults([])
    await new Promise(r => setTimeout(r, 1400))
    setProbeResults(generateProbe(target))
    setProbeDone(true); setProbing(false)
  }

  // ── EXEC ──────────────────────────────────────────────────────────────────

  async function runExec() {
    if (!selectedCmd || running) return
    setRunning(true); setConfirming(false)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
    const { output, ok } = fakeExecOutput(selectedCmd, execArgs, target)
    const entry: ExecLog = {
      timestamp: new Date().toLocaleTimeString(),
      cmd: selectedCmd.id,
      args: execArgs,
      output,
      ok,
    }
    setExecLog(prev => [...prev, entry])
    setRunning(false); setSelectedCmd(null); setExecArgs('')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 font-mono text-xs select-none overflow-hidden">

      {/* ── Header ── */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-400 tracking-widest uppercase">OPS</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Operational Penetration Suite</span>
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
          <button
            onClick={applyTarget}
            className="text-xs px-2 py-1 border border-zinc-700 rounded text-zinc-400 hover:border-green-700 hover:text-green-400 transition-colors"
          >
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

      {/* ── Panel tabs ── */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {(['scan', 'probe', 'exec'] as OpsPanel[]).map(p => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            className={`flex-1 py-1.5 text-xs uppercase tracking-widest font-bold transition-colors border-b-2 ${
              panel === p
                ? p === 'scan' ? 'border-green-500 text-green-400 bg-green-950/10'
                  : p === 'probe' ? 'border-yellow-500 text-yellow-400 bg-yellow-950/10'
                  : 'border-red-500 text-red-400 bg-red-950/10'
                : 'border-transparent text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Panel body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══ SCAN PANEL ═══ */}
        {panel === 'scan' && (
          <div className="p-3 space-y-3">
            {!target && (
              <div className="text-xs text-zinc-600 py-4 text-center">Lock a target above to begin scan.</div>
            )}

            {target && !scanDone && !scanning && (
              <button
                onClick={runScan}
                className="w-full py-2 border border-green-900/50 rounded text-xs text-green-500 hover:border-green-600 hover:bg-green-950/20 transition-colors font-bold tracking-wider uppercase"
              >
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
              <button
                onClick={runScan}
                className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-green-600 hover:border-green-900 transition-colors"
              >
                ↺ RE-SCAN
              </button>
            )}
          </div>
        )}

        {/* ═══ PROBE PANEL ═══ */}
        {panel === 'probe' && (
          <div className="p-3 space-y-3">
            {!target && (
              <div className="text-xs text-zinc-600 py-4 text-center">Lock a target above to probe.</div>
            )}

            {target && !probeDone && !probing && (
              <button
                onClick={runProbe}
                className="w-full py-2 border border-yellow-900/50 rounded text-xs text-yellow-500 hover:border-yellow-600 hover:bg-yellow-950/20 transition-colors font-bold tracking-wider uppercase"
              >
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
                <button
                  onClick={runProbe}
                  className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-yellow-600 hover:border-yellow-900 transition-colors"
                >
                  ↺ RE-PROBE
                </button>
              </>
            )}
          </div>
        )}

        {/* ═══ EXEC PANEL ═══ */}
        {panel === 'exec' && (
          <div className="p-3 space-y-3">
            {/* Command list */}
            {!selectedCmd && !confirming && (
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-700 uppercase tracking-widest mb-2">Select Operation</div>
                {EXEC_COMMANDS.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => { setSelectedCmd(cmd); setExecArgs(''); setConfirming(false) }}
                    className={`w-full text-left flex items-start gap-3 px-3 py-2 border rounded transition-colors ${riskBorder(cmd.risk)} bg-zinc-900/50 hover:bg-zinc-800/50`}
                  >
                    <span className={`text-xs font-black w-14 shrink-0 ${riskColor(cmd.risk)}`}>{cmd.label}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-400 leading-relaxed">{cmd.desc}</div>
                      {cmd.args && <div className="text-xs text-zinc-700 mt-0.5">arg: {cmd.args}</div>}
                    </div>
                    <span className={`text-xs ${riskColor(cmd.risk)} uppercase shrink-0`}>{cmd.risk}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Confirm screen */}
            {selectedCmd && !running && (
              <div className={`border rounded px-3 py-3 space-y-3 ${riskBorder(selectedCmd.risk)} bg-zinc-900/60`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${riskColor(selectedCmd.risk)}`}>{selectedCmd.label}</span>
                  <span className={`text-xs uppercase ${riskColor(selectedCmd.risk)}`}>[{selectedCmd.risk}]</span>
                </div>
                <p className="text-xs text-zinc-400">{selectedCmd.desc}</p>
                {selectedCmd.args && (
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-600 uppercase tracking-wide">{selectedCmd.args}</div>
                    <input
                      value={execArgs}
                      onChange={e => setExecArgs(e.target.value)}
                      placeholder={`Enter ${selectedCmd.args}…`}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-red-300 placeholder-zinc-600 focus:outline-none focus:border-red-800"
                    />
                  </div>
                )}
                <div className="text-xs text-zinc-600">
                  Target: <span className="text-zinc-400">{target || '(none)'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={runExec}
                    className={`flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                      selectedCmd.risk === 'critical'
                        ? 'border border-red-800 text-red-400 hover:bg-red-950/30'
                        : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    ▶ EXECUTE
                  </button>
                  <button
                    onClick={() => { setSelectedCmd(null); setExecArgs('') }}
                    className="px-3 py-1.5 rounded border border-zinc-800 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {running && (
              <div className="text-xs text-red-600 animate-pulse py-2 text-center">
                ◉ Executing {selectedCmd?.label}…
              </div>
            )}

            {/* Exec log */}
            {execLog.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-700 uppercase tracking-widest">Session Log</div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded divide-y divide-zinc-800/50 max-h-64 overflow-y-auto">
                  {execLog.map((entry, i) => (
                    <div key={i} className="px-3 py-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${entry.ok ? 'text-green-500' : 'text-red-500'}`}>
                          {entry.ok ? '✓' : '✗'}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${entry.ok ? 'text-green-400' : 'text-red-400'}`}>{entry.cmd}</span>
                        {entry.args && <span className="text-xs text-zinc-600">{entry.args}</span>}
                        <span className="ml-auto text-xs text-zinc-700">{entry.timestamp}</span>
                      </div>
                      <pre className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed pl-4">{entry.output}</pre>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
                <button
                  onClick={() => { setSelectedCmd(null); setExecArgs('') }}
                  className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-red-600 hover:border-red-900 transition-colors"
                >
                  + NEW OPERATION
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
        <span className="text-xs text-zinc-700">OPS // unregistered node // activity unlogged</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-xs text-red-900">DARK</span>
        </div>
      </div>
    </div>
  )
}