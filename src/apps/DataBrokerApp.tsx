// ── DataBrokerApp.tsx ───────────────────────────────────────────────────────────
// Offworld Trading Company feel: acquire data, time the sell, watch the
// market move, race against ROOT BLOOM expiry. Timing is the skill.
import { useState, useEffect, useRef, useCallback } from 'react'
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
  amber:   '#e8a020',
}

type DataType   = 'exfil' | 'observer' | 'checkpoint' | 'identity' | 'comms'
type BuyerType  = 'gridcorp' | 'voidbay' | 'splice' | 'commune'
type Tab        = 'market' | 'inventory' | 'log'

interface DataAsset {
  id:          string
  name:        string
  type:        DataType
  baseValue:   number
  acquireCost: number
  description: string
  expiresIn:   number | null
  maxExpiry:   number | null
  sizeKb:      number
  acquired:    boolean
  sold:        boolean
  hot:         boolean  // flagged = sells to GridCorp raise heat
}

interface Buyer {
  id:          BuyerType
  label:       string
  shortLabel:  string
  color:       string
  logsTransaction: boolean
  multiplier:  Record<DataType, number>
  reputation:  'compliance' | 'shadow'
  repDelta:    number
  description: string
  // live demand modifier (0.5 – 1.5), shifts per tick
  demand:      number
}

interface LogEntry {
  text:   string
  kind:   'info' | 'acquire' | 'sell' | 'warn' | 'expire' | 'bloom'
  ts:     string
}

interface PricePoint { t: number; price: number }

// ── static data ───────────────────────────────────────────────────────────

const BASE_ASSETS: Omit<DataAsset, 'acquired' | 'sold'>[] = [
  {
    id: 'da01', name: 'OBSERVER REPORT — GRID-7',
    type: 'observer', baseValue: 200, acquireCost: 40, expiresIn: 120, maxExpiry: 120, sizeKb: 14, hot: false,
    description: 'Raw observer sweep log. GridCorp wants it back. Splice will pay more to leak it.',
  },
  {
    id: 'da02', name: 'CHECKPOINT RECORD — C-0044',
    type: 'checkpoint', baseValue: 180, acquireCost: 35, expiresIn: 90, maxExpiry: 90, sizeKb: 8, hot: false,
    description: 'Copied checkpoint entry. High value to GridCorp. Worthless the moment ROOT BLOOM overwrites the source node.',
  },
  {
    id: 'da03', name: 'EXFIL BUNDLE — CORP TOWER',
    type: 'exfil', baseValue: 320, acquireCost: 80, expiresIn: 60, maxExpiry: 60, sizeKb: 44, hot: true,
    description: 'Exfiltrated corp files. Splice premium. Short window before GridCorp overwrites the source. Hot asset — selling to GridCorp raises heat.',
  },
  {
    id: 'da04', name: 'IDENTITY HASH — [ANON]',
    type: 'identity', baseValue: 240, acquireCost: 60, expiresIn: null, maxExpiry: null, sizeKb: 2, hot: false,
    description: 'Anonymised citizen identity record. Commune pays top rate for protection ops. No expiry — but the person may surface.',
  },
  {
    id: 'da05', name: 'COMMS INTERCEPT — RELAY-9',
    type: 'comms', baseValue: 160, acquireCost: 30, expiresIn: 45, maxExpiry: 45, sizeKb: 6, hot: false,
    description: 'Relay intercept. Very short shelf life. Commune and Splice both want it — first mover takes the premium.',
  },
  {
    id: 'da06', name: 'OBSERVER SWEEP — OUTER RING',
    type: 'observer', baseValue: 210, acquireCost: 45, expiresIn: 150, maxExpiry: 150, sizeKb: 18, hot: false,
    description: 'Outer Ring sweep data. GridCorp premium. Longer window than inner-city data — but demand fluctuates.',
  },
  {
    id: 'da07', name: 'EXFIL DUMP — DIV-MON',
    type: 'exfil', baseValue: 400, acquireCost: 100, expiresIn: 40, maxExpiry: 40, sizeKb: 72, hot: true,
    description: 'Monitoring Division dump. Highest value asset on the board. Expires fast. Extremely hot — GridCorp will flag the transaction.',
  },
  {
    id: 'da08', name: 'IDENTITY ARCHIVE — GRID-11',
    type: 'identity', baseValue: 280, acquireCost: 70, expiresIn: null, maxExpiry: null, sizeKb: 5, hot: false,
    description: 'GRID-11 identity archive. Commune pays significantly above base. Timeless value — identities don\'t expire.',
  },
  {
    id: 'da09', name: 'COMMS LOG — NODE CLUSTER 4',
    type: 'comms', baseValue: 190, acquireCost: 50, expiresIn: 70, maxExpiry: 70, sizeKb: 9, hot: false,
    description: 'Node Cluster 4 comms log. Splice values this highly for pattern analysis. Medium expiry window.',
  },
  {
    id: 'da10', name: 'CHECKPOINT BATCH — TRANSIT HUB',
    type: 'checkpoint', baseValue: 260, acquireCost: 65, expiresIn: 80, maxExpiry: 80, sizeKb: 22, hot: true,
    description: 'Transit hub checkpoint batch. GridCorp pays top rate. Hot — the data trail leads back to the hub\'s own systems.',
  },
]

const INIT_BUYERS: Buyer[] = [
  {
    id: 'gridcorp', label: 'GRIDCORP INTEL', shortLabel: 'GCORP', color: C.accent,
    logsTransaction: true, reputation: 'compliance', repDelta: +8, demand: 1.0,
    description: 'Pays premium. Every transaction is logged and attributed to your CitizenID.',
    multiplier: { exfil: 0.7, observer: 1.6, checkpoint: 1.9, identity: 1.3, comms: 0.9 },
  },
  {
    id: 'voidbay', label: 'VOIDBAY', shortLabel: 'VOID', color: C.muted,
    logsTransaction: false, reputation: 'shadow', repDelta: +5, demand: 1.0,
    description: 'Anonymous dark-market. Lower prices, no attribution, no questions.',
    multiplier: { exfil: 1.2, observer: 0.8, checkpoint: 0.7, identity: 1.0, comms: 1.1 },
  },
  {
    id: 'splice', label: 'THE SPLICE', shortLabel: 'SPLICE', color: C.violet,
    logsTransaction: false, reputation: 'shadow', repDelta: +10, demand: 1.0,
    description: 'Underground hacker collective. High pay for GridCorp-originated data. Builds shadow rep.',
    multiplier: { exfil: 1.9, observer: 1.2, checkpoint: 0.9, identity: 0.7, comms: 1.5 },
  },
  {
    id: 'commune', label: 'THE COMMUNE', shortLabel: 'COMM', color: C.success,
    logsTransaction: false, reputation: 'shadow', repDelta: +6, demand: 1.0,
    description: 'Activist network. Values identity and comms data for citizen protection ops.',
    multiplier: { exfil: 0.6, observer: 0.9, checkpoint: 0.8, identity: 2.0, comms: 1.8 },
  },
]

const TYPE_COLOR: Record<DataType, string> = { exfil: C.danger, observer: C.accent, checkpoint: C.warn, identity: C.violet, comms: C.success }
const TYPE_ICON:  Record<DataType, string> = { exfil: '▲', observer: '◎', checkpoint: '■', identity: '◆', comms: '∿' }
const LOG_COLOR: Record<LogEntry['kind'], string> = {
  info: C.muted, acquire: C.accent, sell: C.success,
  warn: C.warn, expire: C.danger, bloom: C.danger,
}

function ts() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function calcPrice(asset: DataAsset, buyer: Buyer, marketMod: number): number {
  return Math.max(1, Math.round(asset.baseValue * buyer.multiplier[asset.type] * (1 + marketMod) * buyer.demand))
}

// Tiny sparkline SVG
function Sparkline({ points, color, w = 60, h = 20 }: { points: PricePoint[]; color: string; w?: number; h?: number }) {
  if (points.length < 2) return <svg width={w} height={h} />
  const vals  = points.map(p => p.price)
  const min   = Math.min(...vals)
  const max   = Math.max(...vals)
  const range = Math.max(max - min, 1)
  const xs    = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys    = vals.map(v => h - ((v - min) / range) * (h - 2) - 1)
  const d     = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const last  = vals[vals.length - 1]
  const prev  = vals[vals.length - 2]
  const trend = last >= prev ? color : C.danger
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={trend} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2" fill={trend} />
    </svg>
  )
}

// Expiry bar
function ExpiryBar({ remaining, max, width = 100 }: { remaining: number; max: number; width?: number }) {
  const pct   = Math.max(0, remaining / max)
  const color = pct > 0.5 ? C.success : pct > 0.25 ? C.warn : C.danger
  return (
    <div style={{ width, height: 3, background: C.faint, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 1s linear, background 0.3s' }} />
    </div>
  )
}

// Demand bar for a buyer
function DemandBar({ demand, color }: { demand: number; color: string }) {
  const pct = ((demand - 0.5) / 1.0) * 100  // 0.5–1.5 → 0–100%
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 40, height: 3, background: C.faint, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 8, color, minWidth: 28 }}>{demand.toFixed(2)}x</span>
    </div>
  )
}

// ── ROOT BLOOM countdown banner ──────────────────────────────────────────────────────
function BloomBanner({ seconds }: { seconds: number }) {
  const urgent  = seconds <= 30
  const warning = seconds <= 60
  return (
    <div style={{
      padding: '5px 16px',
      background: urgent ? C.danger + '22' : warning ? C.warn + '18' : C.faint,
      borderBottom: `1px solid ${urgent ? C.danger : warning ? C.warn : C.border}`,
      display: 'flex', alignItems: 'center', gap: 10,
      flexShrink: 0, fontSize: 9, letterSpacing: '0.08em',
      animation: urgent ? 'bloomPulse 0.8s ease-in-out infinite' : 'none',
    }}>
      <span style={{ color: urgent ? C.danger : warning ? C.warn : C.muted }}>ROOT BLOOM</span>
      <div style={{ flex: 1, height: 2, background: C.faint, borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 1,
          width: `${Math.max(0, (seconds / 180) * 100)}%`,
          background: urgent ? C.danger : warning ? C.warn : C.success,
          transition: 'width 1s linear, background 0.3s',
        }} />
      </div>
      <span style={{ color: urgent ? C.danger : warning ? C.warn : C.muted, fontWeight: 'bold', minWidth: 30 }}>
        {seconds}s
      </span>
      <span style={{ color: C.muted }}>until source overwrite</span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function DataBrokerApp() {
  const [assets,    setAssets]    = useState<DataAsset[]>(() => BASE_ASSETS.map(a => ({ ...a, acquired: false, sold: false })))
  const [credits,   setCredits]   = useState(200)
  const [buyers,    setBuyers]    = useState<Buyer[]>(INIT_BUYERS)
  const [marketMod, setMarketMod] = useState(0)      // global ± fluctuation
  const [bloomTimer, setBloom]    = useState(180)     // ROOT BLOOM countdown
  const [log,       setLog]       = useState<LogEntry[]>([{ text: 'Data Broker terminal online. ROOT BLOOM cycle active.', kind: 'info', ts: ts() }])
  const [selected,  setSelected]  = useState<DataAsset | null>(null)
  const [tab,       setTab]       = useState<Tab>('market')
  const [priceHist, setPriceHist] = useState<Record<string, PricePoint[]>>({})  // assetId → sample points
  const [tickCount, setTickCount] = useState(0)
  const rep = useRepStore()

  const addLog = useCallback((text: string, kind: LogEntry['kind']) => {
    setLog(prev => [{ text, kind, ts: ts() }, ...prev.slice(0, 79)])
  }, [])

  // ─ master tick: market drift, demand drift, expiry, bloom ─────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTickCount(n => n + 1)

      // Market mod drift
      setMarketMod(prev => {
        const d = (Math.random() - 0.5) * 0.05
        return Math.max(-0.35, Math.min(0.55, prev + d))
      })

      // Buyer demand drift (each moves independently)
      setBuyers(prev => prev.map(b => {
        const d = (Math.random() - 0.5) * 0.04
        return { ...b, demand: Math.max(0.5, Math.min(1.5, b.demand + d)) }
      }))

      // ROOT BLOOM countdown
      setBloom(prev => {
        if (prev <= 1) {
          // Bloom fires: all acquired unexpired assets expire, market crashes briefly
          setAssets(aa => aa.map(a => {
            if (a.acquired && !a.sold && a.expiresIn !== null) {
              addLog(`[ROOT BLOOM] ${a.name} — source overwritten. Asset lost.`, 'bloom')
              return { ...a, sold: true }
            }
            return a
          }))
          setMarketMod(-0.3)  // post-bloom crash
          addLog('[ROOT BLOOM] Cycle complete. Source nodes overwritten.', 'bloom')
          return 180  // reset cycle
        }
        return prev - 1
      })

      // Per-asset expiry tick
      setAssets(prev => prev.map(a => {
        if (a.sold || !a.acquired || a.expiresIn === null) return a
        const remaining = a.expiresIn - 1
        if (remaining <= 0) {
          addLog(`[EXPIRED] ${a.name} — data overwritten before sell.`, 'expire')
          return { ...a, expiresIn: 0, sold: true }
        }
        return { ...a, expiresIn: remaining }
      }))
    }, 1000)
    return () => clearInterval(id)
  }, [addLog])

  // Sample price history for selected asset (every 5 ticks)
  useEffect(() => {
    if (!selected || tickCount % 5 !== 0) return
    const best = buyers.reduce((top, b) => {
      const p = calcPrice(selected, b, marketMod)
      return p > top ? p : top
    }, 0)
    setPriceHist(prev => {
      const history = prev[selected.id] ?? []
      return { ...prev, [selected.id]: [...history.slice(-19), { t: tickCount, price: best }] }
    })
  }, [tickCount, selected, buyers, marketMod])

  function acquire(asset: DataAsset) {
    if (credits < asset.acquireCost) {
      addLog(`[DENY] Insufficient credits — need ${asset.acquireCost} cr.`, 'warn')
      return
    }
    setCredits(c => c - asset.acquireCost)
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, acquired: true } : a))
    setSelected(prev => prev?.id === asset.id ? { ...prev, acquired: true } : prev)
    addLog(`[ACQUIRE] ${asset.name} — cost: ${asset.acquireCost} cr`, 'acquire')
  }

  function sell(asset: DataAsset, buyer: Buyer) {
    const price = calcPrice(asset, buyer, marketMod)
    setCredits(c => c + price)
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, sold: true } : a))
    setSelected(prev => prev?.id === asset.id ? null : prev)
    if (buyer.logsTransaction) {
      addLog(`[SELL] ${asset.name} → ${buyer.label} — ${price} cr [TRANSACTION LOGGED]`, 'warn')
      rep.modCompliance(buyer.repDelta)
      if (asset.hot) {
        addLog(`[HEAT] Hot asset sold to corporate buyer. Compliance flagged.`, 'warn')
        rep.modCompliance(-4)
      }
    } else {
      addLog(`[SELL] ${asset.name} → ${buyer.label} — ${price} cr`, 'sell')
      rep.modShadow(buyer.repDelta)
    }
  }

  // Derived
  const inventory  = assets.filter(a =>  a.acquired && !a.sold)
  const available  = assets.filter(a => !a.acquired && !a.sold)
  const modPct     = (marketMod * 100).toFixed(0)
  const modLabel   = marketMod >= 0 ? `+${modPct}%` : `${modPct}%`
  const modColor   = marketMod >= 0 ? C.success : C.danger

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.text }}>
      <style>{`
        @keyframes bloomPulse {
          0%,100% { opacity: 1 }
          50%      { opacity: 0.6 }
        }
        @keyframes urgentBlink {
          0%,100% { color: #ff3b5c }
          50%      { color: #ff3b5c88 }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ padding: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: C.amber, letterSpacing: '0.06em' }}>DATA BROKER</span>
            <div style={{ display: 'flex', gap: 14, fontSize: 10, alignItems: 'center' }}>
              <span style={{ color: C.success, fontWeight: 'bold' }}>{credits} cr</span>
              <span style={{ color: modColor }}>MKT {modLabel}</span>
              <span style={{ color: C.muted }}>{inventory.length} held</span>
            </div>
            {/* Buyer demand pills */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              {buyers.map(b => (
                <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <span style={{ fontSize: 7, color: b.color, letterSpacing: '0.06em' }}>{b.shortLabel}</span>
                  <DemandBar demand={b.demand} color={b.color} />
                </div>
              ))}
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {(['market', 'inventory', 'log'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '5px 14px', border: 'none', cursor: 'pointer',
                background: 'none', fontFamily: 'inherit', fontSize: 10,
                color: tab === t ? C.accent : C.muted,
                borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`,
                letterSpacing: '0.08em',
              }}>
                {t.toUpperCase()}
                {t === 'inventory' && inventory.length > 0 && (
                  <span style={{ marginLeft: 4, color: inventory.some(a => a.expiresIn !== null && a.expiresIn < 20) ? C.danger : C.warn }}>
                    ({inventory.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ROOT BLOOM banner */}
      <BloomBanner seconds={bloomTimer} />

      {/* ─ MARKET TAB ─ */}
      {tab === 'market' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>

          {/* Left: available assets */}
          <div style={{ width: 210, borderRight: `1px solid ${C.border}`, overflow: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '6px 12px', fontSize: 9, color: C.faint, borderBottom: `1px solid ${C.border}`, letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between' }}>
              <span>AVAILABLE</span><span style={{ color: C.muted }}>{available.length}</span>
            </div>
            {available.length === 0 && (
              <div style={{ padding: 20, color: C.faint, fontSize: 10, textAlign: 'center' }}>No assets available.<br />Reset after ROOT BLOOM.</div>
            )}
            {available.map(a => {
              const isSel = selected?.id === a.id
              return (
                <button key={a.id} onClick={() => setSelected(a)} style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  padding: '9px 12px', background: isSel ? C.surf3 : 'none',
                  borderBottom: `1px solid ${C.faint}`, fontFamily: 'inherit',
                  transition: 'background 0.1s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <span style={{ color: TYPE_COLOR[a.type], fontSize: 11 }}>{TYPE_ICON[a.type]}</span>
                    <span style={{ fontSize: 10, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                    {a.hot && <span style={{ fontSize: 7, color: C.danger, border: `1px solid ${C.danger}`, padding: '0 3px', borderRadius: 2 }}>HOT</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 9 }}>
                    <span style={{ color: C.warn }}>{a.acquireCost} cr</span>
                    <span style={{ color: C.faint }}>{a.sizeKb}KB</span>
                    {a.expiresIn !== null && (
                      <span style={{ color: a.expiresIn < 30 ? C.danger : C.muted }}>
                        {a.expiresIn < 30 ? '!' : ''}{a.expiresIn}s
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: detail pane */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {!selected ? (
              <div style={{ padding: 40, color: C.faint, textAlign: 'center', fontSize: 11, lineHeight: 2 }}>
                Select a data asset<br />to view pricing and buyer offers.
              </div>
            ) : (
              <DetailPane
                asset={selected}
                buyers={buyers}
                marketMod={marketMod}
                credits={credits}
                history={priceHist[selected.id] ?? []}
                onAcquire={() => acquire(selected)}
                onSell={(b) => sell(selected, b)}
              />
            )}
          </div>
        </div>
      )}

      {/* ─ INVENTORY TAB ─ */}
      {tab === 'inventory' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {inventory.length === 0 && (
            <div style={{ color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 11 }}>Inventory empty. Acquire data from the market tab.</div>
          )}
          {inventory.map(a => (
            <InventoryRow key={a.id} asset={a} buyers={buyers} marketMod={marketMod} onSell={b => sell(a, b)} />
          ))}
        </div>
      )}

      {/* ─ LOG TAB ─ */}
      {tab === 'log' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px' }}>
          {log.map((l, i) => (
            <div key={i} style={{
              fontSize: 10, lineHeight: 1.85,
              color: LOG_COLOR[l.kind],
              borderBottom: `1px solid ${C.faint}`, paddingBottom: 3, marginBottom: 3,
            }}>
              <span style={{ color: C.faint, marginRight: 8 }}>{l.ts}</span>{l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DetailPane ───────────────────────────────────────────────────────────
function DetailPane({
  asset, buyers, marketMod, credits, history, onAcquire, onSell,
}: {
  asset: DataAsset; buyers: Buyer[]; marketMod: number; credits: number
  history: PricePoint[]; onAcquire: () => void; onSell: (b: Buyer) => void
}) {
  const canBuy  = !asset.acquired && credits >= asset.acquireCost
  const canSell = asset.acquired && !asset.sold

  return (
    <div style={{ padding: 18 }}>
      {/* Asset title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{ color: TYPE_COLOR[asset.type], fontSize: 18, marginTop: 2 }}>{TYPE_ICON[asset.type]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: C.amber }}>{asset.name}</span>
            {asset.hot && (
              <span style={{ fontSize: 8, color: C.danger, border: `1px solid ${C.danger}`, padding: '1px 5px', borderRadius: 2, letterSpacing: '0.08em' }}>HOT</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 9, marginBottom: 8 }}>
            <span style={{ color: TYPE_COLOR[asset.type], letterSpacing: '0.08em' }}>{asset.type.toUpperCase()}</span>
            <span style={{ color: C.muted }}>{asset.sizeKb} KB</span>
            {asset.expiresIn !== null && asset.maxExpiry !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: asset.expiresIn < 20 ? C.danger : C.warn }}>
                  {asset.expiresIn}s
                </span>
                <ExpiryBar remaining={asset.expiresIn} max={asset.maxExpiry} width={60} />
              </span>
            )}
            {asset.expiresIn === null && <span style={{ color: C.success }}>NO EXPIRY</span>}
          </div>
          <div style={{ color: C.muted, lineHeight: 1.75, fontSize: 10, maxWidth: 340 }}>{asset.description}</div>
        </div>
        {/* Sparkline */}
        {history.length >= 2 && (
          <div style={{ flexShrink: 0, opacity: 0.8 }}>
            <div style={{ fontSize: 8, color: C.faint, marginBottom: 3, textAlign: 'right' }}>BEST PRICE</div>
            <Sparkline points={history} color={C.success} w={70} h={24} />
          </div>
        )}
      </div>

      {/* Acquire button */}
      {!asset.acquired && (
        <button
          onClick={onAcquire}
          disabled={!canBuy}
          style={{
            padding: '7px 20px', marginBottom: 18,
            border: `1px solid ${canBuy ? C.accent : C.faint}`,
            borderRadius: 4, cursor: canBuy ? 'pointer' : 'not-allowed',
            background: canBuy ? C.accent + '22' : 'none',
            color: canBuy ? C.accent : C.faint,
            fontFamily: 'inherit', fontSize: 11,
            transition: 'all 0.15s',
          }}
        >
          ACQUIRE — {asset.acquireCost} cr
          {!canBuy && credits < asset.acquireCost && (
            <span style={{ fontSize: 9, color: C.danger, marginLeft: 8 }}>need {asset.acquireCost - credits} more</span>
          )}
        </button>
      )}
      {asset.acquired && (
        <div style={{ fontSize: 9, color: C.success, marginBottom: 14, padding: '4px 10px', border: `1px solid ${C.success}33`, borderRadius: 3, display: 'inline-block' }}>
          ✓ IN INVENTORY — select a buyer below
        </div>
      )}

      {/* Buyer offers */}
      <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginBottom: 10 }}>BUYER OFFERS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {buyers.map(b => {
          const price = calcPrice(asset, b, marketMod)
          return (
            <div key={b.id} style={{
              padding: '10px 14px',
              background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ color: b.color, fontSize: 11, fontWeight: 'bold' }}>{b.label}</span>
                  {b.logsTransaction && (
                    <span style={{ fontSize: 8, color: C.danger, border: `1px solid ${C.danger}44`, padding: '0 4px', borderRadius: 2 }}>LOGGED</span>
                  )}
                  {asset.hot && b.logsTransaction && (
                    <span style={{ fontSize: 8, color: C.danger }}>+HEAT</span>
                  )}
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>{b.description}</div>
                <DemandBar demand={b.demand} color={b.color} />
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: C.success }}>{price}</div>
                <div style={{ fontSize: 8, color: C.muted }}>cr</div>
              </div>
              {canSell ? (
                <button onClick={() => onSell(b)} style={{
                  padding: '6px 14px', border: `1px solid ${b.color}`,
                  borderRadius: 3, cursor: 'pointer',
                  background: b.color + '22', color: b.color,
                  fontFamily: 'inherit', fontSize: 10, flexShrink: 0,
                  transition: 'all 0.1s',
                }}>SELL</button>
              ) : (
                <span style={{ fontSize: 9, color: C.faint, flexShrink: 0, minWidth: 50, textAlign: 'right' }}>
                  {asset.acquired ? 'SOLD' : 'ACQUIRE FIRST'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── InventoryRow ───────────────────────────────────────────────────────────
function InventoryRow({ asset, buyers, marketMod, onSell }: {
  asset: DataAsset; buyers: Buyer[]; marketMod: number; onSell: (b: Buyer) => void
}) {
  const bestBuyer = buyers.reduce((top, b) => {
    const p = calcPrice(asset, b, marketMod)
    return p > calcPrice(asset, top, marketMod) ? b : top
  }, buyers[0])
  const bestPrice = calcPrice(asset, bestBuyer, marketMod)
  const isUrgent  = asset.expiresIn !== null && asset.expiresIn < 20

  return (
    <div style={{
      padding: '10px 14px', marginBottom: 8,
      background: C.surface,
      border: `1px solid ${isUrgent ? C.danger : C.border}`,
      borderRadius: 4,
      animation: isUrgent ? 'bloomPulse 0.8s ease-in-out infinite' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color: TYPE_COLOR[asset.type], fontSize: 14 }}>{TYPE_ICON[asset.type]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: C.text, fontSize: 11 }}>{asset.name}</span>
            {asset.hot && <span style={{ fontSize: 7, color: C.danger, border: `1px solid ${C.danger}`, padding: '0 3px', borderRadius: 2 }}>HOT</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 9, marginTop: 3, alignItems: 'center' }}>
            <span style={{ color: TYPE_COLOR[asset.type] }}>{asset.type.toUpperCase()}</span>
            <span style={{ color: C.muted }}>{asset.sizeKb}KB</span>
            {asset.expiresIn !== null && asset.maxExpiry !== null && (
              <>
                <span style={{ color: isUrgent ? C.danger : C.warn }}>{asset.expiresIn}s</span>
                <ExpiryBar remaining={asset.expiresIn} max={asset.maxExpiry} width={80} />
              </>
            )}
            {asset.expiresIn === null && <span style={{ color: C.success }}>STABLE</span>}
            <span style={{ color: C.success, marginLeft: 4 }}>BEST: {bestPrice} cr via {bestBuyer.shortLabel}</span>
          </div>
        </div>
      </div>
      {/* Quick sell buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {buyers.map(b => (
          <button key={b.id} onClick={() => onSell(b)} style={{
            padding: '4px 10px', border: `1px solid ${b.color}`,
            borderRadius: 3, cursor: 'pointer',
            background: b === bestBuyer ? b.color + '30' : b.color + '14',
            color: b.color, fontFamily: 'inherit', fontSize: 9,
            fontWeight: b === bestBuyer ? 'bold' : 'normal',
            transition: 'all 0.1s',
          }}>
            {b.shortLabel} — {calcPrice(asset, b, marketMod)} cr
          </button>
        ))}
      </div>
    </div>
  )
}
