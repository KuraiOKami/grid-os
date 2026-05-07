// ── CourierApp.tsx ───────────────────────────────────────────────────────────
// 80 Days + Mini Metro style: take contracts, route packages across the city
// map, balance speed vs. exposure. Inspect = flags you. Don’t inspect = risk.
import { useState, useEffect, useRef } from 'react'
import { useRepStore } from '@/store/reputationStore'

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

type NodeId = string
type SectorStatus = 'clear' | 'monitored' | 'hot' | 'locked'
type PackageClass = 'standard' | 'flagged' | 'illegal' | 'classified'
type ClientType = 'gridcorp' | 'underground' | 'anonymous'

interface MapNode {
  id:     NodeId
  label:  string
  x:      number
  y:      number
  status: SectorStatus
}

interface Contract {
  id:        string
  from:      NodeId
  to:        NodeId
  client:    ClientType
  payout:    number
  risk:      number        // 0–100
  timeLimit: number        // seconds
  elapsed:   number
  pkgClass:  PackageClass  // revealed on inspect or delivery
  inspected: boolean
  accepted:  boolean
  status:    'available' | 'active' | 'delivered' | 'failed' | 'busted'
  description: string
}

const NODES: MapNode[] = [
  { id: 'n1',  label: 'GRID-1 HUB',    x: 50,  y: 50,  status: 'clear'     },
  { id: 'n2',  label: 'MARKET STRIP',  x: 180, y: 80,  status: 'monitored' },
  { id: 'n3',  label: 'OUTER RING A',  x: 300, y: 60,  status: 'clear'     },
  { id: 'n4',  label: 'CORP TOWER',    x: 230, y: 160, status: 'hot'       },
  { id: 'n5',  label: 'SPLICE DEN',    x: 100, y: 200, status: 'clear'     },
  { id: 'n6',  label: 'GRID-7 DEPOT',  x: 280, y: 240, status: 'monitored' },
  { id: 'n7',  label: 'VOID ALLEY',    x: 60,  y: 300, status: 'clear'     },
  { id: 'n8',  label: 'RELAY TOWER',   x: 200, y: 310, status: 'clear'     },
  { id: 'n9',  label: 'LOCKDOWN-11',   x: 330, y: 280, status: 'locked'    },
  { id: 'n10', label: 'TRANSIT HUB',   x: 150, y: 370, status: 'monitored' },
]

const EDGES: [NodeId, NodeId][] = [
  ['n1','n2'],['n2','n3'],['n2','n4'],['n1','n5'],['n4','n6'],
  ['n5','n7'],['n6','n8'],['n7','n8'],['n8','n10'],['n3','n4'],
  ['n6','n9'],['n8','n9'],['n10','n7'],
]

const CONTRACTS_POOL: Omit<Contract, 'elapsed' | 'accepted' | 'status'>[] = [
  { id: 'ctr01', from: 'n1', to: 'n4', client: 'gridcorp',    payout: 120, risk: 30, timeLimit: 90,  inspected: false, pkgClass: 'standard',   description: 'Standard data capsule. GridCorp logistics. Corporate log on delivery.' },
  { id: 'ctr02', from: 'n5', to: 'n8', client: 'underground', payout: 280, risk: 65, timeLimit: 60,  inspected: false, pkgClass: 'flagged',    description: 'Anonymous drop. No manifest. Underground relay origin.' },
  { id: 'ctr03', from: 'n2', to: 'n7', client: 'anonymous',   payout: 200, risk: 50, timeLimit: 75,  inspected: false, pkgClass: 'classified', description: 'Sealed container. Client: [REDACTED]. No inspection clause.' },
  { id: 'ctr04', from: 'n1', to: 'n6', client: 'gridcorp',    payout: 90,  risk: 20, timeLimit: 120, inspected: false, pkgClass: 'standard',   description: 'Routine compliance archive. Low risk. Fast payout.' },
  { id: 'ctr05', from: 'n7', to: 'n3', client: 'underground', payout: 340, risk: 80, timeLimit: 50,  inspected: false, pkgClass: 'illegal',    description: 'Hot package. Void Alley origin. DO NOT open.' },
  { id: 'ctr06', from: 'n2', to: 'n10',client: 'anonymous',   payout: 160, risk: 40, timeLimit: 100, inspected: false, pkgClass: 'standard',   description: 'Transit parcel. Anonymous sender. Monitored route.' },
  { id: 'ctr07', from: 'n1', to: 'n8', client: 'gridcorp',    payout: 110, risk: 25, timeLimit: 90,  inspected: false, pkgClass: 'flagged',    description: 'GridCorp flagged internal transfer. Pre-cleared — or so they claim.' },
]

const STATUS_COLOR: Record<SectorStatus, string> = {
  clear:     '#00cc88',
  monitored: '#ffaa00',
  hot:       '#ff3b5c',
  locked:    '#6b6b80',
}
const STATUS_LABEL: Record<SectorStatus, string> = {
  clear:     'CLEAR',
  monitored: 'MONITORED',
  hot:       'HOT',
  locked:    'LOCKED',
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

function initContracts(): Contract[] {
  return CONTRACTS_POOL.slice(0, 4).map(c => ({ ...c, elapsed: 0, accepted: false, status: 'available' }))
}

export default function CourierApp() {
  const [contracts,  setContracts]   = useState<Contract[]>(initContracts)
  const [active,     setActive]      = useState<Contract | null>(null)
  const [position,   setPosition]    = useState<NodeId>('n1')
  const [log,        setLog]         = useState<string[]>(['[SYS] Courier client initialised. Awaiting contract.'])
  const [credits,    setCredits]     = useState(0)
  const [busts,      setBusts]       = useState(0)
  const [hoverNode,  setHoverNode]   = useState<NodeId | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rep = useRepStore()

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}] ${msg}`, ...prev.slice(0, 49)])

  // Tick active contract timer
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
          addLog(`[FAIL] Contract ${prev.id} expired.`)
          setContracts(cs => cs.map(c => c.id === prev.id ? { ...c, status: 'failed' } : c))
          return null
        }
        return { ...prev, elapsed }
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [active?.id, active?.status])

  function acceptContract(c: Contract) {
    if (active) { addLog('[WARN] Already running a contract. Deliver or abandon first.'); return }
    setActive({ ...c, status: 'active', elapsed: 0 })
    setContracts(prev => prev.map(x => x.id === c.id ? { ...x, status: 'active', accepted: true } : x))
    addLog(`[CONTRACT] Accepted ${c.id} — ${nodeLabel(c.from)} → ${nodeLabel(c.to)} — ${c.client.toUpperCase()}`)
  }

  function inspectPackage() {
    if (!active) return
    const updated = { ...active, inspected: true }
    setActive(updated)
    setContracts(prev => prev.map(c => c.id === active.id ? { ...c, inspected: true } : c))
    addLog(`[INSPECT] Package opened. Class: ${active.pkgClass.toUpperCase()}.`)
    if (active.pkgClass === 'illegal') {
      addLog('[ALERT] Illegal goods detected. Compliance breach logged.')
      rep.modCompliance(-15)
      rep.modShadow(+10)
    } else if (active.pkgClass === 'classified') {
      addLog('[WARN] Classified material. Inspection flagged by GridCorp.')
      rep.modCompliance(-8)
    } else {
      addLog('[OK] Contents nominal.')
    }
  }

  function travelTo(nodeId: NodeId) {
    const node = NODES.find(n => n.id === nodeId)!
    if (node.status === 'locked') { addLog(`[DENY] ${node.label} is locked. Access refused.`); return }
    setPosition(nodeId)
    addLog(`[MOVE] Arrived: ${node.label} — ${STATUS_LABEL[node.status]}`)
    if (node.status === 'hot') {
      addLog('[RISK] Hot sector. Exposure +20.')
      if (active?.pkgClass === 'illegal' || active?.pkgClass === 'classified') {
        const roll = Math.random()
        if (roll < 0.35) {
          addLog('[BUST] Package flagged at hot sector. Contract terminated.')
          setBusts(b => b + 1)
          rep.modCompliance(-25)
          setContracts(prev => prev.map(c => c.id === active!.id ? { ...c, status: 'busted' } : c))
          setActive(null)
          return
        }
      }
    }
    if (node.status === 'monitored' && active?.client === 'underground') {
      addLog('[WARN] Underground package in monitored sector. Risk elevated.')
    }
    // Check delivery
    if (active && nodeId === active.to) {
      deliverPackage()
    }
  }

  function deliverPackage() {
    if (!active) return
    const bonus = active.pkgClass === 'illegal' ? 50 : 0
    const penalty = active.inspected && (active.pkgClass === 'illegal' || active.pkgClass === 'classified') ? -30 : 0
    const earned = active.payout + bonus + penalty
    setCredits(c => c + earned)
    addLog(`[DELIVERED] ${active.id} complete. Earned: ${earned} cr.`)
    if (active.client === 'gridcorp') rep.modCompliance(+5)
    if (active.client === 'underground') rep.modShadow(+8)
    setContracts(prev => prev.map(c => c.id === active.id ? { ...c, status: 'delivered' } : c))
    setActive(null)
    // Refresh pool if running low
    setContracts(prev => {
      const available = prev.filter(c => c.status === 'available')
      if (available.length < 2) {
        const fresh = CONTRACTS_POOL
          .filter(p => !prev.find(c => c.id === p.id) || prev.find(c => c.id === p.id)?.status === 'delivered')
          .slice(0, 2)
          .map(c => ({ ...c, elapsed: 0, accepted: false, status: 'available' as const }))
        return [...prev, ...fresh]
      }
      return prev
    })
  }

  function nodeLabel(id: NodeId) { return NODES.find(n => n.id === id)?.label ?? id }

  const neighbours = (nodeId: NodeId) =>
    EDGES.filter(([a, b]) => a === nodeId || b === nodeId)
         .map(([a, b]) => (a === nodeId ? b : a))

  const timeLeft = active ? active.timeLimit - active.elapsed : 0
  const timePct  = active ? timeLeft / active.timeLimit : 1

  return (
    <div style={{ display: 'flex', height: '100%', background: C.bg, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.text }}>

      {/* Left: Contracts */}
      <div style={{ width: 220, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: C.accent, marginBottom: 2 }}>COURIER</div>
          <div style={{ fontSize: 9, color: C.muted }}>CONTRACTS AVAILABLE</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 10 }}>
            <span style={{ color: C.success }}>{credits} cr</span>
            {busts > 0 && <span style={{ color: C.danger }}>{busts} bust{busts !== 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {contracts.map(c => {
            const isAct = active?.id === c.id
            const done  = c.status === 'delivered' || c.status === 'failed' || c.status === 'busted'
            return (
              <div key={c.id} style={{
                padding: '10px 12px',
                borderBottom: `1px solid ${C.border}`,
                background: isAct ? C.surf3 : 'none',
                opacity: done ? 0.4 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: CLIENT_COLOR[c.client], letterSpacing: '0.08em' }}>{c.client.toUpperCase()}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: C.success }}>{c.payout}cr</span>
                </div>
                <div style={{ fontSize: 10, color: C.text, marginBottom: 2 }}>
                  {nodeLabel(c.from)} → {nodeLabel(c.to)}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 9 }}>
                  <span style={{ color: c.risk > 60 ? C.danger : c.risk > 35 ? C.warn : C.success }}>RISK {c.risk}%</span>
                  <span style={{ color: C.muted }}>{c.timeLimit}s</span>
                </div>
                {c.status === 'available' && !active && (
                  <button onClick={() => acceptContract(c)} style={{
                    width: '100%', padding: '4px 0',
                    border: `1px solid ${C.accent}`, borderRadius: 3,
                    background: 'none', color: C.accent,
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 10,
                    transition: 'background 0.1s',
                  }}>ACCEPT</button>
                )}
                {done && (
                  <div style={{ fontSize: 9, color: c.status === 'delivered' ? C.success : C.danger, letterSpacing: '0.08em' }}>
                    {c.status.toUpperCase()}
                  </div>
                )}
                {isAct && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ height: 3, background: C.faint, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${timePct * 100}%`, background: timePct < 0.25 ? C.danger : C.accent, transition: 'width 1s linear' }} />
                    </div>
                    <div style={{ fontSize: 9, color: timePct < 0.25 ? C.danger : C.muted }}>{timeLeft}s remaining</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Centre: Map */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Active contract bar */}
        {active && (
          <div style={{
            padding: '8px 14px', background: C.surf2,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          }}>
            <span style={{ color: C.accent, fontSize: 10 }}>ACTIVE →</span>
            <span style={{ color: C.text }}>{nodeLabel(active.from)} → {nodeLabel(active.to)}</span>
            <span style={{ color: PKG_COLOR[active.pkgClass], fontSize: 9 }}>
              {active.inspected ? active.pkgClass.toUpperCase() : '[UNKNOWN]'}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {!active.inspected && (
                <button onClick={inspectPackage} style={{
                  padding: '3px 10px', border: `1px solid ${C.warn}`, borderRadius: 3,
                  background: 'none', color: C.warn, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 10,
                }}>INSPECT</button>
              )}
            </div>
          </div>
        )}

        {/* SVG Map */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 400 430" style={{ display: 'block' }}>
            {/* Edges */}
            {EDGES.map(([a, b], i) => {
              const na = NODES.find(n => n.id === a)!
              const nb = NODES.find(n => n.id === b)!
              const isRoute = active && (
                (a === position && b === active.to) ||
                (b === position && a === active.to) ||
                neighbours(position).includes(a) || neighbours(position).includes(b)
              )
              return (
                <line key={i}
                  x1={na.x + 14} y1={na.y + 14}
                  x2={nb.x + 14} y2={nb.y + 14}
                  stroke={C.border} strokeWidth={1}
                />
              )
            })}
            {/* Nodes */}
            {NODES.map(node => {
              const isCurrent  = node.id === position
              const isNeighbor = neighbours(position).includes(node.id)
              const isDest     = active?.to === node.id
              const isHov      = hoverNode === node.id
              const sColor     = STATUS_COLOR[node.status]
              return (
                <g key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: (isNeighbor && node.status !== 'locked') ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHoverNode(node.id)}
                  onMouseLeave={() => setHoverNode(null)}
                  onClick={() => isNeighbor && travelTo(node.id)}
                >
                  <rect
                    width={28} height={28} rx={4}
                    fill={isCurrent ? C.accent + '33' : isNeighbor ? sColor + '22' : C.surface}
                    stroke={isCurrent ? C.accent : isDest ? C.warn : isHov && isNeighbor ? sColor : sColor + '66'}
                    strokeWidth={isCurrent || isDest ? 2 : 1}
                  />
                  {isCurrent && (
                    <circle cx={14} cy={14} r={5} fill={C.accent} opacity={0.9} />
                  )}
                  {isDest && !isCurrent && (
                    <rect x={9} y={9} width={10} height={10} rx={2} fill={C.warn} opacity={0.8} />
                  )}
                  <text x={14} y={40} textAnchor="middle" fill={isCurrent ? C.accent : C.muted} fontSize={8} fontFamily="JetBrains Mono">
                    {node.label.length > 11 ? node.label.slice(0, 10) + '…' : node.label}
                  </text>
                  <text x={14} y={49} textAnchor="middle" fill={sColor} fontSize={7} fontFamily="JetBrains Mono">
                    {STATUS_LABEL[node.status]}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Right: Log */}
      <div style={{ width: 200, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: C.surface, fontSize: 9, color: C.muted, letterSpacing: '0.1em' }}>ACTIVITY LOG</div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {log.map((l, i) => (
            <div key={i} style={{
              fontSize: 9, lineHeight: 1.6,
              color: l.includes('[BUST]') || l.includes('[FAIL]') || l.includes('[ALERT]') ? C.danger
                   : l.includes('[DELIVERED]') ? C.success
                   : l.includes('[WARN]') || l.includes('[RISK]') ? C.warn
                   : C.muted,
            }}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
