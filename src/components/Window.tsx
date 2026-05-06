// Window.tsx — drag, 8-handle resize, minimize, maximize/restore, close
import { useRef, useState, useEffect, useCallback } from 'react'
import { useOSStore } from '@/store/osStore'
import type { WindowState } from '@/store/osStore'

const MIN_W = 280
const MIN_H = 180

type ResizeDir = 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'

const CURSORS: Record<ResizeDir, string> = {
  n:  'n-resize',  s:  's-resize',
  e:  'e-resize',  w:  'w-resize',
  ne: 'ne-resize', nw: 'nw-resize',
  se: 'se-resize', sw: 'sw-resize',
}

interface Props { window: WindowState }

export default function Window({ window: win }: Props) {
  const {
    closeWindow, focusWindow, updateWindowPos,
    updateWindowSize, minimizeWindow, toggleMaximize,
  } = useOSStore()

  const [rect, setRect] = useState({
    x: win.x, y: win.y, width: win.width, height: win.height,
  })

  // sync if maximized state changes externally
  useEffect(() => {
    setRect({ x: win.x, y: win.y, width: win.width, height: win.height })
  }, [win.maximized, win.minimized])

  // ── drag ────────────────────────────────────────────────────────────────
  const dragOffset = useRef<{ x: number; y: number } | null>(null)

  const onTitleMouseDown = (e: React.MouseEvent) => {
    if (win.maximized) return          // don't drag while maximized
    e.preventDefault()
    focusWindow(win.id)
    dragOffset.current = { x: e.clientX - rect.x, y: e.clientY - rect.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragOffset.current) return
      const nx = ev.clientX - dragOffset.current.x
      const ny = Math.max(0, ev.clientY - dragOffset.current.y)
      setRect(r => ({ ...r, x: nx, y: ny }))
      updateWindowPos(win.id, nx, ny)
    }
    const onUp = () => {
      dragOffset.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // double-click titlebar = toggle maximize
  const onTitleDblClick = () => toggleMaximize(win.id)

  // ── resize ───────────────────────────────────────────────────────────────
  const resizeState = useRef<{
    dir: ResizeDir
    startX: number; startY: number
    startRect: { x: number; y: number; width: number; height: number }
  } | null>(null)

  const startResize = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    if (win.maximized) return
    e.preventDefault()
    e.stopPropagation()
    focusWindow(win.id)
    resizeState.current = {
      dir,
      startX: e.clientX, startY: e.clientY,
      startRect: { ...rect },
    }

    const onMove = (ev: MouseEvent) => {
      const s = resizeState.current
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

      setRect({ x, y, width, height })
      updateWindowPos(win.id, x, y)
      updateWindowSize(win.id, width, height)
    }
    const onUp = () => {
      resizeState.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [rect, win.id, win.maximized])

  if (win.minimized) return null

  const handle = (dir: ResizeDir) => (
    <div
      key={dir}
      onMouseDown={e => startResize(e, dir)}
      style={{
        position: 'absolute',
        cursor: CURSORS[dir],
        zIndex: 10,
        // position each handle
        ...(dir === 'n'  ? { top: -3,    left: 6,    right: 6,   height: 6 } : {}),
        ...(dir === 's'  ? { bottom: -3, left: 6,    right: 6,   height: 6 } : {}),
        ...(dir === 'w'  ? { left: -3,   top: 6,     bottom: 6,  width: 6  } : {}),
        ...(dir === 'e'  ? { right: -3,  top: 6,     bottom: 6,  width: 6  } : {}),
        ...(dir === 'nw' ? { top: -3,    left: -3,   width: 12,  height: 12 } : {}),
        ...(dir === 'ne' ? { top: -3,    right: -3,  width: 12,  height: 12 } : {}),
        ...(dir === 'sw' ? { bottom: -3, left: -3,   width: 12,  height: 12 } : {}),
        ...(dir === 'se' ? { bottom: -3, right: -3,  width: 12,  height: 12 } : {}),
      }}
    />
  )

  return (
    <div
      className={`os-window${win.focused ? ' focused' : ''}`}
      style={{
        left: rect.x, top: rect.y,
        width: rect.width, height: rect.height,
        zIndex: win.zIndex,
        transition: win.maximized ? 'all 0.15s ease' : undefined,
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* resize handles — hidden when maximized */}
      {!win.maximized && (['n','s','e','w','ne','nw','se','sw'] as ResizeDir[]).map(handle)}

      {/* titlebar */}
      <div
        className="window-titlebar"
        onMouseDown={onTitleMouseDown}
        onDoubleClick={onTitleDblClick}
        style={{ cursor: win.maximized ? 'default' : 'move' }}
      >
        <div className="window-dots">
          <button
            className="dot dot-close"
            title="Close"
            onClick={e => { e.stopPropagation(); closeWindow(win.id) }}
          />
          <button
            className="dot dot-min"
            title="Minimize"
            onClick={e => { e.stopPropagation(); minimizeWindow(win.id) }}
          />
          <button
            className="dot dot-max"
            title={win.maximized ? 'Restore' : 'Maximize'}
            onClick={e => { e.stopPropagation(); toggleMaximize(win.id) }}
          />
        </div>
        <span className="window-title">{win.title}</span>
        {win.maximized && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--grid-faint)', paddingRight: 8 }}>
            [maximized]
          </span>
        )}
      </div>

      {/* content */}
      <div className="window-body">
        {win.content ?? (
          <div className="app-placeholder">
            <span>{win.icon}</span>
            <span>{win.title}</span>
            <span style={{ color: 'var(--grid-faint)', fontSize: '10px' }}>// coming soon</span>
          </div>
        )}
      </div>
    </div>
  )
}
