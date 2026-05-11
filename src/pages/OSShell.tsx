// ── OSShell.tsx ───────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import GridBrowser    from '@/apps/GridBrowser'
import JobBoard       from '@/apps/JobBoard'
import WatchApp       from '@/apps/WatchApp'
import MailApp        from '@/apps/MailApp'
import AppStore       from '@/apps/AppStore'
import NodeApp        from '@/apps/NodeApp'
import Terminal       from '@/apps/Terminal'
import FileSystem     from '@/apps/FileSystem'
import MapApp         from '@/apps/MapApp'
import CheckpointApp  from '@/apps/CheckpointApp'
import DataBrokerApp  from '@/apps/DataBrokerApp'
import CourierApp     from '@/apps/CourierApp'
import OpsApp         from '@/apps/OpsApp'
import CipherApp      from '@/apps/CipherApp'
import RelayApp       from '@/apps/RelayApp'
import SocketApp      from '@/apps/SocketApp'
import RepHUD              from '@/components/RepHUD'
import MissionHUD          from '@/components/MissionHUD'
import NotificationToast   from '@/components/NotificationToast'
import RegistrationScreen  from '@/components/RegistrationScreen'
import SaveMenu            from '@/components/SaveMenu'
import BootScreen          from '@/components/BootScreen'
import StartMenu           from '@/components/StartMenu'
import { useMailStore }             from '@/store/mailStore'
import { useUnlockStore }           from '@/store/unlockStore'
import { useOSStore, type WindowState } from '@/store/osStore'
import { checkTriggers }            from '@/store/triggerEngine'
import { useEmailQueueStore }       from '@/store/emailQueue'
import { useCitizenStore, isRegistered } from '@/store/citizenStore'

const MIN_W = 280
const MIN_H = 180
type ResizeDir = 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'
const RESIZE_CURSORS: Record<ResizeDir, string> = {
  n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
  ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
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
  { id: 'browser',    title: 'GridBrowser',  icon: 'WWW',  w: 820, h: 540, accent: '#00e5ff' },
  { id: 'mail',       title: 'Mail',         icon: '@',    w: 720, h: 500, accent: '#00e5ff' },
  { id: 'jobs',       title: 'Job Board',    icon: '[ ]',  w: 700, h: 500, accent: '#00cc88' },
  { id: 'appstore',   title: 'App Store',    icon: '[+]',  w: 760, h: 520, accent: '#d6a2ff' },
  { id: 'watch',      title: 'Watch',        icon: '[W]',  w: 780, h: 520, accent: '#ff3b5c' },
  { id: 'node',       title: 'NODE',         icon: '[~]',  w: 780, h: 560, accent: '#00e5ff' },
  { id: 'terminal',   title: 'Terminal',     icon: '>_',   w: 680, h: 440, accent: '#00cc88' },
  { id: 'files',      title: 'File System',  icon: '/fs',  w: 720, h: 500, accent: '#ffaa00' },
  { id: 'map',        title: 'City Map',     icon: '[M]',  w: 820, h: 540, accent: '#00cc88' },
  { id: 'checkpoint', title: 'Checkpoint',   icon: '[C]',  w: 900, h: 580, accent: '#ffaa00' },
  { id: 'databroker', title: 'Data Broker',  icon: '[$]',  w: 820, h: 540, accent: '#e8a020' },
  { id: 'courier',    title: 'Courier',      icon: '[>>]', w: 860, h: 560, accent: '#ffaa00' },
  { id: 'ops',        title: 'OPS',          icon: '[!]',  w: 760, h: 520, accent: '#ff3b5c' },
  { id: 'cipher',    title: 'CIPHER',       icon: '[C]',  w: 680, h: 520, accent: '#d6a2ff' },
  { id: 'relay',     title: 'RELAY',        icon: '[R]',  w: 700, h: 540, accent: '#00e5ff' },
  { id: 'socket',    title: 'SOCKET',       icon: '[S]',  w: 760, h: 520, accent: '#00cc88' },
]

const ICON_W    = 88    // px width per icon column slot
const ICON_H    = 96    // px height per icon row slot
const ICON_PAD  = 20    // px from desktop edge

function defaultIconPos(index: number, desktopH: number): { x: number; y: number } {
  const perCol = Math.max(1, Math.floor((desktopH - ICON_PAD * 2) / ICON_H))
  return {
    x: ICON_PAD + Math.floor(index / perCol) * ICON_W,
    y: ICON_PAD + (index % perCol) * ICON_H,
  }
}

export default function OSShell() {
  const [registered,    setRegistered]    = useState(() => isRegistered())
  const [booted,        setBooted]        = useState(false)
  const [time,          setTime]          = useState('')
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [saveOpen,      setSaveOpen]      = useState(false)
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [playtime,      setPlaytime]      = useState(0)
  const desktopRef = useRef<HTMLDivElement>(null)

  // Load citizen profile on mount
  useCitizenStore(s => s.load)()

  // ─ store ──────────────────────────────────────────────────────────────────
  const windows       = useOSStore(s => s.windows)
  const openApp       = useOSStore(s => s.openApp)
  const closeWindow   = useOSStore(s => s.closeWindow)
  const focusWindow   = useOSStore(s => s.focusWindow)
  const updatePos     = useOSStore(s => s.updateWindowPos)
  const updateSize    = useOSStore(s => s.updateWindowSize)
  const toggleMax     = useOSStore(s => s.toggleMaximize)
  const minimizeWin   = useOSStore(s => s.minimizeWindow)
  const restoreWin    = useOSStore(s => s.restoreWindow)
  const setDesktopRef = useOSStore(s => s.setDesktopRef)

  const unreadCount = useMailStore(s => s.unreadCount)()
  const installed   = useUnlockStore(s => s.installed)
  const visibleApps = ALL_APPS.filter(a => installed.includes(a.id))

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

  // Fire game_start trigger once after boot
  useEffect(() => {
    checkTriggers({ type: 'game_start' })
  }, [])

  // Email queue tick — runs immediately after game_start (100ms), then every 15s
  useEffect(() => {
    function runTick() {
      const delivered = useEmailQueueStore.getState().tick()
      delivered.forEach(mail => useMailStore.getState().send(mail))
    }
    const init = setTimeout(runTick, 100)   // catch E-01 queued by game_start
    const id   = setInterval(runTick, 15_000)
    return () => { clearTimeout(init); clearInterval(id) }
  }, [])

  // Playtime tracker — increments every second while registered + booted
  useEffect(() => {
    if (!registered || !booted) return
    const id = setInterval(() => setPlaytime(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [registered, booted])

  if (!registered) {
    return <RegistrationScreen onComplete={() => setRegistered(true)} />
  }

  return (
    <>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}

      {saveOpen && <SaveMenu playtime={playtime} onClose={() => setSaveOpen(false)} />}

      {menuOpen && (
        <StartMenu
          onClose={() => setMenuOpen(false)}
          onOpenApp={(id) => { openApp(id); setMenuOpen(false) }}
        />
      )}

      {/* Windows-style toast notifications — fixed, bottom-right, above taskbar */}
      <NotificationToast />

      <div style={{
        width: '100vw', height: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
        opacity: booted ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        {/* Desktop */}
        <div ref={desktopRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Desktop icons — absolutely positioned, draggable */}
          {visibleApps.map((app, i) => {
            const dh  = desktopRef.current?.clientHeight ?? 600
            const pos = iconPositions[app.id] ?? defaultIconPos(i, dh)
            return (
              <DesktopIcon
                key={app.id}
                icon={app.icon}
                label={app.title}
                accent={app.accent}
                badge={app.id === 'mail' && unreadCount > 0 ? unreadCount : 0}
                x={pos.x}
                y={pos.y}
                desktopRef={desktopRef}
                onClick={() => openApp(app.id)}
                onDrag={(x, y) => setIconPositions(p => ({ ...p, [app.id]: { x, y } }))}
              />
            )
          })}

          {/* All windows */}
          {windows.map(win => (
            <OsWindow
              key={win.id}
              win={win}
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onMove={(x, y) => updatePos(win.id, x, y)}
              onResize={(x, y, w, h) => { updatePos(win.id, x, y); updateSize(win.id, w, h) }}
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

          <MissionHUD />
          <RepHUD />

          <div style={{ width: 1, height: 20, background: C.border }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: C.muted }}>
            <span style={{ color: C.success }}>● ONLINE</span>
            {unreadCount > 0 && <span style={{ color: C.warn }}>✉ {unreadCount}</span>}
            <span>{time}</span>
            <button
              onClick={() => setSaveOpen(true)}
              style={{
                padding: '2px 10px', fontSize: 10, fontWeight: 'bold',
                background: 'none', border: `1px solid ${C.border}`,
                color: C.muted, borderRadius: 3, cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: 1,
              }}
            >
              SAVE
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── DesktopIcon ───────────────────────────────────────────────────────────────────
function DesktopIcon({ icon, label, accent = '#00e5ff', badge = 0, x, y, desktopRef, onClick, onDrag }: {
  icon: string; label: string; accent?: string; badge?: number
  x: number; y: number
  desktopRef: React.RefObject<HTMLDivElement>
  onClick: () => void
  onDrag: (x: number, y: number) => void
}) {
  const [hov,     setHov]     = useState(false)
  const [isDrag,  setIsDrag]  = useState(false)
  const didMove = useRef(false)

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    const startX  = e.clientX
    const startY  = e.clientY
    const originX = x
    const originY = y
    didMove.current = false

    function onMove(me: MouseEvent) {
      const dx = me.clientX - startX
      const dy = me.clientY - startY
      if (!didMove.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        didMove.current = true
        setIsDrag(true)
      }
      if (!didMove.current) return
      const desktop = desktopRef.current
      const maxX = desktop ? desktop.clientWidth  - 72 : 9999
      const maxY = desktop ? desktop.clientHeight - 72 : 9999
      onDrag(
        Math.max(0, Math.min(maxX, originX + dx)),
        Math.max(0, Math.min(maxY, originY + dy)),
      )
    }

    function onUp() {
      setIsDrag(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  return (
    <button
      onMouseDown={handleMouseDown}
      onClick={() => { if (!didMove.current) onClick() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'absolute', left: x, top: y,
        background: 'none', border: 'none',
        cursor: isDrag ? 'grabbing' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 5, width: 64, padding: 0,
        userSelect: 'none', zIndex: isDrag ? 999 : 1,
        opacity: isDrag ? 0.85 : 1,
        transition: isDrag ? 'none' : 'opacity 0.1s',
      }}
    >
      <div style={{
        width: 52, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 'bold', letterSpacing: 1,
        background: '#111118', borderRadius: 6,
        color: hov ? accent : '#6b6b80',
        border: `1px solid ${hov || isDrag ? accent : '#2a2a3a'}`,
        boxShadow: hov || isDrag ? `0 0 12px ${accent}33` : 'none',
        transition: isDrag ? 'none' : 'all 0.15s',
        fontFamily: 'inherit', position: 'relative',
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
        pointerEvents: 'none',
      }}>
        {label}
      </span>
    </button>
  )
}

// ── OsWindow ───────────────────────────────────────────────────────────────────
function OsWindow({ win, onClose, onFocus, onMove, onResize, onToggleMax, onMinimize }: {
  win: WindowState
  onClose:     () => void
  onFocus:     () => void
  onMove:      (x: number, y: number) => void
  onResize:    (x: number, y: number, width: number, height: number) => void
  onToggleMax: () => void
  onMinimize:  () => void
}) {
  const dragRef   = useRef<{ ox: number; oy: number } | null>(null)
  const resizeRef = useRef<{
    dir: ResizeDir
    startX: number; startY: number
    startRect: { x: number; y: number; width: number; height: number }
  } | null>(null)
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

  const startResize = (e: React.MouseEvent, dir: ResizeDir) => {
    if (win.maximized) return
    e.preventDefault()
    e.stopPropagation()
    onFocus()
    resizeRef.current = {
      dir,
      startX: e.clientX, startY: e.clientY,
      startRect: { x: win.x, y: win.y, width: win.width, height: win.height },
    }
    const move = (ev: MouseEvent) => {
      const s = resizeRef.current
      if (!s) return
      const dx = ev.clientX - s.startX
      const dy = ev.clientY - s.startY
      let { x, y, width, height } = s.startRect
      if (s.dir.includes('e')) width  = Math.max(MIN_W, width  + dx)
      if (s.dir.includes('s')) height = Math.max(MIN_H, height + dy)
      if (s.dir.includes('w')) {
        const nw = Math.max(MIN_W, width - dx)
        x = x + (width - nw)
        width = nw
      }
      if (s.dir.includes('n')) {
        const nh = Math.max(MIN_H, height - dy)
        y = Math.max(0, y + (height - nh))
        height = nh
      }
      onResize(x, y, width, height)
    }
    const up = () => {
      resizeRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  const resizeHandle = (dir: ResizeDir) => (
    <div
      key={dir}
      onMouseDown={e => startResize(e, dir)}
      style={{
        position: 'absolute',
        cursor: RESIZE_CURSORS[dir],
        zIndex: 10,
        ...(dir === 'n'  ? { top: -4,    left: 8,    right: 8,   height: 8  } : {}),
        ...(dir === 's'  ? { bottom: -4, left: 8,    right: 8,   height: 8  } : {}),
        ...(dir === 'w'  ? { left: -4,   top: 8,     bottom: 8,  width: 8   } : {}),
        ...(dir === 'e'  ? { right: -4,  top: 8,     bottom: 8,  width: 8   } : {}),
        ...(dir === 'nw' ? { top: -4,    left: -4,   width: 14,  height: 14 } : {}),
        ...(dir === 'ne' ? { top: -4,    right: -4,  width: 14,  height: 14 } : {}),
        ...(dir === 'sw' ? { bottom: -4, left: -4,   width: 14,  height: 14 } : {}),
        ...(dir === 'se' ? { bottom: -4, right: -4,  width: 14,  height: 14 } : {}),
      }}
    />
  )

  // NOTE: win.id is "appId-timestamp" (e.g. "browser-1715354400000")
  // Match on win.title which is set from APP_DEFAULTS and is stable.
  function renderBody() {
    if (win.content)                              return win.content
    if (win.title === 'GridBrowser')              return <GridBrowser />
    if (win.title === 'Job Board')                return <JobBoard />
    if (win.title === 'Watch')                    { checkTriggers({ type: 'open_app', appId: 'watch' }); return <WatchApp /> }
    if (win.title === 'Mail')                     return <MailApp />
    if (win.title === 'App Store')                return <AppStore />
    if (win.title === 'NODE')                     return <NodeApp />
    if (win.title === 'Terminal')                 return <Terminal />
    if (win.title === 'File System')              { checkTriggers({ type: 'file_read', path: '~/' }); return <FileSystem /> }
    if (win.title === 'City Map')                 return <MapApp />
    if (win.title === 'Checkpoint')               return <CheckpointApp />
    if (win.title === 'Data Broker')              return <DataBrokerApp />
    if (win.title === 'Courier')                  return <CourierApp />
    if (win.title === 'OPS')                      return <OpsApp />
    if (win.title === 'CIPHER')                   return <CipherApp />
    if (win.title === 'RELAY')                    return <RelayApp />
    if (win.title === 'SOCKET')                   return <SocketApp />
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
      {/* Resize handles — hidden when maximized */}
      {!win.maximized && (['n','s','e','w','ne','nw','se','sw'] as ResizeDir[]).map(resizeHandle)}

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
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onClose() }}
            title="Close"
            style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ff3b5cbb' }}
          />
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onMinimize() }}
            title="Minimize"
            style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ffaa00bb' }}
          />
          <button
            onMouseDown={e => e.stopPropagation()}
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
