// ── DataBrokerApp.tsx ─────────────────────────────────────────────────────────
// Offworld Trading Company style: acquire data assets, sell to buyers who
// want different things. Price fluctuates. Timing is the skill.
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
  amber:   '#e8a020',
}

type DataType = 'exfil' | 'observer' | 'checkpoint' | 'identity' | 'comms'
type BuyerType = 'gridcorp' | 'voidbay' | 'splice' | 'commune'

interface DataAsset {
  id:         string
  name:       string
  type:       DataType
  baseValue:  number
  acquired:   boolean
  sold:       boolean
  acquireCost:number
  description:string
  expiresIn:  number | null  // null = never expires; otherwise ticks down
  sizeKb:     number
}

interface Buyer {
  id:       BuyerType
  label:    string
  color:    string
  logsTransaction: boolean
  multiplier: Record<DataType, number>
  reputation: 'compliance' | 'shadow'
  repDelta:   number
  description: string
}

interface MarketTick {
  assetId:   string
  buyerId:   BuyerType
  price:     number
  timestamp: string
}

const BUYERS: Buyer[] = [
  {
    id: 'gridcorp', label: 'GRIDCORP INTEL', color: C.accent,
    logsTransaction: true, reputation: 'compliance', repDelta: +8,
    description: 'Pays premium. Every transaction logged and attributed.',
    multiplier: { exfil: 0.8, observer: 1.6, checkpoint: 1.8, identity: 1.4, comms: 1.0 },
  },
  {
    id: 'voidbay', label: 'VOIDBAY', color: C.muted,
    logsTransaction: false, reputation: 'shadow', repDelta: +5,
    description: 'Anonymous market. Lower prices. No attribution.',
    multiplier: { exfil: 1.2, observer: 0.8, checkpoint: 0.7, identity: 1.0, comms: 1.1 },
  },
  {
    id: 'splice', label: 'THE SPLICE', color: C.violet,
    logsTransaction: false, reputation: 'shadow', repDelta: +10,
    description: 'Underground collective. Pays high for GridCorp-originated data.',
    multiplier: { exfil: 1.8, observer: 1.2, checkpoint: 0.9, identity: 0.7, comms: 1.5 },
  },
  {
    id: 'commune', label: 'THE COMMUNE', color: C.success,
    logsTransaction: false, reputation: 'shadow', repDelta: +6,
    description: 'Activist network. Values identity and comms data for protection.',
    multiplier: { exfil: 0.7, observer: 0.9, checkpoint: 0.8, identity: 1.9, comms: 1.7 },
  },
]

const BASE_ASSETS: Omit<DataAsset, 'acquired' | 'sold'>[] = [
  { id: 'da01', name: 'OBSERVER REPORT — GRID-7',   type: 'observer',   baseValue: 200, acquireCost: 40,  expiresIn: 120, sizeKb: 14,  description: 'Raw observer sweep log. GridCorp wants this. Splice will pay more.' },
  { id: 'da02', name: 'CHECKPOINT RECORD — C-0044', type: 'checkpoint', baseValue: 180, acquireCost: 35,  expiresIn: 90,  sizeKb: 8,   description: 'Copied checkpoint entry. High value to GridCorp. Worthless after ROOT BLOOM.' },
  { id: 'da03', name: 'EXFIL BUNDLE — CORP TOWER',  type: 'exfil',     baseValue: 320, acquireCost: 80,  expiresIn: 60,  sizeKb: 44,  description: 'Exfiltrated corp files. Splice premium. Short window before overwrite.' },
  { id: 'da04', name: 'IDENTITY HASH — [ANON]',     type: 'identity',  baseValue: 240, acquireCost: 60,  expiresIn: null,sizeKb: 2,   description: 'Citizen identity record, anonymised. Commune pays top rate for protection ops.' },
  { id: 'da05', name: 'COMMS INTERCEPT — RELAY-9',  type: 'comms',     baseValue: 160, acquireCost: 30,  expiresIn: 45,  sizeKb: 6,   description: 'Relay intercept. Short shelf life. Commune and Splice both want it.' },
  { id: 'da06', name: 'OBSERVER SWEEP — OUTER RING', type: 'observer',  baseValue: 210, acquireCost: 45,  expiresIn: 150, sizeKb: 18,  description: 'Outer Ring sweep. GridCorp premium. Longer window than inner-city data.' },
  { id: 'da07', name: 'EXFIL DUMP — DIV-MON',       type: 'exfil',     baseValue: 400, acquireCost: 100, expiresIn: 40,  sizeKb: 72,  description: 'Monitoring Division dump. Highest value asset. Expires fast. Extremely hot.' },
  { id: 'da08', name: 'IDENTITY ARCHIVE — GRID-11', type: 'identity',  baseValue: 280, acquireCost: 70,  expiresIn: null,sizeKb: 5,   description: 'GRID-11 identity archive. Commune will pay significantly above base.' },
]

function initAssets(): DataAsset[] {
  return BASE_ASSETS.map(a => ({ ...a, acquired: false, sold: false }))
}

function calcPrice(asset: DataAsset, buyer: Buyer, marketMod: number): number {
  return Math.round(asset.baseValue * buyer.multiplier[asset.type] * (1 + marketMod))
}

export default function DataBrokerApp() {
  const [assets,     setAssets]    = useState<DataAsset[]>(initAssets)
  const [credits,    setCredits]   = useState(200)   // starting capital
  const [marketMod,  setMarketMod] = useState(0)     // ± fluctuation
  const [ticker,     setTicker]    = useState<MarketTick[]>([])
  const [log,        setLog]       = useState<string[]>(['[SYS] Data Broker terminal online.'])
  const [selected,   setSelected]  = useState<DataAsset | null>(null)
  const [tab,        setTab]       = useState<'market' | 'inventory' | 'log'>('market')
  const rep = useRepStore()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addLog = (msg: string) => setLog(prev => [`[${new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })}] ${msg}`, ...prev.slice(0, 99)])

  // Market fluctuation + expiry countdown
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setMarketMod(prev => {
        const delta = (Math.random() - 0.5) * 0.06
        return Math.max(-0.4, Math.min(0.6, prev + delta))
      })
      setAssets(prev => prev.map(a => {
        if (a.sold || !a.acquired || a.expiresIn === null) return a
        const remaining = a.expiresIn - 1
        if (remaining <= 0) {
          addLog(`[EXPIRED] ${a.name} — data overwritten. Asset worthless.`)
          return { ...a, expiresIn: 0, sold: true }  // mark as gone
        }
        return { ...a, expiresIn: remaining }
      }))
    }, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  function acquire(asset: DataAsset) {
    if (credits < asset.acquireCost) { addLog(`[DENY] Insufficient credits. Need ${asset.acquireCost} cr.`); return }
    setCredits(c => c - asset.acquireCost)
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, acquired: true } : a))
    addLog(`[ACQUIRE] ${asset.name} — cost: ${asset.acquireCost} cr`)
  }

  function sell(asset: DataAsset, buyer: Buyer) {
    const price = calcPrice(asset, buyer, marketMod)
    setCredits(c => c + price)
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, sold: true } : a))
    if (buyer.logsTransaction) {
      addLog(`[SELL] ${asset.name} → ${buyer.label} — ${price} cr — [TRANSACTION LOGGED]`)
      rep.modCompliance(buyer.repDelta)
    } else {
      addLog(`[SELL] ${asset.name} → ${buyer.label} — ${price} cr — anonymous`)
      rep.modShadow(buyer.repDelta)
    }
    setTicker(prev => [{ assetId: asset.id, buyerId: buyer.id, price, timestamp: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }) }, ...prev.slice(0, 19)])
    if (selected?.id === asset.id) setSelected(null)
  }

  const typeColor: Record<DataType, string> = { exfil: C.danger, observer: C.accent, checkpoint: C.warn, identity: C.violet, comms: C.success }
  const typeIcon:  Record<DataType, string> = { exfil: '▲', observer: '◎', checkpoint: '■', identity: '◆', comms: '∿' }

  const inventory = assets.filter(a => a.acquired && !a.sold)
  const available = assets.filter(a => !a.acquired && !a.sold)
  const modLabel  = marketMod >= 0 ? `+${(marketMod * 100).toFixed(0)}%` : `${(marketMod * 100).toFixed(0)}%`
  const modColor  = marketMod >= 0 ? C.success : C.danger

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.text }}>

      {/* Header */}
      <div style={{ padding: '10px 16px 0', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 'bold', color: C.amber }}>DATA BROKER</span>
          <div style={{ display: 'flex', gap: 14, fontSize: 10 }}>
            <span style={{ color: C.success }}>{credits} cr</span>
            <span style={{ color: modColor }}>MARKET {modLabel}</span>
            <span style={{ color: C.muted }}>{inventory.length} in inventory</span>
          </div>
          {/* Live market ticker */}
          <div style={{ marginLeft: 'auto', overflow: 'hidden', maxWidth: 220 }}>
            {ticker[0] && (
              <div style={{ fontSize: 9, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                LAST SALE: {BASE_ASSETS.find(a => a.id === ticker[0].assetId)?.name.slice(0,18)}… → {ticker[0].price} cr
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['market', 'inventory', 'log'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 16px', border: 'none', cursor: 'pointer',
              background: 'none', fontFamily: 'inherit', fontSize: 10,
              color: tab === t ? C.accent : C.muted,
              borderBottom: `2px solid ${tab === t ? C.accent : 'transparent'}`,
              letterSpacing: '0.08em',
            }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Market tab */}
      {tab === 'market' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {/* Asset list */}
          <div style={{ width: 240, borderRight: `1px solid ${C.border}`, overflow: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '6px 12px', fontSize: 9, color: C.muted, borderBottom: `1px solid ${C.border}`, letterSpacing: '0.1em' }}>AVAILABLE DATA</div>
            {available.length === 0 && (
              <div style={{ padding: 20, color: C.faint, fontSize: 10, textAlign: 'center' }}>No assets available.<br />Check back after ROOT BLOOM cycle.</div>
            )}
            {available.map(a => (
              <button key={a.id} onClick={() => setSelected(a)} style={{
                width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                padding: '10px 12px', background: selected?.id === a.id ? C.surf3 : 'none',
                borderBottom: `1px solid ${C.border}`, fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', gap: 3,
                transition: 'background 0.1s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: typeColor[a.type] }}>{typeIcon[a.type]}</span>
                  <span style={{ fontSize: 10, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 9 }}>
                  <span style={{ color: C.success }}>{a.acquireCost} cr</span>
                  <span style={{ color: C.muted }}>{a.sizeKb} KB</span>
                  {a.expiresIn !== null && (
                    <span style={{ color: a.expiresIn < 30 ? C.danger : C.warn }}>{a.expiresIn}s</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail + buy/sell */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {!selected ? (
              <div style={{ color: C.muted, textAlign: 'center', marginTop: 60, fontSize: 12 }}>Select a data asset to view pricing.</div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: typeColor[selected.type], fontSize: 16 }}>{typeIcon[selected.type]}</span>
                    <span style={{ fontSize: 13, fontWeight: 'bold', color: C.amber }}>{selected.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 9 }}>
                    <span style={{ color: typeColor[selected.type], letterSpacing: '0.08em' }}>{selected.type.toUpperCase()}</span>
                    <span style={{ color: C.muted }}>{selected.sizeKb} KB</span>
                    {selected.expiresIn !== null && (
                      <span style={{ color: selected.expiresIn < 30 ? C.danger : C.warn }}>EXPIRES IN {selected.expiresIn}s</span>
                    )}
                  </div>
                  <div style={{ color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>{selected.description}</div>
                  {!selected.acquired && (
                    <button onClick={() => acquire(selected)} disabled={credits < selected.acquireCost} style={{
                      padding: '7px 22px', border: `1px solid ${credits >= selected.acquireCost ? C.accent : C.faint}`,
                      borderRadius: 4, cursor: credits >= selected.acquireCost ? 'pointer' : 'not-allowed',
                      background: credits >= selected.acquireCost ? C.accent + '22' : 'none',
                      color: credits >= selected.acquireCost ? C.accent : C.faint,
                      fontFamily: 'inherit', fontSize: 11, marginBottom: 20,
                      transition: 'all 0.15s',
                    }}>
                      ACQUIRE — {selected.acquireCost} cr
                    </button>
                  )}
                </div>

                {/* Buyer pricing table */}
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 10, letterSpacing: '0.1em' }}>BUYER OFFERS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {BUYERS.map(b => {
                    const price = calcPrice(selected, b, marketMod)
                    const canSell = selected.acquired && !selected.sold
                    return (
                      <div key={b.id} style={{
                        padding: '12px 14px',
                        background: C.surf2,
                        border: `1px solid ${C.border}`,
                        borderRadius: 4,
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: b.color, fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{b.label}</div>
                          <div style={{ color: C.muted, fontSize: 9 }}>{b.description}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 'bold', color: C.success, marginBottom: 2 }}>{price} cr</div>
                          {b.logsTransaction && (
                            <div style={{ fontSize: 8, color: C.danger, letterSpacing: '0.08em' }}>LOGGED</div>
                          )}
                        </div>
                        {canSell && (
                          <button onClick={() => sell(selected, b)} style={{
                            padding: '6px 14px', border: `1px solid ${b.color}`,
                            borderRadius: 3, cursor: 'pointer',
                            background: b.color + '22', color: b.color,
                            fontFamily: 'inherit', fontSize: 10, flexShrink: 0,
                            transition: 'all 0.1s',
                          }}>SELL</button>
                        )}
                        {!canSell && selected.acquired && (
                          <span style={{ fontSize: 9, color: C.faint, flexShrink: 0 }}>SOLD</span>
                        )}
                        {!canSell && !selected.acquired && (
                          <span style={{ fontSize: 9, color: C.faint, flexShrink: 0 }}>ACQUIRE FIRST</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Inventory tab */}
      {tab === 'inventory' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {inventory.length === 0 && (
            <div style={{ color: C.muted, textAlign: 'center', marginTop: 60 }}>Inventory empty. Acquire data from the market.</div>
          )}
          {inventory.map(a => (
            <div key={a.id} style={{
              padding: '12px 14px', marginBottom: 8,
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ color: typeColor[a.type], fontSize: 14 }}>{typeIcon[a.type]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, marginBottom: 2 }}>{a.name}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 9 }}>
                  <span style={{ color: typeColor[a.type] }}>{a.type.toUpperCase()}</span>
                  <span style={{ color: C.muted }}>{a.sizeKb} KB</span>
                  {a.expiresIn !== null && (
                    <span style={{ color: a.expiresIn < 30 ? C.danger : C.warn }}>EXPIRES IN {a.expiresIn}s</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {BUYERS.map(b => (
                  <button key={b.id} onClick={() => sell(a, b)} style={{
                    padding: '4px 8px', border: `1px solid ${b.color}`,
                    borderRadius: 3, cursor: 'pointer',
                    background: b.color + '18', color: b.color,
                    fontFamily: 'inherit', fontSize: 9,
                    transition: 'all 0.1s',
                  }}>
                    {b.label.split(' ')[0]} — {calcPrice(a, b, marketMod)} cr
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log tab */}
      {tab === 'log' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
          {log.map((l, i) => (
            <div key={i} style={{
              fontSize: 10, lineHeight: 1.8,
              color: l.includes('EXPIRED') || l.includes('DENY') ? C.danger
                   : l.includes('SELL') && l.includes('LOGGED') ? C.warn
                   : l.includes('SELL') ? C.success
                   : l.includes('ACQUIRE') ? C.accent
                   : C.muted,
              borderBottom: `1px solid ${C.faint}`, paddingBottom: 4, marginBottom: 4,
            }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  )
}
