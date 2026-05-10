// OpsApp.tsx — OPS Backdoor Tool
// Overlay recon & execution suite. Attaches to active app context.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useOpsScanStore, type ScanRecord } from '@/store/opsScanStore'

// ─── Types ────────────────────────────────────────────────────────────────

type OpsPanel = 'scan' | 'probe' | 'exec' | 'history'

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

// ─── Fake probe/exec generators (unchanged — fiction layer) ───────────────

function seedRng(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  return () => { h ^= h << 13; h ^= h >> 7; h ^= h << 17; return (h >>> 0) / 0xFFFFFFFF }
}

function fakeIp(rng: () => number) {
  return `${Math.floor(rng() * 223) + 1}.${Math.floor(rng() * 254) + 1}.${Math.floor(rng() * 254) + 1}.${Math.floor(rng() * 254) + 1}`
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
  args?: string
}

const EXEC_COMMANDS: ExecCommand[] = [
  { id: 'trace',   label: 'TRACE',   risk: 'low',      desc: 'Map full routing path to target node.' },
  { id: 'ghost',   label: 'GHOST',   risk: 'low',      desc: 'Anonymize your node address before next request.' },
  { id: 'spoof',   label: 'SPOOF',   risk: 'medium',   desc: 'Substitute a forged identity header on outbound traffic.', args: 'identity' },
  { id: 'bypass',  label: 'BYPASS',  risk: 'high',     desc: 'Attempt to route around target firewall via proxy chain.' },
  { id: 'exfil',   label: 'EXFIL',   risk: 'high',     desc: 'Extract cached node data from target before next refresh.', args: 'data_key' },
  { id: 'flood',   label: 'FLOOD',   risk: 'high',     desc: 'Saturate target relay with synthetic requests. Noisy.' },
  { id: 'inject',  label: 'INJECT',  risk: 'critical', desc: 'Push a payload into unprotected node input field.', args: 'payload' },
  { id: 'wipe',    label: 'WIPE',    risk: 'critical', desc: 'Erase OPS trace logs from current session. Irreversible.' },
]

function riskColor(risk: ExecCommand['risk']) {
  return { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400', critical: 'text-red-500' }[risk]
}
function riskBorder(risk: ExecCommand['risk']) {
  return { low: 'border-green-900/40', medium: 'border-yellow-900/40', high: 'border-orange-900/40', critical: 'border-red-900/60' }[risk]
}

function fakeExecOutput(cmd: ExecCommand, args: string, target: string): { output: string; ok: boolean } {
  const rng = seedRng(cmd.id + target + args)
  const roll = rng()
  const outcomes: Record<string, string[]> = {
    trace:  [`TRACE OK: ${target}\n  → relay.g.net (12ms)\n  → node-441c (38ms)\n  → ${target} (71ms)\nHops: 3  Total: 121ms`, `TRACE PARTIAL: relay timeout at hop 2. Path incomplete.`],
    ghost:  [`GHOST ACTIVE: Node address masked.\n  Alias: 192.168.${Math.floor(rng()*200)+10}.${Math.floor(rng()*200)+10}\n  TTL: 300s`, `GHOST FAILED: GridOS compliance beacon still transmitting. Cover blown.`],
    spoof:  [`SPOOF OK: Identity header injected → "${args || 'citizen_0000'}"\n  Active for next 5 requests.`, `SPOOF REJECTED: Target validates headers server-side. No effect.`],
    bypass: [`BYPASS CHAIN: ${target}\n  Pivot 1: relay.dark.net ✓\n  Pivot 2: exit-node-9 ✓\n  FIREWALL: BYPASSED`, `BYPASS FAILED: Target firewall grade too high. No viable proxy found.`],
    exfil:  [`EXFIL: 3 cache entries extracted for key "${args || '*'}"\n  /nav/links [12 items]\n  /meta/owner [1 item]\n  /log/behavior [47 items]\n  Saved to /ops/dump/${Date.now()}.log`, `EXFIL FAILED: Node cache encrypted. Key "${args || '*'}" not accessible.`],
    flood:  [`FLOOD RUNNING: ${target}\n  Packets sent: 14,400\n  Target response rate: 3%\n  Status: DEGRADED`, `FLOOD BLOCKED: Target rate-limiting detected after 200 requests. Aborted.`],
    inject: [`INJECT: Payload delivered to open input.\n  Response: 500 Internal Error (likely hit)\n  Payload: "${args || '<script>ops()</script>'}"\n  Flag logged.`, `INJECT BLOCKED: WAF intercepted payload. No effect.`],
    wipe:   [`WIPE COMPLETE: Session trace logs cleared.\n  Entries removed: ${Math.floor(rng() * 80) + 5}\n  Grid audit trail: UNAFFECTED (off-device)`, `WIPE PARTIAL: 2 of 3 log stores cleared. Remote backup may persist.`],
  }
  const pool = outcomes[cmd.id] ?? [`${cmd.id.toUpperCase()} OK.`]
  return { output: roll > 0.35 ? pool[0] : pool[1], ok: roll > 0.35 }
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

function kindBadge(kind: ScanRecord['kind']) {
  if (kind === 'site')      return <span className="text-xs px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 font-mono">SITE</span>
  if (kind === 'player')    return <span className="text-xs px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 font-mono">PLAYER</span>
  return                           <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono">404</span>
}

// ─── Real Supabase scan ────────────────────────────────────────────────────

async function runSupabaseScan(target: string): Promise<{ results: ScanResult[]; record: ScanRecord }> {
  const rng = seedRng(target)
  const fakeIpVal = fakeIp(rng)

  // Try sites table first
  const { data: siteData } = await supabase
    .from('sites')
    .select('*')
    .ilike('slug', target)
    .single()

  if (siteData) {
    const results: ScanResult[] = [
      { label: 'MATCH TYPE',    value: 'SITE RECORD',                              status: 'clean' },
      { label: 'SLUG',          value: siteData.slug ?? target,                    status: 'unknown' },
      { label: 'TITLE',         value: siteData.title ?? '—',                      status: 'unknown' },
      { label: 'THEME',         value: (siteData.theme ?? 'unknown').toUpperCase(), status: 'unknown' },
      { label: 'GATE TYPE',     value: siteData.gate_type ? siteData.gate_type.toUpperCase() : 'NONE', status: siteData.gate_type ? 'warn' : 'clean' },
      { label: 'GATE MIN',      value: siteData.gate_min != null ? String(siteData.gate_min) : '—',    status: siteData.gate_min ? 'warn' : 'clean' },
      { label: 'REP COMPLIANCE',value: siteData.rep_compliance != null ? String(siteData.rep_compliance) : '0', status: (siteData.rep_compliance ?? 0) > 0 ? 'warn' : 'clean' },
      { label: 'REP SHADOW',    value: siteData.rep_shadow != null ? String(siteData.rep_shadow) : '0',        status: (siteData.rep_shadow ?? 0) > 0 ? 'warn' : 'clean' },
      { label: 'RESOLVED IP',   value: fakeIpVal,                                  status: 'unknown' },
    ]
    const record: ScanRecord = {
      target,
      scannedAt: new Date().toISOString(),
      kind: 'site',
      data: { slug: siteData.slug, title: siteData.title, theme: siteData.theme },
    }
    return { results, record }
  }

  // Try players table
  const { data: playerData } = await supabase
    .from('players')
    .select('*')
    .ilike('username', target)
    .single()

  if (playerData) {
    const results: ScanResult[] = [
      { label: 'MATCH TYPE',  value: 'PLAYER RECORD',                                         status: 'clean' },
      { label: 'USERNAME',    value: playerData.username ?? target,                            status: 'unknown' },
      { label: 'COMPLIANCE',  value: String(playerData.compliance ?? '?'),                    status: (playerData.compliance ?? 50) >= 60 ? 'clean' : 'critical' },
      { label: 'SHADOW',      value: String(playerData.shadow ?? '?'),                        status: (playerData.shadow ?? 50) >= 60 ? 'warn' : 'clean' },
      { label: 'CREDITS',     value: playerData.credits != null ? `₳ ${playerData.credits}` : '—', status: 'unknown' },
      { label: 'RESOLVED IP', value: fakeIpVal,                                               status: 'unknown' },
    ]
    const record: ScanRecord = {
      target,
      scannedAt: new Date().toISOString(),
      kind: 'player',
      data: { username: playerData.username, compliance: String(playerData.compliance), shadow: String(playerData.shadow) },
    }
    return { results, record }
  }

  // Not found
  const results: ScanResult[] = [
    { label: 'MATCH TYPE', value: 'NOT FOUND', status: 'critical' },
    { label: 'TARGET',     value: target,       status: 'unknown' },
    { label: 'SITES DB',   value: 'NO MATCH',   status: 'critical' },
    { label: 'PLAYERS DB', value: 'NO MATCH',   status: 'critical' },
    { label: 'RESOLVED IP',value: fakeIpVal,    status: 'unknown' },
  ]
  const record: ScanRecord = {
    target,
    scannedAt: new Date().toISOString(),
    kind: 'not_found',
    data: {},
  }
  return { results, record }
}

// ─── Main App ──────────────────────────────────────────────────────────────

interface OpsAppProps {
  activeTarget?: string
  compact?: boolean
}

export default function OpsApp({ activeTarget, compact = false }: OpsAppProps) {
  const [panel, setPanel] = useState<OpsPanel>('scan')
  const [target, setTarget] = useState(activeTarget ?? '')
  const [inputTarget, setInputTarget] = useState(activeTarget ?? '')

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
  const [running, setRunning] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  // History store
  const { history, addRecord, clearHistory } = useOpsScanStore()

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [execLog])

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
    setSelectedCmd(null); setRunning(false)
  }

  function applyTarget() {
    const t = inputTarget.trim()
    setTarget(t)
    resetAll()
  }

  // ── SCAN (real Supabase) ──────────────────────────────────────────────────

  async function runScan() {
    if (!target || scanning) return
    setScanning(true); setScanDone(false); setScanResults([]); setRevealedRows([])

    const { results, record } = await runSupabaseScan(target)
    addRecord(record)
    setScanResults(results)

    for (let i = 0; i < results.length; i++) {
      await new Promise(r => setTimeout(r, 180 + Math.random() * 160))
      setRevealedRows(prev => { const n = [...prev]; n[i] = true; return n })
    }
    setScanDone(true); setScanning(false)
  }

  // ── PROBE ─────────────────────────────────────────────────────────────────

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
    setRunning(true)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))
    const { output, ok } = fakeExecOutput(selectedCmd, execArgs, target)
    setExecLog(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), cmd: selectedCmd!.id, args: execArgs, output, ok }])
    setRunning(false); setSelectedCmd(null); setExecArgs('')
  }

  // ─── Compact mode (slide-in panel from GridBrowser) ──────────────────────

  if (compact) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 font-mono text-xs select-none overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-400 tracking-widest uppercase">OPS</span>
          <span className="text-zinc-700 text-xs">|</span>
          <span className="text-xs text-zinc-500 truncate">{target || 'no target'}</span>
        </div>

        <div className="px-2 py-2 border-b border-zinc-800 flex gap-1 shrink-0">
          <input
            value={inputTarget}
            onChange={e => setInputTarget(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyTarget()}
            placeholder="target…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-green-300 placeholder-zinc-600 focus:outline-none focus:border-green-700 min-w-0"
          />
          <button onClick={applyTarget} className="text-xs px-2 py-1 border border-zinc-700 rounded text-zinc-400 hover:border-green-700 hover:text-green-400 transition-colors">
            SET
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {!target && <div className="text-xs text-zinc-600 py-4 text-center">Set a target to scan.</div>}

          {target && !scanDone && !scanning && (
            <button onClick={runScan} className="w-full py-2 border border-green-900/50 rounded text-xs text-green-500 hover:border-green-600 hover:bg-green-950/20 transition-colors font-bold tracking-wider uppercase">
              ▶ SCAN
            </button>
          )}

          {scanning && <div className="flex items-center gap-2 text-xs text-green-700 py-1"><span className="animate-pulse">◉</span><span className="animate-pulse">Scanning…</span></div>}

          {scanResults.length > 0 && (
            <div className="border border-green-950/40 rounded bg-green-950/5 px-2 py-1 divide-y divide-green-950/20">
              {scanResults.map((row, i) => <ScanRow key={i} row={row} reveal={!!revealedRows[i]} />)}
            </div>
          )}

          {scanDone && (
            <button onClick={runScan} className="w-full py-1 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-green-600 hover:border-green-900 transition-colors">
              ↺ RE-SCAN
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Full window mode ──────────────────────────────────────────────────────

  const allPanels: OpsPanel[] = ['scan', 'probe', 'exec', 'history']

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 font-mono text-xs select-none overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-400 tracking-widest uppercase">OPS</span>
        </div>
        <span className="text-zinc-700">|</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Operational Penetration Suite</span>
        <div className="ml-auto text-xs text-zinc-700">v0.9.1-unregistered</div>
      </div>

      {/* Target bar */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/60 flex items-center gap-2 shrink-0">
        <span className="text-xs text-zinc-600 uppercase tracking-widest shrink-0">TARGET</span>
        <input
          value={inputTarget}
          onChange={e => setInputTarget(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyTarget()}
          placeholder="gridos.corp / user_handle / IP"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-green-300 placeholder-zinc-600 focus:outline-none focus:border-green-700 min-w-0"
        />
        <button onClick={applyTarget} className="text-xs px-2 py-1 border border-zinc-700 rounded text-zinc-400 hover:border-green-700 hover:text-green-400 transition-colors">
          LOCK
        </button>
        {target && (
          <span className="text-xs text-green-700 truncate max-w-24 shrink-0" title={target}>
            ● {target.length > 18 ? target.slice(0, 16) + '…' : target}
          </span>
        )}
      </div>

      {/* Panel tabs */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {allPanels.map(p => (
          <button
            key={p}
            onClick={() => setPanel(p)}
            className={`flex-1 py-1.5 text-xs uppercase tracking-widest font-bold transition-colors border-b-2 ${
              panel === p
                ? p === 'scan'    ? 'border-green-500 text-green-400 bg-green-950/10'
                : p === 'probe'   ? 'border-yellow-500 text-yellow-400 bg-yellow-950/10'
                : p === 'exec'    ? 'border-red-500 text-red-400 bg-red-950/10'
                :                   'border-zinc-500 text-zinc-300 bg-zinc-800/20'
                : 'border-transparent text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {p}{p === 'history' && history.length > 0 ? ` (${history.length})` : ''}
          </button>
        ))}
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══ SCAN PANEL ═══ */}
        {panel === 'scan' && (
          <div className="p-3 space-y-3">
            {!target && <div className="text-xs text-zinc-600 py-4 text-center">Lock a target above to begin scan.</div>}

            {target && !scanDone && !scanning && (
              <button onClick={runScan} className="w-full py-2 border border-green-900/50 rounded text-xs text-green-500 hover:border-green-600 hover:bg-green-950/20 transition-colors font-bold tracking-wider uppercase">
                ▶ INITIATE SCAN
              </button>
            )}

            {scanning && (
              <div className="flex items-center gap-2 text-xs text-green-700 py-1">
                <span className="animate-pulse">◉</span>
                <span className="animate-pulse">Querying DB for {target}…</span>
              </div>
            )}

            {scanResults.length > 0 && (
              <div className="border border-green-950/40 rounded bg-green-950/5 px-3 py-1 divide-y divide-green-950/20">
                {scanResults.map((row, i) => <ScanRow key={i} row={row} reveal={!!revealedRows[i]} />)}
              </div>
            )}

            {scanDone && (
              <button onClick={runScan} className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-green-600 hover:border-green-900 transition-colors">
                ↺ RE-SCAN
              </button>
            )}
          </div>
        )}

        {/* ═══ PROBE PANEL ═══ */}
        {panel === 'probe' && (
          <div className="p-3 space-y-3">
            {!target && <div className="text-xs text-zinc-600 py-4 text-center">Lock a target above to probe.</div>}

            {target && !probeDone && !probing && (
              <button onClick={runProbe} className="w-full py-2 border border-yellow-900/50 rounded text-xs text-yellow-500 hover:border-yellow-600 hover:bg-yellow-950/20 transition-colors font-bold tracking-wider uppercase">
                ▶ DEEP PROBE
              </button>
            )}

            {probing && <div className="text-xs text-yellow-700 animate-pulse py-2 text-center">◉ Probing {target}… fingerprinting in progress</div>}

            {probeDone && probeResults.length > 0 && (
              <>
                <div className="border border-yellow-900/30 rounded bg-yellow-950/5">
                  <div className="px-3 py-1.5 border-b border-yellow-900/20 text-xs text-yellow-700/50 uppercase tracking-widest">Node Intelligence Report</div>
                  <div className="divide-y divide-yellow-900/10">
                    {probeResults.map((entry, i) => (
                      <div key={i} className="flex gap-3 px-3 py-2">
                        <span className="text-yellow-900/60 shrink-0 w-28 uppercase tracking-wide">{entry.key}</span>
                        <span className={`text-xs flex-1 break-all ${entry.value.includes('EXPIRED') || entry.value.includes('true') ? 'text-red-400' : 'text-yellow-300'}`}>{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={runProbe} className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-yellow-600 hover:border-yellow-900 transition-colors">↺ RE-PROBE</button>
              </>
            )}
          </div>
        )}

        {/* ═══ EXEC PANEL ═══ */}
        {panel === 'exec' && (
          <div className="p-3 space-y-3">
            {!selectedCmd && !running && (
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-700 uppercase tracking-widest mb-2">Select Operation</div>
                {EXEC_COMMANDS.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => { setSelectedCmd(cmd); setExecArgs('') }}
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
                <div className="text-xs text-zinc-600">Target: <span className="text-zinc-400">{target || '(none)'}</span></div>
                <div className="flex gap-2">
                  <button onClick={runExec} className={`flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                    selectedCmd.risk === 'critical' ? 'border border-red-800 text-red-400 hover:bg-red-950/30' : 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                  }`}>▶ EXECUTE</button>
                  <button onClick={() => { setSelectedCmd(null); setExecArgs('') }} className="px-3 py-1.5 rounded border border-zinc-800 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">CANCEL</button>
                </div>
              </div>
            )}

            {running && <div className="text-xs text-red-600 animate-pulse py-2 text-center">◉ Executing {selectedCmd?.label}…</div>}

            {execLog.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-700 uppercase tracking-widest">Session Log</div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded divide-y divide-zinc-800/50 max-h-64 overflow-y-auto">
                  {execLog.map((entry, i) => (
                    <div key={i} className="px-3 py-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${entry.ok ? 'text-green-500' : 'text-red-500'}`}>{entry.ok ? '✓' : '✗'}</span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${entry.ok ? 'text-green-400' : 'text-red-400'}`}>{entry.cmd}</span>
                        {entry.args && <span className="text-xs text-zinc-600">{entry.args}</span>}
                        <span className="ml-auto text-xs text-zinc-700">{entry.timestamp}</span>
                      </div>
                      <pre className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed pl-4">{entry.output}</pre>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
                <button onClick={() => { setSelectedCmd(null); setExecArgs('') }} className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-red-600 hover:border-red-900 transition-colors">
                  + NEW OPERATION
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY PANEL ═══ */}
        {panel === 'history' && (
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 uppercase tracking-widest">Scan Library ({history.length})</span>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-zinc-700 hover:text-red-500 transition-colors">CLEAR ALL</button>
              )}
            </div>

            {history.length === 0 && (
              <div className="text-xs text-zinc-700 py-6 text-center">No scans recorded yet.</div>
            )}

            {history.map((rec, i) => (
              <button
                key={i}
                onClick={() => { setInputTarget(rec.target); setTarget(rec.target); resetAll(); setPanel('scan') }}
                className="w-full text-left border border-zinc-800 rounded px-3 py-2.5 space-y-1.5 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {kindBadge(rec.kind)}
                  <span className="text-xs text-zinc-300 font-mono truncate">{rec.target}</span>
                  <span className="ml-auto text-xs text-zinc-700 shrink-0">{new Date(rec.scannedAt).toLocaleTimeString()}</span>
                </div>
                {Object.entries(rec.data).slice(0, 2).map(([k, v]) => (
                  <div key={k} className="flex gap-2 pl-1">
                    <span className="text-xs text-zinc-700 uppercase w-20 shrink-0">{k}</span>
                    <span className="text-xs text-zinc-500 truncate">{v}</span>
                  </div>
                ))}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
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
