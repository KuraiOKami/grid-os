// ── OSShell.tsx ────────────────────────────────────────────────────────────
// Main desktop shell. Reads unlockStore to determine which icons appear.

import { useState, useEffect, useRef } from 'react'
import GridBrowser from '@/apps/GridBrowser'
import JobBoard    from '@/apps/JobBoard'
import WatchApp   from '@/apps/WatchApp'
import MailApp    from '@/apps/MailApp'
import AppStore   from '@/apps/AppStore'
import NodeApp    from '@/apps/NodeApp'
import Terminal   from '@/apps/Terminal'
import FileSystem from '@/apps/FileSystem'
import MapApp        from '@/apps/MapApp'
import CheckpointApp from '@/apps/CheckpointApp'
import RepHUD     from '@/components/RepHUD'
import BootScreen from '@/components/BootScreen'
import StartMenu  from '@/components/StartMenu'
import { useMailStore }   from '@/store/mailStore'
import { useUnlockStore } from '@/store/unlockStore'

interface Win {
  id:      string
  title:   string
  icon:    string
  x:       number
  y:       number
  w:       number
  h:       number
  z:       number
  focused: boolean
}

const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  surf2:   '#16161f',
  border:  '#2a2a3a',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
}

const ALL_APPS = [
  { id: 'browser',  title: 'GridBrowser', icon: 'WWW', w: 820, h: 540, accent: '#00e5ff' },
  { id: 'mail',     title: 'Mail',        icon: '@',   w: 720, h: 500, accent: '#00e5ff' },
  { id: 'jobs',     title: 'Job Board',   icon: '[ ]', w: 700, h: 500, accent: '#00cc88' },
  { id: 'appstore', title: 'App Store',   icon: '[+]', w: 760, h: 520, accent: '#d6a2ff' },
  { id: 'watch',    title: 'Watch',       icon: '[W]', w: 780, h: 520, accent: '#ff3b5c' },
  { id: 'node',     title: 'NODE',        icon: '[~]', w: 780, h: 560, accent: '#00e5ff' },
  { id: 'terminal', title: 'Terminal',    icon: '>_',  w: 680, h: 440, accent: '#00cc88' },
  { id: 'files',    title: 'File System', icon: '/fs', w: 720, h: 500, accent: '#ffaa00' },
  { id: 'map',        title: 'City Map',    icon: '[M]',  w: 820, h: 540, accent: '#00cc88' },
  { id: 'checkpoint', title: 'Checkpoint', icon: '[C]',  w: 900, h: 580, accent: '#ffaa00' },
]

let _topZ = 10

export default function OSShell() {
  const [booted,   setBooted]   = useState(false)
  const [wins,     setWins]     = useState<Win[]>([])
  const [time,     setTime]     = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const unreadCount = useMailStore(s => s.unreadCount)()
  const installed   = useUnlockStore(s => s.installed)
  const visibleApps = ALL_APPS.filter(a => installed.includes(a.id))

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const openApp = (appId: string) => {
    const cfg = ALL_APPS.find(a => a.id === appId)!
    _topZ++
    const offset = wins.length * 28
    setWins(prev => [
      ...prev.map(w => ({ ...w, focused: false })),
      {
        id: `${appId}-${Date.now()}`, title: cfg.title, icon: cfg.icon,
        x: 130 + offset, y: 60 + offset, w: cfg.w, h: cfg.h,
        z: _topZ, focused: true,
      },
    ])
  }

  const closeWin  = (id: string) => setWins(prev => prev.filter(w => w.id !== id))

  const focusWin  = (id: string) => {
    _topZ++
    setWins(prev => prev.map(w =>
      w.id === id ? { ...w, focused: true, z: _topZ } : { ...w, focused: false }
    ))
  }

  const moveWin = (id: string, x: number, y: number) =>
    setWins(prev => prev.map(w => w.id === id ? { ...w, x, y } : w))

  return (
    <>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}

      {menuOpen && (
        <StartMenu
          onClose={() => setMenuOpen(false)}
          onOpenApp={openApp}
        />
      )}

      <div style={{
        width: '100vw', height: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
        opacity: booted ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        {/* Desktop */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 24, left: 24,
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {visibleApps.map(app => (
              <DesktopIcon
                key={app.id}
                icon={app.icon}
                label={app.title}
                accent={app.accent}
                badge={app.id === 'mail' && unreadCount > 0 ? unreadCount : 0}
                onClick={() => openApp(app.id)}
              />
            ))}
          </div>

          {wins.map(win => (
            <OsWindow
              key={win.id}
              win={win}
              onClose={() => closeWin(win.id)}
              onFocus={() => focusWin(win.id)}
              onMove={(x, y) => moveWin(win.id, x, y)}
            />
          ))}
        </div>

        {/* Taskbar */}
        <div style={{
          height: 44, background: C.surface, borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
          flexShrink: 0, position: 'relative', zIndex: 100,
        }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              padding: '3px 14px', fontSize: 11, fontWeight: 'bold',
              color: menuOpen ? C.bg : C.accent,
              border: `1px solid ${C.accent}`,
              borderRadius: 4,
              background: menuOpen ? C.accent : 'none',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            GRID
          </button>

          <div style={{ width: 1, height: 20, background: C.border }} />

          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            {wins.map(w => (
              <button key={w.id} onClick={() => focusWin(w.id)} style={{
                padding: '3px 12px', fontSize: 11, borderRadius: 4,
                cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${w.focused ? C.accent + '66' : 'transparent'}`,
                background: w.focused ? C.accent + '22' : 'none',
                color: w.focused ? C.accent : C.muted,
              }}>
                {w.title}
              </button>
            ))}
          </div>

          <RepHUD />

          <div style={{ width: 1, height: 20, background: C.border }} />

          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: C.muted }}>
            <span style={{ color: C.success }}>● ONLINE</span>
            {unreadCount > 0 && <span style={{ color: C.warn }}>✉ {unreadCount}</span>}
            <span>{time}</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Desktop Icon
function DesktopIcon({ icon, label, accent = '#00e5ff', badge = 0, onClick }: {
  icon: string; label: string; accent?: string; badge?: number; onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 5, width: 64, padding: 0, position: 'relative',
      }}
    >
      <div style={{
        width: 52, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 'bold', letterSpacing: 1,
        background: '#111118', borderRadius: 6,
        color: hov ? accent : '#6b6b80',
        border: `1px solid ${hov ? accent : '#2a2a3a'}`,
        boxShadow: hov ? `0 0 12px ${accent}33` : 'none',
        transition: 'all 0.15s', fontFamily: 'inherit', position: 'relative',
      }}>
        {icon}
        {badge > 0 && (
          <div style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 16, height: 16, borderRadius: '50%',
            background: '#ff3b5c', color: '#fff',
            fontSize: 9, fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
          }}>
            {badge > 9 ? '9+' : badge}
          </div>
        )}
      </div>
      <span style={{
        fontSize: 10, color: hov ? '#c8c8d8' : '#6b6b80',
        textAlign: 'center', lineHeight: 1.3, transition: 'color 0.15s',
      }}>
        {label}
      </span>
    </button>
  )
}

// ── OS Window
function OsWindow({ win, onClose, onFocus, onMove }: {
  win: Win
  onClose: () => void
  onFocus: () => void
  onMove: (x: number, y: number) => void
}) {
  const dragRef = useRef<{ ox: number; oy: number } | null>(null)
  const isWatch = win.title === 'Watch'

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    onFocus()
    dragRef.current = { ox: e.clientX - win.x, oy: e.clientY - win.y }
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return
      onMove(ev.clientX - dragRef.current.ox, Math.max(0, ev.clientY - dragRef.current.oy))
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  function renderBody() {
    if (win.title === 'GridBrowser') return <GridBrowser />
    if (win.title === 'Job Board')   return <JobBoard />
    if (win.title === 'Watch')       return <WatchApp />
    if (win.title === 'Mail')        return <MailApp />
    if (win.title === 'App Store')   return <AppStore />
    if (win.title === 'NODE')        return <NodeApp />
    if (win.title === 'Terminal')    return <Terminal />
    if (win.title === 'File System') return <FileSystem />
    if (win.title === 'City Map')    return <MapApp />
    if (win.title === 'Checkpoint')  return <CheckpointApp />
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8,
      }}>
        <span style={{ fontSize: 22, color: '#00e5ff', fontWeight: 'bold' }}>{win.icon}</span>
        <span style={{ fontSize: 12, color: '#6b6b80' }}>{win.title}</span>
        <span style={{ fontSize: 10, color: '#3a3a4a' }}>// coming soon</span>
      </div>
    )
  }

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute', left: win.x, top: win.y,
        width: win.w, height: win.h, zIndex: win.z,
        display: 'flex', flexDirection: 'column',
        background: '#111118', borderRadius: 6,
        border: `1px solid ${isWatch ? '#ff3b5c55' : '#00e5ff55'}`,
        boxShadow: win.focused ? '0 8px 40px #00000088' : '0 4px 20px #00000066',
      }}
    >
      <div
        onMouseDown={startDrag}
        style={{
          height: 32, display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8,
          borderBottom: '1px solid #2a2a3a',
          background: '#16161f',
          borderRadius: '6px 6px 0 0',
          flexShrink: 0, cursor: 'move', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ff3b5cbb' }}
          />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffaa0044' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#00cc8844' }} />
        </div>
        <span style={{
          flex: 1, textAlign: 'center', fontSize: 11,
          color: isWatch ? '#ff3b5c88' : '#6b6b80', fontFamily: 'inherit',
        }}>
          {win.title}
        </span>
      </div>

      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          flex: 1, overflow: 'auto',
          display: 'flex', alignItems: 'stretch',
          flexDirection: 'column', minHeight: 0,
        }}
      >
        {renderBody()}
      </div>
    </div>
  )
}
