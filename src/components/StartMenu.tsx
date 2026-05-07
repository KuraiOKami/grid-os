// ── StartMenu.tsx ────────────────────────────────────────────────────────────
// Slides up from the taskbar GRID button.
// Sections: citizen profile, rep bars, installed apps, quick actions.
// Closes on outside click or Escape.

import { useEffect, useRef } from 'react'
import { useRepStore }    from '@/store/reputationStore'
import { useMailStore }   from '@/store/mailStore'
import { useUnlockStore } from '@/store/unlockStore'
import { useOSStore }     from '@/store/osStore'
import SettingsApp    from '@/apps/SettingsApp'
import ConnectionsApp from '@/apps/ConnectionsApp'
import CitizenIDApp   from '@/apps/CitizenIDApp'

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
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

const ALL_APPS = [
  { id: 'browser',  title: 'GridBrowser', icon: 'WWW', accent: C.accent  },
  { id: 'mail',     title: 'Mail',        icon: '@',   accent: C.accent  },
  { id: 'jobs',     title: 'Job Board',   icon: '[ ]', accent: C.success },
  { id: 'appstore', title: 'App Store',   icon: '[+]', accent: C.violet  },
  { id: 'watch',    title: 'Watch',       icon: '[W]', accent: C.danger  },
  { id: 'terminal', title: 'Terminal',    icon: '>_',  accent: C.accent  },
  { id: 'files',    title: 'File System', icon: '/fs', accent: C.accent  },
]

const QUICK_ACTIONS = [
  { label: 'Sleep',    icon: '◔', action: 'sleep'    },
  { label: 'Restart',  icon: '↺', action: 'restart'  },
  { label: 'Shutdown', icon: '⏻', action: 'shutdown' },
]

const SYSTEM_ITEMS = [
  { id: 'settings'    as const, label: 'Settings',   icon: '[=]' },
  { id: 'connections' as const, label: 'Connections', icon: '[~]' },
  { id: 'citizen-id'  as const, label: 'Citizen ID',  icon: '[i]' },
]

interface Props {
  onClose:   () => void
  onOpenApp: (id: string) => void
}

export default function StartMenu({ onClose, onOpenApp }: Props) {
  const compliance  = useRepStore(s => s.compliance)
  const shadow      = useRepStore(s => s.shadow)
  const mails       = useMailStore(s => s.mails)
  const installed   = useUnlockStore(s => s.installed)
  const openPanel   = useOSStore(s => s.openSystemPanel)
  const panelRef    = useRef<HTMLDivElement>(null)

  const unread      = mails.filter(m => m.unread).length
  const visibleApps = ALL_APPS.filter(a => installed.includes(a.id))

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 80)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  function handleAppClick(id: string) {
    onOpenApp(id)
    onClose()
  }

  function handleSysClick(panelId: 'settings' | 'connections' | 'citizen-id') {
    // Inline content map — avoids dynamic require & keeps TS happy
    const CONTENT_MAP = {
      'settings':    <SettingsApp />,
      'connections': <ConnectionsApp />,
      'citizen-id':  <CitizenIDApp />,
    }
    const PANEL_DEFAULTS = {
      'settings':    { title: 'Settings',    icon: '[=]', width: 480, height: 520 },
      'connections': { title: 'Connections', icon: '[~]', width: 540, height: 500 },
      'citizen-id':  { title: 'Citizen ID',  icon: '[i]', width: 400, height: 560 },
    }
    const { windows, topZ, desktopRef, closeWindow } = useOSStore.getState()
    const existing = windows.find(w => w.id === `sys-${panelId}`)
    const newZ = topZ + 1

    if (existing) {
      useOSStore.setState(state => ({
        topZ: newZ,
        windows: state.windows.map(w =>
          w.id === existing.id
            ? { ...w, focused: true, minimized: false, zIndex: newZ }
            : { ...w, focused: false }
        ),
      }))
    } else {
      const cfg  = PANEL_DEFAULTS[panelId]
      const dw   = desktopRef ? desktopRef.clientWidth  : window.innerWidth
      const dh   = desktopRef ? desktopRef.clientHeight : window.innerHeight - 40
      const x    = Math.round((dw - cfg.width)  / 2)
      const y    = Math.round((dh - cfg.height) / 2)
      const rect = { x, y, width: cfg.width, height: cfg.height }

      useOSStore.setState(state => ({
        topZ: newZ,
        windows: [
          ...state.windows.map(w => ({ ...w, focused: false })),
          {
            id:          `sys-${panelId}`,
            title:       cfg.title,
            icon:        cfg.icon,
            content:     CONTENT_MAP[panelId],
            ...rect,
            zIndex:      newZ,
            focused:     true,
            minimized:   false,
            maximized:   false,
            restoreRect: rect,
          },
        ],
      }))
    }

    onClose()
  }

  // compliance tier label
  function tier(c: number) {
    if (c >= 80) return { label: 'SENIOR ANALYST',     color: C.accent  }
    if (c >= 55) return { label: 'ANALYST',            color: C.accent  }
    if (c >= 30) return { label: 'CITIZEN — STANDARD', color: C.muted   }
    if (c < 0)   return { label: 'FLAGGED',            color: C.danger  }
    return              { label: 'UNASSIGNED',          color: C.faint   }
  }
  const t = tier(compliance)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 8000,
    }}>
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          bottom: 44,
          left: 0,
          width: 320,
          maxHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderBottom: 'none',
          borderRadius: '0 8px 0 0',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: C.text,
          overflow: 'hidden',
          boxShadow: '4px -4px 40px #00000099',
          animation: 'startMenuIn 0.18s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <style>{`
          @keyframes startMenuIn {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* ── Citizen profile ── */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: `1px solid ${C.border}`,
          background: C.surf2,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 6,
              border: `1px solid ${C.accent}44`,
              background: C.surf3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: C.accent, fontWeight: 'bold',
            }}>
              [U]
            </div>
            <div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 'bold' }}>CITIZEN #4471</div>
              <div style={{ fontSize: 10, color: t.color, marginTop: 2 }}>{t.label}</div>
            </div>
            {unread > 0 && (
              <div style={{
                marginLeft: 'auto',
                background: C.danger, color: '#fff',
                fontSize: 9, fontWeight: 'bold',
                borderRadius: 10, padding: '2px 7px',
              }}>
                {unread} unread
              </div>
            )}
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <RepBar label="GRID"   value={compliance} color={C.accent} max={100} />
            <RepBar label="SHADOW" value={shadow}     color={C.violet} max={100} />
          </div>
        </div>

        {/* ── Apps ── */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '8px 12px 4px', fontSize: 9, color: C.faint, letterSpacing: '0.12em' }}>
            APPLICATIONS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visibleApps.map(app => (
              <AppRow
                key={app.id}
                app={app}
                badge={app.id === 'mail' && unread > 0 ? unread : 0}
                onClick={() => handleAppClick(app.id)}
              />
            ))}
          </div>

          <div style={{ height: 1, background: C.border, margin: '4px 0' }} />

          {/* ── System section ── */}
          <div style={{ padding: '4px 12px 4px', fontSize: 9, color: C.faint, letterSpacing: '0.12em' }}>
            SYSTEM
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {SYSTEM_ITEMS.map(item => (
              <SysRow
                key={item.id}
                label={item.label}
                icon={item.icon}
                onClick={() => handleSysClick(item.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          background: C.surf2,
          display: 'flex',
          flexShrink: 0,
        }}>
          {QUICK_ACTIONS.map(qa => (
            <QuickAction
              key={qa.action}
              label={qa.label}
              icon={qa.icon}
              onClick={onClose}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── sub-components ────────────────────────────────────────────────────────────
function RepBar({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const negative = value < 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4 }}>
        <span style={{ color: '#6b6b80', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ color: negative ? '#ff3b5c' : color }}>
          {value > 0 ? '+' : ''}{value}
        </span>
      </div>
      <div style={{ height: 3, background: '#2a2a3a', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.abs(pct)}%`,
          background: negative ? '#ff3b5c' : color,
          borderRadius: 2, transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

function AppRow({ app, badge, onClick }: {
  app: { id: string; title: string; icon: string; accent: string }; badge: number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
        background: 'none', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 16px', transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#16161f')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{
        width: 28, height: 28, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#16161f', border: `1px solid ${app.accent}33`,
        borderRadius: 5, fontSize: 10, color: app.accent, fontWeight: 'bold',
      }}>
        {app.icon}
      </span>
      <span style={{ flex: 1, fontSize: 11, color: '#c8c8d8' }}>{app.title}</span>
      {badge > 0 && (
        <span style={{
          background: '#ff3b5c', color: '#fff',
          fontSize: 9, fontWeight: 'bold',
          borderRadius: 10, padding: '1px 6px', minWidth: 18, textAlign: 'center',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

function SysRow({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
        background: 'none', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 16px', transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#16161f')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{
        width: 28, height: 28, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#16161f', border: '1px solid #2a2a3a',
        borderRadius: 5, fontSize: 10, color: '#6b6b80', fontWeight: 'bold',
      }}>
        {icon}
      </span>
      <span style={{ fontSize: 11, color: '#c8c8d8' }}>{label}</span>
    </button>
  )
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, border: 'none', cursor: 'pointer',
        background: 'none', fontFamily: 'inherit',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 4, padding: '10px 0',
        color: '#6b6b80', fontSize: 10,
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#16161f'
        e.currentTarget.style.color = '#c8c8d8'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'none'
        e.currentTarget.style.color = '#6b6b80'
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
