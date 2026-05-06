// ── AppStore.tsx ────────────────────────────────────────────────────────────
// The official GridOS app marketplace.
// Corporate apps are always visible. Special/underground apps
// require an unlock code delivered via email or job completion.
//
// Installing an app fires useUnlockStore.unlock(appKey)
// which OSShell reads to add the icon to the desktop.

import { useState } from 'react'
import { useUnlockStore } from '@/store/unlockStore'
import { useRepStore } from '@/store/reputationStore'

const C = {
  bg:      '#090b12',
  surface: '#0d111a',
  surf2:   '#111520',
  border:  '#202636',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

type AppTier = 'corporate' | 'freelance' | 'restricted' | 'underground'

interface AppListing {
  id: string
  name: string
  publisher: string
  description: string
  tier: AppTier
  unlockKey: string       // key written to unlockStore on install
  accessCode?: string     // if set, player must enter this code to install
  requireCompliance?: number
  requireShadow?: number
  price: string           // display only for now
  icon: string
}

const TIER_COLOR: Record<AppTier, string> = {
  corporate:   C.accent,
  freelance:   C.success,
  restricted:  C.warn,
  underground: C.violet,
}

const TIER_LABEL: Record<AppTier, string> = {
  corporate:   'CORPORATE',
  freelance:   'FREELANCE',
  restricted:  'RESTRICTED',
  underground: 'UNDERGROUND',
}

const APPS: AppListing[] = [
  // ─ Corporate tier ────────────────────────────────────────────────────
  {
    id: 'gridos-suite',
    name: 'GridOS Suite',
    publisher: 'GridOS Corp',
    description: 'Standard productivity tools. File manager, calendar, compliance tracker. Pre-installed on all registered nodes.',
    tier: 'corporate',
    unlockKey: 'app_gridos_suite',
    price: 'Free — bundled',
    icon: '[G]',
  },
  {
    id: 'pulse-reader',
    name: 'Pulse Reader',
    publisher: 'Pulse News Network',
    description: 'Certified news aggregator. GridOS-approved sources only. Deviation alerts enabled.',
    tier: 'corporate',
    unlockKey: 'app_pulse_reader',
    price: 'Free',
    icon: '[P]',
  },
  {
    id: 'gridmart-client',
    name: 'GridMart',
    publisher: 'GridOS Commerce',
    description: 'Official marketplace. Buy hardware, software licenses, and tools. Loyalty score affects pricing.',
    tier: 'corporate',
    unlockKey: 'app_gridmart',
    price: 'Free',
    icon: '[M]',
  },
  // ─ Freelance tier ────────────────────────────────────────────────────
  {
    id: 'courier-kit',
    name: 'Courier Kit',
    publisher: 'Anonymous',
    description: 'Route management and package tracking for anonymous courier contracts. No logs. No receipts.',
    tier: 'freelance',
    unlockKey: 'app_courier_kit',
    price: '₳ 300',
    icon: '[C]',
  },
  {
    id: 'voidbay-client',
    name: 'VoidBay',
    publisher: 'VoidSyndicate',
    description: 'Grey market auction board. Buy and sell outside GridOS commerce rails. Prices fluctuate. Identity optional.',
    tier: 'freelance',
    unlockKey: 'app_voidbay',
    price: '₳ 500',
    icon: '[V]',
  },
  // ─ Restricted tier (need access code from email) ──────────────────
  {
    id: 'watch',
    name: 'Watch',
    publisher: 'GridOS Compliance Division',
    description: 'Citizen review and compliance analysis tool. Authorised analysts only. Access code required.',
    tier: 'restricted',
    unlockKey: 'app_watch',
    accessCode: 'WATCH-GRID-01',
    requireCompliance: 40,
    price: 'Contract-issued',
    icon: '[■]',
  },
  {
    id: 'node-scanner',
    name: 'NodeScan',
    publisher: 'GridOS Security',
    description: 'Network topology scanner. Maps active nodes and flags suspicious traffic. Security clearance required.',
    tier: 'restricted',
    unlockKey: 'app_nodescan',
    accessCode: 'SCAN-SEC-07',
    requireCompliance: 60,
    price: 'Contract-issued',
    icon: '[~]',
  },
  // ─ Underground tier (shadow rep + code) ──────────────────────────
  {
    id: 'ghost-terminal',
    name: 'Ghost Terminal',
    publisher: '[REDACTED]',
    description: 'Unlogged terminal session. Commands executed here leave no trace in GridOS activity records.',
    tier: 'underground',
    unlockKey: 'app_ghost_terminal',
    accessCode: 'GHOST-NULL-00',
    requireShadow: 60,
    price: 'Unknown',
    icon: '[x]',
  },
  {
    id: 'archivist-viewer',
    name: 'Archive Viewer',
    publisher: 'Archivist Guild',
    description: 'Decrypts and displays protected Civic Archive documents. For those with the right access and the right friends.',
    tier: 'underground',
    unlockKey: 'app_archive_viewer',
    accessCode: 'ARC-BLOOM-33',
    requireShadow: 40,
    price: 'Earned',
    icon: '[A]',
  },
]

export default function AppStore() {
  const unlock       = useUnlockStore(s => s.unlock)
  const hasUnlock    = useUnlockStore(s => s.has)
  const compliance   = useRepStore(s => s.compliance)
  const shadow       = useRepStore(s => s.shadow)

  const [selected, setSelected] = useState<AppListing | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')
  const [filter, setFilter]  = useState<AppTier | 'all'>('all')

  const visible = APPS.filter(a => filter === 'all' || a.tier === filter)

  function isInstalled(app: AppListing) {
    return hasUnlock(app.unlockKey)
  }

  function meetsRepReq(app: AppListing) {
    if (app.requireCompliance && compliance < app.requireCompliance) return false
    if (app.requireShadow     && shadow     < app.requireShadow)     return false
    return true
  }

  function tryInstall(app: AppListing) {
    if (!meetsRepReq(app)) {
      setCodeError('Reputation requirement not met.')
      return
    }
    if (app.accessCode) {
      if (codeInput.trim().toUpperCase() !== app.accessCode) {
        setCodeError('Invalid access code.')
        return
      }
    }
    unlock(app.unlockKey)
    setCodeError('')
    setCodeInput('')
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', monospace",
      overflow: 'hidden', fontSize: 12 }}>

      {/* Header */}
      <div style={{ padding: '12px 18px 10px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0 }}>
        <div style={{ fontSize: 14, color: C.accent, fontWeight: 'bold', marginBottom: 2 }}>
          APP STORE
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>
          GridOS official distribution — and beyond
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 14px',
        borderBottom: `1px solid ${C.border}`, background: C.surface,
        flexShrink: 0 }}>
        {(['all', 'corporate', 'freelance', 'restricted', 'underground'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '3px 10px', fontSize: 10, borderRadius: 4,
              border: `1px solid ${filter === f
                ? (f === 'all' ? C.accent : TIER_COLOR[f as AppTier])
                : C.border}`,
              background: filter === f ? 'none' : 'none',
              color: filter === f
                ? (f === 'all' ? C.accent : TIER_COLOR[f as AppTier])
                : C.muted,
              cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '0.06em' }}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Split view */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* App list */}
        <div style={{ width: 240, borderRight: `1px solid ${C.border}`,
          overflow: 'auto', flexShrink: 0 }}>
          {visible.map(app => {
            const installed  = isInstalled(app)
            const meetsRep   = meetsRepReq(app)
            const tierColor  = TIER_COLOR[app.tier]
            const isActive   = selected?.id === app.id
            return (
              <button key={app.id} onClick={() => { setSelected(app); setCodeInput(''); setCodeError('') }}
                style={{ width: '100%', textAlign: 'left',
                  background: isActive ? C.surf2 : 'none',
                  border: 'none', borderBottom: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${isActive ? tierColor : 'transparent'}`,
                  padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit',
                  opacity: (!meetsRep && !installed) ? 0.5 : 1,
                  transition: 'background 0.12s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: tierColor,
                    letterSpacing: '0.06em' }}>
                    {TIER_LABEL[app.tier]}
                  </span>
                  {installed && (
                    <span style={{ fontSize: 9, color: C.success }}>✓ installed</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: isActive ? C.text : C.muted,
                  fontWeight: isActive ? 'bold' : 'normal' }}>
                  {app.icon} {app.name}
                </div>
                <div style={{ fontSize: 9, color: C.faint, marginTop: 2 }}>
                  {app.publisher}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail pane */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {selected ? (
            <AppDetail
              app={selected}
              installed={isInstalled(selected)}
              meetsRep={meetsRepReq(selected)}
              compliance={compliance}
              shadow={shadow}
              codeInput={codeInput}
              codeError={codeError}
              onCodeChange={v => { setCodeInput(v); setCodeError('') }}
              onInstall={() => tryInstall(selected)}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 8,
              color: C.faint }}>
              <span style={{ fontSize: 22 }}>[+]</span>
              <span style={{ fontSize: 11 }}>Select an app</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── App detail pane ───────────────────────────────────────────────────────────
function AppDetail({
  app, installed, meetsRep, compliance, shadow,
  codeInput, codeError, onCodeChange, onInstall
}: {
  app: AppListing
  installed: boolean
  meetsRep: boolean
  compliance: number
  shadow: number
  codeInput: string
  codeError: string
  onCodeChange: (v: string) => void
  onInstall: () => void
}) {
  const tierColor = TIER_COLOR[app.tier]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* App header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 14 }}>
        <div style={{ fontSize: 10, color: tierColor, letterSpacing: '0.1em',
          marginBottom: 6 }}>
          {TIER_LABEL[app.tier]}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 20, color: tierColor }}>{app.icon}</span>
          <div>
            <div style={{ fontSize: 14, color: C.text }}>{app.name}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{app.publisher}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          {app.description}
        </div>
      </div>

      {/* Requirements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em' }}>REQUIREMENTS</div>
        <ReqRow label="Price" value={app.price} met />
        {app.requireCompliance && (
          <ReqRow
            label={`GRID ≥ ${app.requireCompliance}`}
            value={`current: ${compliance}`}
            met={compliance >= app.requireCompliance}
          />
        )}
        {app.requireShadow && (
          <ReqRow
            label={`SHADOW ≥ ${app.requireShadow}`}
            value={`current: ${shadow}`}
            met={shadow >= app.requireShadow}
          />
        )}
        {app.accessCode && (
          <ReqRow label="Access code" value="required" met={false} />
        )}
      </div>

      {/* Install section */}
      {installed ? (
        <div style={{ padding: '10px 14px', borderRadius: 6,
          border: `1px solid ${C.success}44`, background: `${C.success}0f`,
          fontSize: 11, color: C.success }}>
          ✓ Installed
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {app.accessCode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.08em' }}>
                ACCESS CODE
              </div>
              <input
                value={codeInput}
                onChange={e => onCodeChange(e.target.value)}
                placeholder="Enter code..."
                style={{ background: C.surface, border: `1px solid ${codeError ? C.danger : C.border}`,
                  borderRadius: 4, padding: '6px 10px', color: C.text,
                  fontFamily: 'inherit', fontSize: 11, outline: 'none' }}
              />
              {codeError && (
                <div style={{ fontSize: 10, color: C.danger }}>{codeError}</div>
              )}
            </div>
          )}
          <button onClick={onInstall}
            disabled={!meetsRep}
            style={{ padding: '9px 0', borderRadius: 6, fontSize: 12,
              fontWeight: 'bold', fontFamily: 'inherit', letterSpacing: '0.08em',
              border: `1px solid ${meetsRep ? tierColor + '88' : C.faint}`,
              background: meetsRep ? `${tierColor}18` : 'none',
              color: meetsRep ? tierColor : C.faint,
              cursor: meetsRep ? 'pointer' : 'default',
              transition: 'all 0.2s' }}>
            {meetsRep ? 'INSTALL' : 'LOCKED'}
          </button>
        </div>
      )}
    </div>
  )
}

function ReqRow({ label, value, met }: { label: string; value: string; met: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between',
      fontSize: 10, padding: '3px 0', borderBottom: `1px solid ${C.faint}22` }}>
      <span style={{ color: met ? C.muted : C.danger }}>{label}</span>
      <span style={{ color: met ? C.success : C.warn }}>{value}</span>
    </div>
  )
}
