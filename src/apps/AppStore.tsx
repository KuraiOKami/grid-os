// ── AppStore.tsx ────────────────────────────────────────────────────────────
// GridOS App Store. Apps are gated by tier, rep scores, and access codes.

import { useState } from 'react'
import { useRepStore }    from '@/store/reputationStore'
import { useUnlockStore } from '@/store/unlockStore'

const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  surf2:   '#16161f',
  border:  '#2a2a3a',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

type Tier = 'CORPORATE' | 'FREELANCE' | 'RESTRICTED' | 'UNDERGROUND'

interface AppEntry {
  id:             string
  name:           string
  publisher:      string
  tier:           Tier
  desc:           string
  price:          number
  codeKey?:       string
  minCompliance?: number
  minShadow?:     number
  unlockId?:      string
}

const APPS: AppEntry[] = [
  // ─ CORPORATE ─
  { id: 'gridos-suite', name: 'GridOS Suite',   publisher: 'GridOS Corp',         tier: 'CORPORATE',   desc: 'Official productivity tools — mail, calendar, ledger.',                                                                                         price: 0 },
  { id: 'node',         name: 'NODE',           publisher: 'NODE Network',         tier: 'CORPORATE',   desc: 'The Grid\'s social signal platform. Post, relay, follow. Watch what\'s trending on the Frequency board.',                                       price: 0, unlockId: 'node' },
  { id: 'terminal',     name: 'Terminal',       publisher: 'GridOS Corp',          tier: 'CORPORATE',   desc: 'GridShell (gsh) — command-line access to your local filesystem. ls, cd, cat, mkdir, rm, cp, mv, find, grep, exec and more.',                    price: 0, unlockId: 'terminal' },
  { id: 'files',        name: 'File System',    publisher: 'GridOS Corp',          tier: 'CORPORATE',   desc: 'Graphical file manager. Browse, create, edit, and delete files in your local directory tree. Two-pane layout with inline editor.',                price: 0, unlockId: 'files' },
  { id: 'pulse-reader', name: 'Pulse Reader',   publisher: 'Pulse News Network',   tier: 'CORPORATE',   desc: 'Live feed of the Pulse Network. Sanitised edition.',                                                                                          price: 0 },
  { id: 'gridmart',     name: 'GridMart',       publisher: 'GridOS Commerce',      tier: 'CORPORATE',   desc: 'Official marketplace. All transactions logged.',                                                                                              price: 0 },
  // ─ FREELANCE ─
  { id: 'courier-kit',  name: 'Courier Kit',    publisher: 'Anonymous',            tier: 'FREELANCE',   desc: 'Route management and package tracking for anonymous courier contracts. No logs.',                                                             price: 300 },
  { id: 'voidbay',      name: 'VoidBay',        publisher: 'VoidSyndicate',        tier: 'FREELANCE',   desc: 'Decentralised listing board for off-ledger goods and services.',                                                                              price: 500 },
  // ─ RESTRICTED ─
  { id: 'watch',        name: 'Watch',          publisher: 'GridOS Security',      tier: 'RESTRICTED',  desc: 'Compliance review and citizen surveillance system. Cleared analysts only.',                                price: 0, codeKey: 'WATCH-GRID-01', minCompliance: 0,  unlockId: 'watch' },
  { id: 'archivist',    name: 'Archivist',      publisher: 'Archivist Guild',      tier: 'RESTRICTED',  desc: 'Full access to the civic archive. Includes redacted document browser.',                                    price: 0, codeKey: 'ARC-GUILD-07', minCompliance: 20 },
  // ─ UNDERGROUND ─
  { id: 'shadownet',    name: 'ShadowNet',      publisher: 'Unknown',              tier: 'UNDERGROUND', desc: 'Encrypted peer-to-peer communications. No metadata. No trace.',                                            price: 0, codeKey: 'SHD-??-??',    minShadow: 60 },
  { id: 'rootterm',     name: 'ROOT Terminal',  publisher: 'ROOT BLOOM',           tier: 'UNDERGROUND', desc: 'Direct access to ROOT BLOOM coordination infrastructure.',                                                 price: 0, codeKey: 'ROOT-BLOOM-??', minShadow: 80 },
]

const TIER_ORDER: Tier[] = ['CORPORATE', 'FREELANCE', 'RESTRICTED', 'UNDERGROUND']
const TIER_COLOR: Record<Tier, string> = {
  CORPORATE:   C.accent,
  FREELANCE:   C.success,
  RESTRICTED:  C.warn,
  UNDERGROUND: C.danger,
}
const TIER_DESC: Record<Tier, string> = {
  CORPORATE:   'Official GridOS-approved applications',
  FREELANCE:   'Third-party tools — unverified, functional',
  RESTRICTED:  'Requires access code + rep clearance',
  UNDERGROUND: 'Not officially distributed — enter at your own risk',
}

export default function AppStore() {
  const compliance      = useRepStore(s => s.compliance)
  const shadow          = useRepStore(s => s.shadow)
  const installed       = useUnlockStore(s => s.installed)
  const install         = useUnlockStore(s => s.install)

  const [activeFilter,  setActiveFilter]  = useState<'ALL' | Tier>('ALL')
  const [selectedId,    setSelectedId]    = useState<string>(APPS[0].id)
  const [codeInput,     setCodeInput]     = useState('')
  const [codeError,     setCodeError]     = useState('')
  const [justInstalled, setJustInstalled] = useState<string | null>(null)

  const filters: ('ALL' | Tier)[] = ['ALL', ...TIER_ORDER]
  const visible  = activeFilter === 'ALL' ? APPS : APPS.filter(a => a.tier === activeFilter)
  const selected = APPS.find(a => a.id === selectedId)!
  const isInstalled = installed.includes(selected.id)

  function meetsRep(app: AppEntry) {
    if ((app.minCompliance ?? 0) > compliance) return false
    if ((app.minShadow    ?? 0) > shadow)      return false
    return true
  }
  function codeValid(app: AppEntry) {
    if (!app.codeKey) return true
    return codeInput.trim().toUpperCase() === app.codeKey.toUpperCase()
  }
  function canInstall(app: AppEntry) {
    if (isInstalled)            return false
    if (!meetsRep(app))         return false
    if (app.price > 0)          return false
    if (app.codeKey && !codeValid(app)) return false
    return true
  }
  function handleInstall() {
    if (!canInstall(selected)) {
      if (selected.codeKey && !codeValid(selected)) setCodeError('Invalid access code.')
      return
    }
    install(selected.id)
    if (selected.unlockId) install(selected.unlockId)
    setJustInstalled(selected.id)
    setCodeError('')
    setTimeout(() => setJustInstalled(null), 2500)
  }
  function lockReason(app: AppEntry) {
    if (isInstalled) return ''
    if (app.price > 0) return `Price \u20a2 ${app.price} (payment coming soon)`
    const parts: string[] = []
    if ((app.minCompliance ?? 0) > compliance) parts.push(`GRID \u2265 ${app.minCompliance} (yours: ${compliance})`)
    if ((app.minShadow    ?? 0) > shadow)      parts.push(`SHADOW \u2265 ${app.minShadow} (yours: ${shadow})`)
    if (app.codeKey) parts.push('Access code required')
    return parts.join('  \u00b7  ')
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px 8px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0,
      }}>
        <div style={{ fontSize: 14, color: C.violet, fontWeight: 'bold' }}>APP STORE</div>
        <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
          GridOS official distribution — and beyond
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            padding: '7px 14px', fontSize: 10, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: '0.08em',
            borderBottom: activeFilter === f
              ? `2px solid ${f === 'ALL' ? C.violet : TIER_COLOR[f as Tier]}`
              : '2px solid transparent',
            background: activeFilter === f ? C.surf2 : 'none',
            color: activeFilter === f ? (f === 'ALL' ? C.violet : TIER_COLOR[f as Tier]) : C.muted,
            transition: 'all 0.12s',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* List */}
        <div style={{ width: 240, borderRight: `1px solid ${C.border}`, overflow: 'auto', flexShrink: 0 }}>
          {visible.map(app => {
            const tc = TIER_COLOR[app.tier]
            const isActive = app.id === selectedId
            const inst = installed.includes(app.id)
            return (
              <button key={app.id}
                onClick={() => { setSelectedId(app.id); setCodeInput(''); setCodeError('') }}
                style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  padding: '10px 12px', background: isActive ? C.surf2 : 'none',
                  borderBottom: `1px solid ${C.border}`,
                  borderLeft: isActive ? `2px solid ${tc}` : '2px solid transparent',
                  fontFamily: 'inherit', transition: 'background 0.12s',
                }}>
                <div style={{ fontSize: 9, color: tc, letterSpacing: '0.1em', marginBottom: 3 }}>{app.tier}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: tc, fontWeight: 'bold' }}>[{app.name[0]}]</span>
                  <span style={{ fontSize: 11, color: isActive ? C.text : C.muted }}>{app.name}</span>
                  {inst && <span style={{ fontSize: 9, color: C.success, marginLeft: 'auto' }}>✓</span>}
                </div>
                <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{app.publisher}</div>
              </button>
            )
          })}
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 9, color: TIER_COLOR[selected.tier], letterSpacing: '0.12em' }}>{selected.tier}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 8,
              border: `1px solid ${TIER_COLOR[selected.tier]}44`, background: C.surf2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: TIER_COLOR[selected.tier], fontWeight: 'bold',
            }}>
              [{selected.name[0]}]
            </div>
            <div>
              <div style={{ fontSize: 15, color: C.text, fontWeight: 'bold' }}>{selected.name}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{selected.publisher}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{selected.desc}</div>
          <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em' }}>{TIER_DESC[selected.tier]}</div>
          <div style={{ height: 1, background: C.border }} />

          <div>
            <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em', marginBottom: 8 }}>REQUIREMENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Req label="Price"      value={selected.price > 0 ? `\u20a2 ${selected.price}` : 'Free'} ok={selected.price === 0} />
              {(selected.minCompliance ?? 0) > 0 && (
                <Req label="GRID rep"   value={`\u2265 ${selected.minCompliance}`} ok={compliance >= (selected.minCompliance ?? 0)} current={compliance} />
              )}
              {(selected.minShadow ?? 0) > 0 && (
                <Req label="SHADOW rep" value={`\u2265 ${selected.minShadow}`}     ok={shadow >= (selected.minShadow ?? 0)}      current={shadow} />
              )}
              {selected.codeKey && <Req label="Access code" value="required" ok={codeValid(selected)} />}
            </div>
          </div>

          {selected.codeKey && !isInstalled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em' }}>ENTER ACCESS CODE</div>
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value); setCodeError('') }}
                placeholder="XXXX-XXXX-XX"
                style={{
                  background: C.surface,
                  border: `1px solid ${codeError ? C.danger : C.border}`,
                  borderRadius: 4, padding: '7px 10px', color: C.accent,
                  fontSize: 12, fontFamily: 'inherit', outline: 'none', letterSpacing: '0.1em',
                }}
              />
              {codeError && <div style={{ fontSize: 10, color: C.danger }}>{codeError}</div>}
            </div>
          )}

          {isInstalled ? (
            <div style={{ padding: '10px 0', fontSize: 12, color: C.success, letterSpacing: '0.08em' }}>✓ INSTALLED</div>
          ) : justInstalled === selected.id ? (
            <div style={{ padding: '10px 0', fontSize: 12, color: C.success, letterSpacing: '0.08em' }}>✓ INSTALLING...</div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={!canInstall(selected)}
              style={{
                padding: '10px 0', borderRadius: 6, fontSize: 12,
                fontWeight: 'bold', fontFamily: 'inherit', letterSpacing: '0.08em',
                cursor: canInstall(selected) ? 'pointer' : 'default',
                border: `1px solid ${canInstall(selected) ? C.success + '88' : C.faint}`,
                background: canInstall(selected) ? `${C.success}22` : 'none',
                color: canInstall(selected) ? C.success : C.faint,
                transition: 'all 0.15s',
              }}>
              {canInstall(selected) ? 'INSTALL' : `LOCKED  —  ${lockReason(selected)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Req({ label, value, ok, current }:
  { label: string; value: string; ok: boolean; current?: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
      <span>{label}</span>
      <span style={{ color: ok ? C.success : C.danger }}>
        {ok ? '\u2713 ' : '\u2717 '}{value}
        {current !== undefined && !ok && ` (you: ${current})`}
      </span>
    </div>
  )
}
