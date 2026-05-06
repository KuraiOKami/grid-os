import { useEffect, useState } from 'react'
import { getJobs, acceptJob, subscribe, type Job } from '@/store/jobStore'
import { useWalletStore } from '@/store/walletStore'
import { useCareerStore } from '@/store/careerStore'
import { useRepStore } from '@/store/reputationStore'
import { useInventoryStore } from '@/store/inventoryStore'
import { CAREERS, type CareerDef } from '@/data/careers'
import { GRIDMART_ITEMS, type ShopItem } from '@/data/shopItems'

const C = {
  bg:       '#090b12',
  surface:  '#0d111a',
  surface2: '#111827',
  border:   '#202636',
  text:     '#c8c8d8',
  muted:    '#6b6b80',
  faint:    '#3a3a4a',
  accent:   '#00e5ff',
  success:  '#7bd389',
  warn:     '#ffd166',
  danger:   '#ff6b6b',
  purple:   '#d6a2ff',
}

type Tab = 'careers' | 'contracts' | 'shop'

export default function JobBoard() {
  const [tab, setTab]       = useState<Tab>('careers')
  const [jobs, setJobs]     = useState<Job[]>(getJobs())
  useEffect(() => subscribe(setJobs), [])

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      background:C.bg, color:C.text, fontFamily:"'JetBrains Mono', monospace",
      overflow:'hidden' }}>

      {/* header */}
      <div style={{ padding:'14px 18px 0', background:'#0f1320',
        borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between',
          marginBottom:12 }}>
          <span style={{ fontSize:15, color:C.accent, fontWeight:'bold' }}>Job Board</span>
          <WalletBadge />
        </div>
        <TabBar active={tab} onChange={setTab} pendingCount={jobs.filter(j=>!j.accepted).length} />
      </div>

      {/* body */}
      <div style={{ flex:1, overflow:'auto' }}>
        {tab === 'careers'   && <CareersTab />}
        {tab === 'contracts' && <ContractsTab jobs={jobs} />}
        {tab === 'shop'      && <ShopTab />}
      </div>
    </div>
  )
}

// ── WalletBadge ──────────────────────────────────────────────────────────────
function WalletBadge() {
  const balance = useWalletStore(s => s.balance)
  return (
    <span style={{ fontSize:12, color:C.success, letterSpacing:'0.04em' }}>
      ₳ {balance.toLocaleString()}
    </span>
  )
}

// ── TabBar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, pendingCount }:
  { active:Tab; onChange:(t:Tab)=>void; pendingCount:number }) {
  const tabs: { key:Tab; label:string; badge?:number }[] = [
    { key:'careers',   label:'CAREERS' },
    { key:'contracts', label:'CONTRACTS', badge: pendingCount || undefined },
    { key:'shop',      label:'GRIDMART' },
  ]
  return (
    <div style={{ display:'flex', gap:0 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding:'8px 16px', fontSize:11, letterSpacing:'0.08em',
          background:'none', border:'none', borderBottom: active === t.key
            ? `2px solid ${C.accent}` : '2px solid transparent',
          color: active === t.key ? C.accent : C.muted,
          cursor:'pointer', fontFamily:'inherit', position:'relative',
          transition:'color 0.15s',
        }}>
          {t.label}
          {t.badge ? (
            <span style={{ marginLeft:6, background:C.warn, color:'#0a0a0f',
              borderRadius:999, padding:'1px 5px', fontSize:9, fontWeight:'bold' }}>
              {t.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

// ── CAREERS TAB ──────────────────────────────────────────────────────────────
function CareersTab() {
  const [selected, setSelected] = useState<CareerKey | null>(null)
  type CareerKey = 'hacker'|'auditor'|'courier'|'broker'|'archivist'

  if (selected) {
    const def = CAREERS.find(c => c.key === selected)!
    return <CareerDetail def={def} onBack={() => setSelected(null)} />
  }

  return (
    <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:11, color:C.muted, marginBottom:4, lineHeight:1.6 }}>
        Career paths level up through use. Play any combination — specialise or stay fluid.
      </div>
      {CAREERS.map(c => <CareerCard key={c.key} def={c} onSelect={() => setSelected(c.key as CareerKey)} />)}
    </div>
  )
}

function CareerCard({ def, onSelect }: { def:CareerDef; onSelect:()=>void }) {
  const progress = useCareerStore(s => s.careers[def.key])
  const xpPct = ((progress.xp % 100) / 100) * 100

  return (
    <button onClick={onSelect} style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
      padding:'12px 14px', cursor:'pointer', fontFamily:'inherit',
      textAlign:'left', color:C.text, transition:'border-color 0.15s',
      display:'flex', flexDirection:'column', gap:8,
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = def.color + '66')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:18, color:def.color, width:28, textAlign:'center',
          flexShrink:0 }}>{def.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, color:'#eef3ff' }}>{def.name}</span>
            <span style={{ fontSize:11, color:def.color }}>Lv {progress.level}</span>
          </div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{def.tagline}</div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ height:3, background:C.faint, borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${xpPct}%`, background:def.color,
          borderRadius:2, transition:'width 0.4s ease' }} />
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.faint }}>
        <span>{def.faction}</span>
        <span>{def.repBias}</span>
      </div>
    </button>
  )
}

function CareerDetail({ def, onBack }: { def:CareerDef; onBack:()=>void }) {
  const progress = useCareerStore(s => s.careers[def.key])
  const xpToNext = 100 - (progress.xp % 100)
  const xpPct = ((progress.xp % 100) / 100) * 100

  return (
    <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
      <button onClick={onBack} style={{
        background:'none', border:'none', color:C.muted, cursor:'pointer',
        fontFamily:'inherit', fontSize:11, textAlign:'left', padding:0,
      }}>
        ← back to careers
      </button>

      {/* Header */}
      <div style={{ background:C.surface, border:`1px solid ${def.color}44`,
        borderRadius:10, padding:'16px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <span style={{ fontSize:28, color:def.color }}>{def.icon}</span>
          <div>
            <div style={{ fontSize:16, color:'#eef3ff' }}>{def.name}</div>
            <div style={{ fontSize:11, color:C.muted }}>{def.faction} · {def.payModel}</div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontSize:20, color:def.color }}>Lv {progress.level}</div>
            <div style={{ fontSize:10, color:C.muted }}>{xpToNext} XP to next</div>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ height:4, background:C.faint, borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${xpPct}%`, background:def.color,
            borderRadius:2, transition:'width 0.4s ease' }} />
        </div>
      </div>

      {/* Tutorial */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:10, padding:'14px 16px' }}>
        <div style={{ fontSize:10, letterSpacing:'0.1em', color:def.color,
          marginBottom:10 }}>// GETTING STARTED</div>
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.7, marginBottom:14,
          fontStyle:'italic', borderLeft:`2px solid ${def.color}44`,
          paddingLeft:10 }}>
          {def.tutorial.intro}
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {def.tutorial.steps.map((step, i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ color:def.color, fontSize:10, flexShrink:0, marginTop:2,
                fontFamily:'inherit' }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ fontSize:12, color:C.text, lineHeight:1.6 }}>
                {step.replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rep + pay info */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`,
        borderRadius:10, padding:'12px 16px', display:'flex',
        flexDirection:'column', gap:8 }}>
        <Row label="Pay model" value={def.payModel} color={C.success} />
        <Row label="Rep bias"  value={def.repBias}   color={C.warn} />
        <Row label="Faction"   value={def.faction}   color={C.muted} />
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label:string; value:string; color:string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between',
      fontSize:11, gap:12 }}>
      <span style={{ color:C.faint }}>{label}</span>
      <span style={{ color, textAlign:'right' }}>{value}</span>
    </div>
  )
}

// ── CONTRACTS TAB ────────────────────────────────────────────────────────────
function ContractsTab({ jobs }: { jobs:Job[] }) {
  const pending  = jobs.filter(j => !j.accepted)
  const accepted = jobs.filter(j =>  j.accepted)

  return (
    <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
      {jobs.length === 0 && (
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:10,
          color:C.muted, fontSize:12, paddingTop:60 }}>
          <span style={{ fontSize:26, color:C.faint }}>[ ]</span>
          <span>No contracts found.</span>
          <span style={{ color:C.faint, fontSize:11 }}>
            Browse the web — contracts surface on certain pages.
          </span>
        </div>
      )}
      {pending.length > 0 && (
        <>
          <SectionLabel label="OPEN" color={C.warn} />
          {pending.map(j => <JobCard key={j.id} job={j} onAccept={() => acceptJob(j.id)} />)}
        </>
      )}
      {accepted.length > 0 && (
        <>
          <SectionLabel label="ACCEPTED" color={C.success} />
          {accepted.map(j => <JobCard key={j.id} job={j} onAccept={() => {}} />)}
        </>
      )}
    </div>
  )
}

function SectionLabel({ label, color }: { label:string; color:string }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'0.12em', color, marginTop:4, marginBottom:2 }}>
      — {label} —
    </div>
  )
}

function JobCard({ job, onAccept }: { job:Job; onAccept:()=>void }) {
  const corpColor = job.corp === 'GridOS' ? C.accent
    : job.corp === 'Anonymous' || job.corp.toLowerCase().includes('anon') ? C.danger
    : C.warn
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:10, padding:'12px 14px', display:'flex',
      flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'flex-start',
        justifyContent:'space-between', gap:10 }}>
        <div>
          <div style={{ fontSize:13, color:'#eef3ff', marginBottom:4 }}>{job.title}</div>
          <div style={{ fontSize:11, color:corpColor }}>{job.corp}</div>
        </div>
        <div style={{ fontSize:12, color:C.success, whiteSpace:'nowrap' }}>{job.pay}</div>
      </div>
      <div style={{ fontSize:10, color:C.faint }}>source: {job.source}</div>
      {!job.accepted ? (
        <button onClick={onAccept} style={{
          alignSelf:'flex-end', padding:'7px 14px', borderRadius:6, fontSize:11,
          border:`1px solid ${C.success}66`, background:`${C.success}12`,
          color:C.success, cursor:'pointer', fontFamily:'inherit' }}>
          Accept
        </button>
      ) : (
        <div style={{ alignSelf:'flex-end', fontSize:11, color:C.success,
          padding:'7px 14px' }}>✓ Accepted</div>
      )}
    </div>
  )
}

// ── SHOP TAB (GridMart) ───────────────────────────────────────────────────────
function ShopTab() {
  const balance  = useWalletStore(s => s.balance)
  const debit    = useWalletStore(s => s.debit)
  const addItem  = useInventoryStore(s => s.addItem)
  const hasItem  = useInventoryStore(s => s.hasItem)
  const shadow   = useRepStore(s => s.shadow)

  const [filter, setFilter] = useState<'all'|'legal'|'underground'>('all')
  const [bought, setBought] = useState<string | null>(null)

  const visible = GRIDMART_ITEMS.filter(item => {
    if (filter === 'legal'       && item.tier !== 'legal')       return false
    if (filter === 'underground' && item.tier !== 'underground') return false
    if (item.shadowRequired && shadow < item.shadowRequired)    return false
    return true
  })

  function buy(item: ShopItem) {
    if (balance < item.cost) return
    const ok = debit(item.cost, `Purchased: ${item.name}`)
    if (!ok) return
    addItem(item)
    setBought(item.id)
    setTimeout(() => setBought(null), 2000)
  }

  return (
    <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
      {/* filter bar */}
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {(['all','legal','underground'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'4px 10px', borderRadius:999, fontSize:10,
            letterSpacing:'0.06em', fontFamily:'inherit', cursor:'pointer',
            border:`1px solid ${filter===f ? C.accent : C.border}`,
            background: filter===f ? `${C.accent}18` : 'none',
            color: filter===f ? C.accent : C.muted,
            textTransform:'uppercase',
          }}>
            {f === 'underground' ? '⚠ VOID' : f.toUpperCase()}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:11, color:C.success }}>₳ {balance.toLocaleString()}</span>
      </div>

      {filter === 'underground' && shadow < 30 && (
        <div style={{ background:`${C.danger}10`, border:`1px solid ${C.danger}44`,
          borderRadius:8, padding:'10px 12px', fontSize:11, color:C.danger }}>
          VoidBay underground listings require Shadow ≥ 30. Raise your reputation in the underground first.
        </div>
      )}

      {visible.length === 0 && (
        <div style={{ paddingTop:40, textAlign:'center', color:C.muted, fontSize:12 }}>
          No items available at this clearance level.
        </div>
      )}

      {visible.map(item => (
        <ShopCard
          key={item.id}
          item={item}
          canAfford={balance >= item.cost}
          alreadyOwned={item.uses === null && hasItem(item.id)}
          justBought={bought === item.id}
          onBuy={() => buy(item)}
        />
      ))}

      <div style={{ paddingTop:8, fontSize:10, color:C.faint, textAlign:'center',
        borderTop:`1px solid ${C.border}`, marginTop:4 }}>
        VoidBay player listings coming soon — sell your own items here.
      </div>
    </div>
  )
}

function ShopCard({ item, canAfford, alreadyOwned, justBought, onBuy }: {
  item: ShopItem
  canAfford: boolean
  alreadyOwned: boolean
  justBought: boolean
  onBuy: () => void
}) {
  const tierColor = item.tier === 'underground' ? C.danger : C.accent
  const disabled  = alreadyOwned || justBought

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`,
      borderRadius:10, padding:'12px 14px', display:'flex',
      flexDirection:'column', gap:8 }}>

      <div style={{ display:'flex', alignItems:'flex-start',
        justifyContent:'space-between', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:12, color:tierColor, border:`1px solid ${tierColor}44`,
              borderRadius:4, padding:'1px 6px', fontSize:9,
              letterSpacing:'0.08em' }}>
              {item.tier === 'underground' ? '⚠ VOID' : 'LEGAL'}
            </span>
            {item.relatedCareer && (
              <span style={{ fontSize:9, color:C.faint, letterSpacing:'0.06em' }}>
                {item.relatedCareer.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize:13, color:'#eef3ff' }}>{item.name}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:3, lineHeight:1.5 }}>
            {item.description}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:13, color:C.success }}>₳ {item.cost.toLocaleString()}</div>
          <div style={{ fontSize:10, color:C.faint, marginTop:2 }}>
            {item.uses === null ? 'permanent' : `${item.uses} use${item.uses>1?'s':''}`}
          </div>
        </div>
      </div>

      <div style={{ fontSize:11, color:C.warn, borderLeft:`2px solid ${C.warn}44`,
        paddingLeft:8 }}>
        {item.effect}
      </div>

      <button
        onClick={onBuy}
        disabled={disabled || !canAfford}
        style={{
          alignSelf:'flex-end', padding:'7px 14px', borderRadius:6, fontSize:11,
          fontFamily:'inherit', cursor: disabled || !canAfford ? 'not-allowed' : 'pointer',
          border: justBought ? `1px solid ${C.success}66`
            : alreadyOwned   ? `1px solid ${C.faint}`
            : canAfford      ? `1px solid ${C.accent}66`
            :                  `1px solid ${C.faint}`,
          background: justBought ? `${C.success}18`
            : alreadyOwned   ? 'none'
            : canAfford      ? `${C.accent}12`
            :                  'none',
          color: justBought ? C.success
            : alreadyOwned   ? C.faint
            : canAfford      ? C.accent
            :                  C.faint,
          opacity: !canAfford && !alreadyOwned ? 0.5 : 1,
        }}>
        {justBought ? '✓ Purchased' : alreadyOwned ? 'Owned' : !canAfford ? 'Insufficient ₳' : 'Buy'}
      </button>
    </div>
  )
}
