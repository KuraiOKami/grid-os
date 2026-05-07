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

  // Local rect drives actual CSS position/size during live drag/resize.
  // Sync from store whenever the window is NOT being actively manipulated.
  const [rect, setRect] = useState({
    x: win.x, y: win.y, width: win.width, height: win.height,
  })

  const isDragging  = useRef(false)
  const isResizing  = useRef(false)

  // Sync rect from store when not actively manipulating
  // (covers maximize/restore/minimize/external updates)
  useEffect(() => {
    if (!isDragging.current && !isResizing.current) {
      setRect({ x: win.x, y: win.y, width: win.width, height: win.height })
    }
  }, [win.x, win.y, win.width, win.height, win.maximized, win.minimized])

  // ── helpers ─────────────────────────────────────────────────────────────
  const desktopBounds = useCallback(() => {
    const { desktopRef } = useOSStore.getState()
    return {
      w: desktopRef ? desktopRef.clientWidth  : window.innerWidth,
      h: desktopRef ? desktopRef.clientHeight : window.innerHeight - 40,
    }
  }, [])

  // ── drag ────────────────────────────────────────────────────────────────
  const dragOffset = useRef<{ x: number; y: number } | null>(null)
  // restoreOnDrag: when the user starts dragging a maximized window,
  // restore it first and anchor the cursor to 50% of the restored width.
  const dragRestored = useRef(false)

  const onTitleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    focusWindow(win.id)

    if (win.maximized) {
      // Restore first; the restoreRect will be picked up after state update.
      // We note that we need to re-anchor on the first move event.
      dragRestored.current = true
      toggleMaximize(win.id)
      // dragOffset will be set on first mousemove below
      dragOffset.current = null
    } else {
      dragRestored.current = false
      dragOffset.current = { x: e.clientX - rect.x, y: e.clientY - rect.y }
    }

    isDragging.current = true

    const onMove = (ev: MouseEvent) => {
      // After a restore-on-drag, anchor cursor to centre-top of restored window
      if (dragRestored.current) {
        dragRestored.current = false
        const { restoreRect } = useOSStore.getState().windows.find(w => w.id === win.id) ?? {}
          ?? { restoreRect: { width: rect.width } }
        const rw = (restoreRect as { width: number })?.width ?? rect.width
        dragOffset.current = { x: rw / 2, y: 16 }
      }
      if (!dragOffset.current) return

      const { h } = desktopBounds()
      const nx = ev.clientX - dragOffset.current.x
      const ny = Math.max(0, Math.min(ev.clientY - dragOffset.current.y, h - MIN_H))
      setRect(r => ({ ...r, x: nx, y: ny }))
      updateWindowPos(win.id, nx, ny)
    }
    const onUp = () => {
      isDragging.current = false
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

  // Use a ref snapshot of rect to avoid stale closure in startResize
  const rectRef = useRef(rect)
  useEffect(() => { rectRef.current = rect }, [rect])

  const startResize = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    if (win.maximized) return
    e.preventDefault()
    e.stopPropagation()
    focusWindow(win.id)
    isResizing.current = true
    resizeState.current = {
      dir,
      startX: e.clientX, startY: e.clientY,
      startRect: { ...rectRef.current },
    }

    const onMove = (ev: MouseEvent) => {
      const s = resizeState.current
      if (!s) return
      const dx = ev.clientX - s.startX
      const dy = ev.clientY - s.startY
      let { x, y, width, height } = s.startRect
      const { h: dh } = desktopBounds()

      if (s.dir.includes('e')) width  = Math.max(MIN_W, width  + dx)
      if (s.dir.includes('s')) height = Math.max(MIN_H, Math.min(height + dy, dh - y))
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
      isResizing.current = false
      resizeState.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [win.id, win.maximized, focusWindow, updateWindowPos, updateWindowSize, desktopBounds])

  if (win.minimized) return null

  const handle = (dir: ResizeDir) => (
    <div
      key={dir}
      onMouseDown={e => startResize(e, dir)}
      style={{
        position: 'absolute',
        cursor: CURSORS[dir],
        zIndex: 10,
        ...(dir === 'n'  ? { top: -4,    left: 8,    right: 8,   height: 8 } : {}),
        ...(dir === 's'  ? { bottom: -4, left: 8,    right: 8,   height: 8 } : {}),
        ...(dir === 'w'  ? { left: -4,   top: 8,     bottom: 8,  width: 8  } : {}),
        ...(dir === 'e'  ? { right: -4,  top: 8,     bottom: 8,  width: 8  } : {}),
        ...(dir === 'nw' ? { top: -4,    left: -4,   width: 14,  height: 14 } : {}),
        ...(dir === 'ne' ? { top: -4,    right: -4,  width: 14,  height: 14 } : {}),
        ...(dir === 'sw' ? { bottom: -4, left: -4,   width: 14,  height: 14 } : {}),
        ...(dir === 'se' ? { bottom: -4, right: -4,  width: 14,  height: 14 } : {}),
      }}
    />
  )

  const classes = [
    'os-window',
    win.focused   ? 'focused'   : '',
    win.maximized ? 'maximized' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      style={{
        left:   rect.x,
        top:    rect.y,
        width:  rect.width,
        height: rect.height,
        zIndex: win.zIndex,
        // smooth transition only for maximize/restore, not drag/resize
        transition: (win.maximized || (!isDragging.current && !isResizing.current))
          ? 'left 0.15s ease, top 0.15s ease, width 0.15s ease, height 0.15s ease'
          : undefined,
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
