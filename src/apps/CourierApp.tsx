// CourierApp.tsx — 80 Days + Mini Metro
// Take contracts. Route packages. Sectors go hot during compliance sweeps.
// Inspect = tamper flag. Don't inspect = you're blind. Client revealed on delivery.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRepStore } from '@/store/reputationStore'
import { useWalletStore } from '@/store/walletStore'

const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  surf2:   '#16161f',
  surf3:   '#1c1c26',
  border:  '#2a2a3a',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  warn:    '#ffaa00',
  danger:  '#ff3b5c',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

type NodeId       = string
type SectorStatus = 'clear' | 'monitored' | 'hot' | 'locked'
type PackageClass = 'standard' | 'flagged' | 'illegal' | 'classified'
type ClientType   = 'gridcorp' | 'underground' | 'anonymous'

interface MapNode {
  id:         NodeId
  label:      string
  zone:       string
  x:          number
  y:          number
  baseStatus: SectorStatus
}

interface Contract {
  id:           string
  from:         NodeId
  to:           NodeId
  client:       ClientType
  clientHandle: string       // hidden until delivery
  payout:       number
  risk:         number       // 0–100 hint shown to player
  timeLimit:    number       // seconds
  elapsed:      number
  pkgClass:     PackageClass // hidden until inspect or delivery
  inspected:    boolean
  status:       'available' | 'active' | 'delivered' | 'failed' | 'busted'
  description:  string
}

// ── Map ───────────────────────────────────────────────────────────────────────

const NODES: MapNode[] = [
  { id: 'n1',  label: 'GRID-1 HUB',   zone: 'CORP',     x: 45,  y: 55,  baseStatus: 'monitored' },
  { id: 'n2',  label: 'CORP TOWER',   zone: 'CORP',     x: 190, y: 35,  baseStatus: 'hot'       },
  { id: 'n3',  label: 'NEXUS PLAZA',  zone: 'CORP',     x: 325, y: 65,  baseStatus: 'hot'       },
  { id: 'n4',  label: 'RELAY-7',      zone: 'TRANSIT',  x: 90,  y: 165, baseStatus: 'monitored' },
  { id: 'n5',  label: 'MARKET STRIP', zone: 'TRANSIT',  x: 255, y: 150, baseStatus: 'monitored' },
  { id: 'n6',  label: 'BLOCK DELTA',  zone: 'SECTOR 6', x: 50,  y: 255, baseStatus: 'clear'     },
  { id: 'n7',  label: 'SPLICE YARD',  zone: 'SECTOR 6', x: 210, y: 260, baseStatus: 'clear'     },
  { id: 'n8',  label: 'THE PIT',      zone: 'UNDER',    x: 115, y: 345, baseStatus: 'clear'     },
  { id: 'n9',  label: 'VOID ALLEY',   zone: 'UNDER',    x: 265, y: 330, baseStatus: 'clear'     },
  { id: 'n10', label: 'DEAD DROP 9',  zone: 'TERMINUS', x: 360, y: 240, baseStatus: 'clear'     },
]

const EDGES: [NodeId, NodeId][] = [
  ['n1','n2'], ['n2','n3'],
  ['n1','n4'], ['n2','n4'], ['n2','n5'], ['n3','n5'], ['n3','n10'],
  ['n4','n5'],
  ['n4','n6'], ['n5','n7'], ['n4','n7'],
  ['n6','n7'],
  ['n6','n8'], ['n7','n9'],
  ['n8','n9'],
  ['n9','n10'],
]

const STATUS_COLOR: Record<SectorStatus, string> = {
  clear:     '#00cc88',
  monitored: '#ffaa00',
  hot:       '#ff3b5c',
  locked:    '#6b6b80',
}

const CLIENT_COLOR: Record<ClientType, string> = {
  gridcorp:    '#00e5ff',
  underground: '#d6a2ff',
  anonymous:   '#6b6b80',
}

const PKG_COLOR: Record<PackageClass, string> = {
  standard:   '#00cc88',
  flagged:    '#ffaa00',
  illegal:    '#ff3b5c',
  classified: '#d6a2ff',
}

const PKG_LABEL: Record<PackageClass, string> = {
  standard:   'STANDARD',
  flagged:    'FLAGGED',
  illegal:    'ILLEGAL',
  classified: 'CLASSIFIED',
}

// ── Contract pool ─────────────────────────────────────────────────────────────

type PoolContract = Omit<Contract, 'elapsed' | 'status' | 'inspected'>

const POOL: PoolContract[] = [
  {
    id: 'ctr-01', from: 'n1', to: 'n4',
    client: 'gridcorp', clientHandle: 'GridOS Logistics Div.',
    payout: 90, risk: 20, timeLimit: 120, pkgClass: 'standard',
    description: 'Routine compliance archive. Logged and sealed by GridCorp. Corporate record on delivery.',
  },
  {
    id: 'ctr-02', from: 'n8', to: 'n3',
    client: 'underground', clientHandle: 'Void Runner #44',
    payout: 380, risk: 85, timeLimit: 75, pkgClass: 'illegal',
    description: 'Hot package. Pit origin. Corp zone delivery. DO NOT open. Payment on arrival, not before.',
  },
  {
    id: 'ctr-03', from: 'n2', to: 'n8',
    client: 'anonymous', clientHandle: 'ShadowBroker Node C',
    payout: 240, risk: 60, timeLimit: 90, pkgClass: 'classified',
    description: 'Sealed container. No inspection clause. Client: ██████████. Route at your discretion.',
  },
  {
    id: 'ctr-04', from: 'n6', to: 'n5',
    client: 'gridcorp', clientHandle: 'Market Operations L7',
    payout: 110, risk: 25, timeLimit: 110, pkgClass: 'standard',
    description: 'Residential-to-market transfer. Pre-cleared. Standard liability waiver attached.',
  },
  {
    id: 'ctr-05', from: 'n7', to: 'n1',
    client: 'anonymous', clientHandle: 'Anon Relay 0x9A',
    payout: 195, risk: 50, timeLimit: 80, pkgClass: 'flagged',
    description: 'Flagged in transit registry. Client unverified. Origin: Splice Yard. Handle with care.',
  },
  {
    id: 'ctr-06', from: 'n4', to: 'n9',
    client: 'underground', clientHandle: 'Relay Ghost',
    payout: 215, risk: 45, timeLimit: 95, pkgClass: 'flagged',
    description: 'Transit relay to the underground. Origin clean. Contents: unknown.',
  },
  {
    id: 'ctr-07', from: 'n5', to: 'n6',
    client: 'gridcorp', clientHandle: 'GridCorp Residential Ops',
    payout: 80, risk: 15, timeLimit: 130, pkgClass: 'standard',
    description: "Market-to-residential. Fully compliant. Easy money if you're patient.",
  },
  {
    id: 'ctr-08', from: 'n9', to: 'n2',
    client: 'underground', clientHandle: 'APEX Collective',
    payout: 420, risk: 90, timeLimit: 65, pkgClass: 'illegal',
    description: "Void to corp tower. You know what this is. Clock's running. Don't stop.",
  },
  {
    id: 'ctr-09', from: 'n3', to: 'n8',
    client: 'anonymous', clientHandle: 'Director K.',
    payout: 310, risk: 70, timeLimit: 85, pkgClass: 'classified',
    description: 'Corp-origin classified. Manifest: [REDACTED]. Client: ██████████. Pit delivery.',
  },
  {
    id: 'ctr-10', from: 'n1', to: 'n10',
    client: 'gridcorp', clientHandle: 'GridOS Terminus Archive',
    payout: 150, risk: 35, timeLimit: 100, pkgClass: 'flagged',
    description: "Pre-flagged internal transfer. GridOS says it's cleared. Terminus drop. Their word.",
  },
  {
    id: 'ctr-11', from: 'n6', to: 'n3',
    client: 'anonymous', clientHandle: 'Cipher Node R',
    payout: 270, risk: 65, timeLimit: 80, pkgClass: 'classified',
    description: 'Residential origin. Corp zone delivery. Client silent. Package weight is wrong.',
  },
  {
    id: 'ctr-12', from: 'n8', to: 'n5',
    client: 'underground', clientHandle: 'Market Ghost',
    payout: 175, risk: 40, timeLimit: 100, pkgClass: 'flagged',
    description: 'Pit-to-market. Underground origin. Watch the monitored zone.',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function nodeById(id: NodeId): MapNode | undefined {
  return NODES.find(n => n.id === id)
}

function nodeLabel(id: NodeId): string {
  return nodeById(id)?.label ?? id
}

function getNeighbours(id: NodeId): NodeId[] {
  return EDGES
    .filter(([a, b]) => a === id || b === id)
    .map(([a, b]) => (a === id ? b : a))
}

function findPath(from: NodeId, to: NodeId): NodeId[] {
  if (from === to) return [from]
  const queue: NodeId[][] = [[from]]
  const visited = new Set([from])
  while (queue.length) {
    const path = queue.shift()!
    for (const n of getNeighbours(path[path.length - 1])) {
      if (n === to) return [...path, n]
      if (!visited.has(n)) {
        visited.add(n)
        queue.push([...path, n])
      }
    }
  }
  return []
}

function initContracts(): Contract[] {
  return POOL.slice(0, 4).map(c => ({
    ...c, elapsed: 0, inspected: false, status: 'available' as const,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CourierApp() {
  const rep    = useRepStore()
  const wallet = useWalletStore()

  const [contracts,  setContracts]  = useState<Contract[]>(initContracts)
  const [active,     setActive]     = useState<Contract | null>(null)
  const [position,   setPosition]   = useState<NodeId>('n6')
  const [heatMap,    setHeatMap]    = useState<Partial<Record<NodeId, SectorStatus>>>({})
  const [sweepBanner,setSweepBanner]= useState<string | null>(null)
  const [exposure,   setExposure]   = useState(0)
  const [log,        setLog]        = useState<string[]>(['[SYS] Courier terminal ready. Awaiting contract.'])
  const [earnings,   setEarnings]   = useState(0)
  const [busts,      setBusts]      = useState(0)
  const [hoverNode,  setHoverNode]  = useState<NodeId | null>(null)
  const [hops,       setHops]       = useState<NodeId[]>([])

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const heatMapRef = useRef(heatMap)
  useEffect(() => { heatMapRef.current = heatMap }, [heatMap])

  const addLog = useCallback((msg: string) =>
    setLog(prev => [
      `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${msg}`,
      ...prev.slice(0, 49),
    ]),
  [])

  const effectiveStatus = useCallback((id: NodeId): SectorStatus =>
    heatMap[id] ?? nodeById(id)?.baseStatus ?? 'clear',
  [heatMap])

  // ── Contract countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || active.status !== 'active') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setActive(prev => {
        if (!prev) return null
        const elapsed = prev.elapsed + 1
        if (elapsed >= prev.timeLimit) {
          addLog(`[FAIL] ${prev.id} expired — package abandoned.`)
          setContracts(cs => cs.map(c => c.id === prev.id ? { ...c, status: 'failed' } : c))
          setExposure(0)
          setHops([])
          return null
        }
        return { ...prev, elapsed }
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active?.id, active?.status, addLog])

  // ── Compliance sweep events ───────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const hm = heatMapRef.current
      const clearNodes    = NODES.filter(n => (hm[n.id] ?? n.baseStatus) === 'clear')
      const monitNodes    = NODES.filter(n => (hm[n.id] ?? n.baseStatus) === 'monitored')
      const elevated: string[]                              = []
      const newHeat: Partial<Record<NodeId, SectorStatus>> = {}

      if (clearNodes.length && Math.random() < 0.45) {
        const t = clearNodes[Math.floor(Math.random() * clearNodes.length)]
        newHeat[t.id] = 'monitored'
        elevated.push(`${t.label} → MONITORED`)
      }
      if (monitNodes.length && Math.random() < 0.35) {
        const t = monitNodes[Math.floor(Math.random() * monitNodes.length)]
        newHeat[t.id] = 'hot'
        elevated.push(`${t.label} → HOT`)
      }

      if (!elevated.length) return

      setHeatMap(prev => ({ ...prev, ...newHeat }))
      const banner = `COMPLIANCE SWEEP — ${elevated.join(' / ')}`
      setSweepBanner(banner)
      addLog(`[SWEEP] ${banner}`)

      setTimeout(() => {
        setHeatMap(prev => {
          const next = { ...prev }
          Object.keys(newHeat).forEach(k => delete next[k])
          return next
        })
        setSweepBanner(null)
        addLog('[SWEEP] Sectors normalising.')
      }, 22_000)
    }, 42_000)
    return () => clearInterval(id)
  }, [addLog])

  // ── Handlers ─────────────────────────────────────────────────────────────

  function acceptContract(c: Contract) {
    if (active) { addLog('[WARN] Already running a contract. Deliver or let it expire.'); return }
    const started: Contract = { ...c, status: 'active', elapsed: 0 }
    setActive(started)
    setContracts(prev => prev.map(x => x.id === c.id ? { ...x, status: 'active' } : x))
    setExposure(0)
    setHops([position])
    const clientStr = c.client === 'anonymous' ? '██████████' : c.client.toUpperCase()
    addLog(`[CONTRACT] ${c.id} — ${nodeLabel(c.from)} → ${nodeLabel(c.to)} | ${clientStr} | ${c.payout} cr`)
  }

  function inspectPackage() {
    if (!active) return
    setActive({ ...active, inspected: true })
    setContracts(prev => prev.map(c => c.id === active.id ? { ...c, inspected: true } : c))
    addLog(`[INSPECT] Package opened — class: ${PKG_LABEL[active.pkgClass]}`)
    if (active.pkgClass === 'illegal') {
      addLog('[ALERT] Illegal goods detected. Compliance breach registered by GridOS.')
      rep.adjust('compliance', -15)
      rep.adjust('shadow', +10)
    } else if (active.pkgClass === 'classified') {
      addLog('[WARN] Classified material. Inspection logged by GridCorp.')
      rep.adjust('compliance', -8)
    } else if (active.pkgClass === 'flagged') {
      addLog('[INFO] Flagged contents — no immediate breach. Watch yourself.')
    } else {
      addLog('[OK] Contents nominal. Clean package.')
    }
  }

  function travelTo(nodeId: NodeId) {
    if (!active) {
      // Allow free movement when no contract
      const node = nodeById(nodeId)!
      const st   = effectiveStatus(nodeId)
      if (st === 'locked') { addLog(`[DENY] ${node.label} is locked.`); return }
      setPosition(nodeId)
      addLog(`[MOVE] → ${node.label} [${node.zone}] — ${st.toUpperCase()}`)
      return
    }

    const node = nodeById(nodeId)!
    const st   = effectiveStatus(nodeId)

    if (st === 'locked') {
      addLog(`[DENY] ${node.label} locked — access refused.`)
      return
    }

    // Exposure accumulation
    const expDelta = st === 'hot' ? 20 : st === 'monitored' ? 9 : 0
    const newExposure = Math.min(100, exposure + expDelta)
    setExposure(newExposure)
    setPosition(nodeId)
    setHops(prev => [...prev, nodeId])

    addLog(`[MOVE] → ${node.label} [${node.zone}] — ${st.toUpperCase()}${expDelta > 0 ? ` | EXP +${expDelta}` : ''}`)

    if (st === 'monitored' && active.client === 'underground') {
      addLog('[WARN] Underground package in monitored sector. GridOS watching.')
      rep.adjust('compliance', -1)
    }

    // Bust roll in hot sectors
    if (st === 'hot') {
      const pkg = active.pkgClass
      if (pkg === 'illegal' || pkg === 'classified') {
        const base        = pkg === 'illegal' ? 0.28 : 0.16
        const expBonus    = newExposure / 280
        const inspPenalty = active.inspected ? 0.10 : 0
        const bustProb    = Math.min(0.80, base + expBonus + inspPenalty)
        if (Math.random() < bustProb) {
          addLog(`[BUST] Flagged at ${node.label}. Contract terminated. Compliance -25.`)
          setBusts(b => b + 1)
          rep.adjust('compliance', -25)
          rep.adjust('shadow', +5)
          setContracts(prev => prev.map(c => c.id === active.id ? { ...c, status: 'busted' } : c))
          setActive(null)
          setExposure(0)
          setHops([])
          return
        }
      }
    }

    // Delivery
    if (nodeId === active.to) {
      completeDelivery(active, nodeId)
    }
  }

  function completeDelivery(a: Contract, atNode: NodeId) {
    let earned = a.payout
    if (!a.inspected && a.pkgClass === 'illegal')  earned += 60   // blind carry bonus
    if (a.inspected  && (a.pkgClass === 'illegal' || a.pkgClass === 'classified'))
      earned = Math.round(earned * 0.80)                          // tamper penalty

    wallet.credit(earned, `Courier: ${a.id}`)
    setEarnings(e => e + earned)

    addLog(`[DELIVERED] ${a.id} at ${nodeLabel(atNode)}. Earned ₳${earned}.`)
    addLog(`[REVEAL] Client: ${a.clientHandle} (${a.client.toUpperCase()})`)
    if (a.pkgClass !== 'standard') addLog(`[REVEAL] Package was: ${PKG_LABEL[a.pkgClass]}`)

    if (a.client === 'gridcorp')    rep.adjust('compliance', +5)
    if (a.client === 'underground') rep.adjust('shadow', +8)
    if (a.client === 'anonymous')  { rep.adjust('compliance', -2); rep.adjust('shadow', +3) }
    if (a.pkgClass === 'illegal' && !a.inspected) {
      addLog('[SHADOW] Blind carry complete. Shadow +5.')
      rep.adjust('shadow', +5)
    }

    setContracts(prev => {
      const updated = prev.map(c => c.id === a.id ? { ...c, status: 'delivered' as const } : c)
      if (updated.filter(c => c.status === 'available').length < 2) {
        const existing = new Set(updated.map(c => c.id))
        const fresh = POOL
          .filter(p => !existing.has(p.id))
          .slice(0, 3)
          .map(p => ({ ...p, elapsed: 0, inspected: false, status: 'available' as const }))
        return [...updated, ...fresh]
      }
      return updated
    })

    setActive(null)
    setExposure(0)
    setHops([])
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const nbrs        = getNeighbours(position)
  const timeLeft    = active ? active.timeLimit - active.elapsed : 0
  const timePct     = active ? timeLeft / active.timeLimit : 1
  const suggestPath = active ? findPath(position, active.to) : []
  const expColor    = exposure >= 70 ? C.danger : exposure >= 40 ? C.warn : C.success

  // Edge sets for rendering
  const pathEdgeSet = new Set<string>()
  for (let i = 0; i < suggestPath.length - 1; i++) {
    pathEdgeSet.add([suggestPath[i], suggestPath[i + 1]].sort().join('-'))
  }
  const trailEdgeSet = new Set<string>()
  for (let i = 0; i < hops.length - 1; i++) {
    trailEdgeSet.add([hops[i], hops[i + 1]].sort().join('-'))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex', height: '100%',
      background: C.bg, color: C.text,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      overflow: 'hidden',
    }}>

      {/* ── Left: Contract board ─────────────────────────────────────────── */}
      <div style={{ width: 232, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: C.accent, letterSpacing: '0.1em' }}>COURIER</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.12em', marginBottom: 8 }}>CONTRACT BOARD</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 10 }}>
            <span style={{ color: C.success }}>₳ {earnings}</span>
            {busts > 0 && <span style={{ color: C.danger }}>{busts} bust{busts !== 1 ? 's' : ''}</span>}
            <span style={{ color: C.faint, marginLeft: 'auto' }}>
              {nodeLabel(position)}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contracts.map(c => {
            const isAct = active?.id === c.id
            const done  = c.status === 'delivered' || c.status === 'failed' || c.status === 'busted'
            return (
              <div key={c.id} style={{
                padding: '10px 12px',
                borderBottom: `1px solid ${C.border}`,
                borderLeft: isAct ? `3px solid ${C.accent}` : '3px solid transparent',
                background: isAct ? C.surf3 : 'none',
                opacity: done ? 0.32 : 1,
              }}>
                {/* Client + payout row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: CLIENT_COLOR[c.client], letterSpacing: '0.08em' }}>
                    {c.client === 'anonymous' ? '██████████' : c.client.toUpperCase()}
                  </span>
                  <span style={{ marginLeft: 'auto', color: C.success, fontWeight: 'bold' }}>
                    {c.payout} cr
                  </span>
                </div>

                {/* Route */}
                <div style={{ fontSize: 10, color: C.text, marginBottom: 3 }}>
                  {nodeLabel(c.from)} → {nodeLabel(c.to)}
                </div>

                {/* Risk / time / pkg class */}
                <div style={{ display: 'flex', gap: 8, fontSize: 9, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: c.risk > 65 ? C.danger : c.risk > 35 ? C.warn : C.success }}>
                    RISK {c.risk}%
                  </span>
                  <span style={{ color: C.muted }}>{c.timeLimit}s</span>
                  {c.inspected && (
                    <span style={{ color: PKG_COLOR[c.pkgClass] }}>{PKG_LABEL[c.pkgClass]}</span>
                  )}
                </div>

                {/* Description */}
                {!done && (
                  <div style={{ fontSize: 9, color: C.faint, lineHeight: 1.55, marginBottom: 6 }}>
                    {c.description}
                  </div>
                )}

                {/* Actions / status */}
                {c.status === 'available' && !active && (
                  <button
                    onClick={() => acceptContract(c)}
                    style={contractBtn}
                  >
                    ACCEPT CONTRACT
                  </button>
                )}
                {isAct && (
                  <div style={{ marginTop: 2 }}>
                    <div style={{ height: 2, background: C.faint, borderRadius: 1, overflow: 'hidden', marginBottom: 3 }}>
                      <div style={{
                        height: '100%',
                        width: `${timePct * 100}%`,
                        background: timePct < 0.25 ? C.danger : timePct < 0.5 ? C.warn : C.accent,
                        transition: 'width 1s linear',
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: timePct < 0.25 ? C.danger : C.muted }}>
                      {timeLeft}s remaining
                    </div>
                  </div>
                )}
                {done && (
                  <div style={{
                    fontSize: 9, letterSpacing: '0.08em',
                    color: c.status === 'delivered' ? C.success : C.danger,
                  }}>
                    {c.status.toUpperCase()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Centre: Map ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Compliance sweep banner */}
        {sweepBanner && (
          <div style={{
            padding: '6px 14px', flexShrink: 0,
            background: `${C.danger}14`, borderBottom: `1px solid ${C.danger}44`,
            fontSize: 10, color: C.danger, letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ▲ {sweepBanner}
          </div>
        )}

        {/* Active contract bar */}
        {active ? (
          <div style={{
            padding: '7px 14px', flexShrink: 0,
            background: C.surf2, borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <span style={{ color: C.accent, fontSize: 10, letterSpacing: '0.06em' }}>ACTIVE</span>
            <span style={{ color: C.text }}>{nodeLabel(active.from)} → {nodeLabel(active.to)}</span>
            <span style={{ fontSize: 9, color: CLIENT_COLOR[active.client] }}>
              {active.client === 'anonymous' ? '██████████' : active.client.toUpperCase()}
            </span>
            <span style={{ fontSize: 9, color: active.inspected ? PKG_COLOR[active.pkgClass] : C.faint }}>
              PKG: {active.inspected ? PKG_LABEL[active.pkgClass] : '[UNKNOWN]'}
            </span>

            {/* Exposure meter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
              <span style={{ fontSize: 8, color: expColor, letterSpacing: '0.08em' }}>EXP</span>
              <div style={{ width: 56, height: 4, background: C.faint, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${exposure}%`,
                  background: expColor, transition: 'width 0.3s', borderRadius: 2,
                }} />
              </div>
              <span style={{ fontSize: 9, color: expColor, minWidth: 22, textAlign: 'right' }}>{exposure}</span>
            </div>

            {!active.inspected && (
              <button onClick={inspectPackage} style={inspectBtn}>INSPECT</button>
            )}
          </div>
        ) : (
          <div style={{
            padding: '7px 14px', flexShrink: 0,
            background: C.surf2, borderBottom: `1px solid ${C.border}`,
            fontSize: 10, color: C.faint,
          }}>
            No active contract — select from board. Currently at {nodeLabel(position)}.
          </div>
        )}

        {/* SVG Map */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <svg
            width="100%" height="100%"
            viewBox="0 0 415 420"
            style={{ display: 'block' }}
          >
            {/* Zone labels */}
            {[
              { label: 'CORP SECTOR',   x: 8, y: 22 },
              { label: 'TRANSIT RING',  x: 8, y: 142 },
              { label: 'SECTOR 6',      x: 8, y: 235 },
              { label: 'UNDERGROUND',   x: 8, y: 318 },
            ].map(z => (
              <text key={z.label} x={z.x} y={z.y} fill={C.faint}
                fontSize={7} fontFamily="JetBrains Mono" letterSpacing="0.12em">
                {z.label}
              </text>
            ))}

            {/* Edges */}
            {EDGES.map(([a, b]) => {
              const na  = nodeById(a)!
              const nb  = nodeById(b)!
              const key = [a, b].sort().join('-')
              const isTrail = trailEdgeSet.has(key)
              const isPath  = pathEdgeSet.has(key) && !isTrail
              return (
                <line
                  key={key}
                  x1={na.x + 14} y1={na.y + 14}
                  x2={nb.x + 14} y2={nb.y + 14}
                  stroke={isTrail ? C.accent + 'aa' : isPath ? C.violet + '88' : C.border}
                  strokeWidth={isTrail ? 2 : isPath ? 1.5 : 1}
                  strokeDasharray={isPath ? '5 3' : 'none'}
                />
              )
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const status    = effectiveStatus(node.id)
              const isCurrent = node.id === position
              const isNbr     = nbrs.includes(node.id)
              const isDest    = active?.to === node.id
              const isOrigin  = active?.from === node.id && !isCurrent
              const isHov     = hoverNode === node.id
              const canMove   = isNbr && status !== 'locked'
              const sColor    = STATUS_COLOR[status]

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: canMove ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHoverNode(node.id)}
                  onMouseLeave={() => setHoverNode(null)}
                  onClick={() => canMove && travelTo(node.id)}
                >
                  {/* Destination pulse ring */}
                  {isDest && (
                    <rect
                      x={-5} y={-5} width={38} height={38} rx={7}
                      fill="none"
                      stroke={C.warn + '55'}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Node body */}
                  <rect
                    width={28} height={28} rx={4}
                    fill={isCurrent ? sColor + '2a' : isHov && canMove ? sColor + '18' : C.surface}
                    stroke={
                      isCurrent  ? sColor :
                      isDest     ? C.warn :
                      isOrigin   ? C.violet + 'cc' :
                      isHov && canMove ? sColor :
                      sColor + '44'
                    }
                    strokeWidth={isCurrent || isDest ? 2 : 1}
                  />

                  {/* Current position dot */}
                  {isCurrent && (
                    <circle cx={14} cy={14} r={5} fill={sColor} opacity={0.95} />
                  )}

                  {/* Destination marker */}
                  {isDest && !isCurrent && (
                    <rect x={8} y={8} width={12} height={12} rx={2}
                      fill={C.warn} opacity={0.85} />
                  )}

                  {/* Origin marker */}
                  {isOrigin && (
                    <rect x={10} y={10} width={8} height={8} rx={2}
                      fill={C.violet} opacity={0.6} />
                  )}

                  {/* Reachable neighbour dot */}
                  {isNbr && !isCurrent && !isDest && !isOrigin && (
                    <circle cx={14} cy={14} r={2.5}
                      fill={canMove ? sColor + '88' : C.faint} />
                  )}

                  {/* Node label */}
                  <text x={14} y={40} textAnchor="middle"
                    fill={isCurrent ? sColor : isDest ? C.warn : isNbr ? C.text : C.muted}
                    fontSize={7.5} fontFamily="JetBrains Mono">
                    {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                  </text>
                  <text x={14} y={49} textAnchor="middle"
                    fill={sColor + (isCurrent ? 'ee' : '88')}
                    fontSize={6.5} fontFamily="JetBrains Mono">
                    {status.toUpperCase()}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* ── Right: Log + route ───────────────────────────────────────────── */}
      <div style={{ width: 196, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        <div style={{
          padding: '10px 12px', borderBottom: `1px solid ${C.border}`,
          background: C.surface, fontSize: 9, color: C.muted, letterSpacing: '0.12em',
          flexShrink: 0,
        }}>
          ACTIVITY LOG
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {log.map((l, i) => (
            <div key={i} style={{
              fontSize: 9, lineHeight: 1.65,
              color:
                l.includes('[BUST]')  || l.includes('[FAIL]')  ||
                l.includes('[ALERT]') || l.includes('[DENY]')
                  ? C.danger
                : l.includes('[DELIVERED]') || l.includes('[OK]')
                  ? C.success
                : l.includes('[WARN]') || l.includes('[RISK]') || l.includes('[SWEEP]')
                  ? C.warn
                : l.includes('[REVEAL]') || l.includes('[SHADOW]')
                  ? C.violet
                : l.includes('[INSPECT]') || l.includes('[CONTRACT]')
                  ? C.accent
                : C.muted,
            }}>
              {l}
            </div>
          ))}
        </div>

        {/* Suggested route panel */}
        {active && suggestPath.length > 1 && (
          <div style={{
            padding: '8px 10px', borderTop: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0,
          }}>
            <div style={{ fontSize: 8, color: C.faint, letterSpacing: '0.12em', marginBottom: 5 }}>
              SUGGESTED ROUTE
            </div>
            <div style={{ fontSize: 9, lineHeight: 1.9 }}>
              {suggestPath.map((id, i) => {
                const st = effectiveStatus(id)
                const isHere = id === position
                const isDst  = id === active.to
                return (
                  <span key={id}>
                    {i > 0 && <span style={{ color: C.faint }}> › </span>}
                    <span style={{
                      color: isHere ? C.accent : isDst ? C.warn : STATUS_COLOR[st],
                      fontWeight: isHere || isDst ? 'bold' : 'normal',
                      opacity: i < suggestPath.indexOf(suggestPath.find((_, j) => j >= suggestPath.indexOf(id) && suggestPath[j] === position) ?? id) ? 0.45 : 1,
                    }}>
                      {nodeById(id)?.label.split(' ')[0] ?? id}
                    </span>
                  </span>
                )
              })}
            </div>
            {/* Risk profile of remaining hops */}
            <div style={{ marginTop: 5, fontSize: 8, color: C.faint, letterSpacing: '0.06em' }}>
              {suggestPath.slice(suggestPath.indexOf(position) + 1).map(id => {
                const st = effectiveStatus(id)
                return st === 'hot' ? <span key={id} style={{ color: C.danger }}>● </span>
                     : st === 'monitored' ? <span key={id} style={{ color: C.warn }}>◉ </span>
                     : <span key={id} style={{ color: C.success }}>○ </span>
              })}
              <span style={{ marginLeft: 4 }}>
                {suggestPath.slice(suggestPath.indexOf(position) + 1).some(id => effectiveStatus(id) === 'hot')
                  ? 'hot sectors ahead'
                  : suggestPath.slice(suggestPath.indexOf(position) + 1).some(id => effectiveStatus(id) === 'monitored')
                  ? 'monitored route'
                  : 'route clear'}
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          padding: '8px 10px', borderTop: `1px solid ${C.border}`,
          background: C.surface, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {(['clear', 'monitored', 'hot'] as SectorStatus[]).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8, color: C.faint }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLOR[s], flexShrink: 0 }} />
              {s.toUpperCase()}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8, color: C.faint, marginTop: 2 }}>
            <div style={{ width: 20, height: 2, background: C.violet + '88', flexShrink: 0 }} />
            SUGGESTED
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8, color: C.faint }}>
            <div style={{ width: 20, height: 2, background: C.accent + 'aa', flexShrink: 0 }} />
            TRAVELED
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Button styles ─────────────────────────────────────────────────────────────

const contractBtn: React.CSSProperties = {
  width: '100%', padding: '5px 0',
  border: `1px solid #00e5ff44`, borderRadius: 3,
  background: '#00e5ff0a', color: '#00e5ff',
  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10, letterSpacing: '0.06em', transition: 'all 0.1s',
}

const inspectBtn: React.CSSProperties = {
  padding: '3px 10px',
  border: `1px solid #ffaa0066`, borderRadius: 3,
  background: '#ffaa000a', color: '#ffaa00',
  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
}
