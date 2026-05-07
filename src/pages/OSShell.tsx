// ── OSShell.tsx ────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import GridBrowser   from '@/apps/GridBrowser'
import JobBoard      from '@/apps/JobBoard'
import WatchApp      from '@/apps/WatchApp'
import MailApp       from '@/apps/MailApp'
import AppStore      from '@/apps/AppStore'
import NodeApp       from '@/apps/NodeApp'
import Terminal      from '@/apps/Terminal'
import FileSystem    from '@/apps/FileSystem'
import MapApp        from '@/apps/MapApp'
import CheckpointApp from '@/apps/CheckpointApp'
import RepHUD        from '@/components/RepHUD'
import BootScreen    from '@/components/BootScreen'
import StartMenu     from '@/components/StartMenu'
import { useMailStore }   from '@/store/mailStore'
import { useUnlockStore } from '@/store/unlockStore'
import { useOSStore, type WindowState } from '@/store/osStore'

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
  { id: 'browser',    title: 'GridBrowser', icon: 'WWW',  w: 820, h: 540, accent: '#00e5ff' },
  { id: 'mail',       title: 'Mail',        icon: '@',    w: 720, h: 500, accent: '#00e5ff' },
  { id: 'jobs',       title: 'Job Board',   icon: '[ ]',  w: 700, h: 500, accent: '#00cc88' },
  { id: 'appstore',   title: 'App Store',   icon: '[+]',  w: 760, h: 520, accent: '#d6a2ff' },
  { id: 'watch',      title: 'Watch',       icon: '[W]',  w: 780, h: 520, accent: '#ff3b5c' },
  { id: 'node',       title: 'NODE',        icon: '[~]',  w: 780, h: 560, accent: '#00e5ff' },
  { id: 'terminal',   title: 'Terminal',    icon: '>_',   w: 680, h: 440, accent: '#00cc88' },
  { id: 'files',      title: 'File System', icon: '/fs',  w: 720, h: 500, accent: '#ffaa00' },
  { id: 'map',        title: 'City Map',    icon: '[M]',  w: 820, h: 540, accent: '#00cc88' },
  { id: 'checkpoint', title: 'Checkpoint',  icon: '[C]',  w: 900, h: 580, accent: '#ffaa00' },
]

export default function OSShell() {
  const [booted,   setBooted]   = useState(false)
  const [time,     setTime]     = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const desktopRef = useRef<HTMLDivElement>(null)

  // ─ store ───────────────────────────────────────────────────────────
  const windows       = useOSStore(s => s.windows)
  const openApp       = useOSStore(s => s.openApp)
  const closeWindow   = useOSStore(s => s.closeWindow)
  const focusWindow   = useOSStore(s => s.focusWindow)
  const updatePos     = useOSStore(s => s.updateWindowPos)
  const toggleMax     = useOSStore(s => s.toggleMaximize)
  const minimizeWin   = useOSStore(s => s.minimizeWindow)
  const restoreWin    = useOSStore(s => s.restoreWindow)
  const setDesktopRef = useOSStore(s => s.setDesktopRef)

  const unreadCount = useMailStore(s => s.unreadCount)()
  const installed   = useUnlockStore(s => s.installed)
  const visibleApps = ALL_APPS.filter(a => installed.includes(a.id))

  // Register desktop element so openWindow can center panels
  useEffect(() => {
    setDesktopRef(desktopRef.current)
    return () => setDesktopRef(null)
  }, [setDesktopRef])

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}

      {menuOpen && (
        <StartMenu
          onClose={() => setMenuOpen(false)}
          onOpenApp={(id) => { openApp(id); setMenuOpen(false) }}
        />
      )}

      <div style={{
        width: '100vw', height: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
        opacity: booted ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        {/* Desktop */}
        <div ref={desktopRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Desktop icons */}
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

          {/* All windows — both app windows and system panels */}
          {windows.map(win => (
            <OsWindow
              key={win.id}
              win={win}
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onMove={(x, y) => updatePos(win.id, x, y)}
              onToggleMax={() => toggleMax(win.id)}
              onMinimize={() => minimizeWin(win.id)}
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

          {/* Taskbar buttons for open windows */}
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            {windows.map(w => (
              <button
                key={w.id}
                onClick={() => w.minimized ? restoreWin(w.id) : focusWindow(w.id)}
                style={{
                  padding: '3px 12px', fontSize: 11, borderRadius: 4,
                  cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${w.focused ? C.accent + '66' : 'transparent'}`,
                  background: w.focused ? C.accent + '22' : 'none',
                  color: w.minimized ? C.muted + '88' : w.focused ? C.accent : C.muted,
                  textDecoration: w.minimized ? 'line-through' : 'none',
                }}
              >
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

// ── Desktop Icon ───────────────────────────────────────────────────────────
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

// ── OS Window ───────────────────────────────────────────────────────────
function OsWindow({ win, onClose, onFocus, onMove, onToggleMax, onMinimize }: {
  win: WindowState
  onClose:     () => void
  onFocus:     () => void
  onMove:      (x: number, y: number) => void
  onToggleMax: () => void
  onMinimize:  () => void
}) {
  const dragRef = useRef<{ ox: number; oy: number } | null>(null)
  const isWatch = win.title === 'Watch'

  if (win.minimized) return null

  const startDrag = (e: React.MouseEvent) => {
    if (win.maximized) return
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

  // If the window was opened via openWindow (system panels), it carries its own content.
  // If opened via openApp, render by title.
  function renderBody() {
    if (win.content) return win.content
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
        <span style={{ fontSize: 22, color: C.accent, fontWeight: 'bold' }}>{win.icon}</span>
        <span style={{ fontSize: 12, color: C.muted }}>{win.title}</span>
        <span style={{ fontSize: 10, color: '#3a3a4a' }}>// coming soon</span>
      </div>
    )
  }

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        left: win.x, top: win.y, width: win.width, height: win.height,
        zIndex: win.zIndex,
        display: 'flex', flexDirection: 'column',
        background: '#111118', borderRadius: win.maximized ? 0 : 6,
        border: `1px solid ${isWatch ? '#ff3b5c55' : '#00e5ff55'}`,
        boxShadow: win.focused ? '0 8px 40px #00000088' : '0 4px 20px #00000066',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={onToggleMax}
        style={{
          height: 32, display: 'flex', alignItems: 'center',
          padding: '0 12px', gap: 8,
          borderBottom: '1px solid #2a2a3a',
          background: '#16161f',
          borderRadius: win.maximized ? 0 : '6px 6px 0 0',
          flexShrink: 0, cursor: win.maximized ? 'default' : 'move',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            title="Close"
            style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ff3b5cbb' }}
          />
          <button
            onClick={e => { e.stopPropagation(); onMinimize() }}
            title="Minimize"
            style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ffaa00bb' }}
          />
          <button
            onClick={e => { e.stopPropagation(); onToggleMax() }}
            title="Maximize"
            style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#00cc88bb' }}
          />
        </div>
        <span style={{
          flex: 1, textAlign: 'center', fontSize: 11,
          color: isWatch ? '#ff3b5c88' : '#6b6b80', fontFamily: 'inherit',
        }}>
          {win.title}
        </span>
      </div>

      {/* Body */}
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
