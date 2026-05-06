import { useRef, useState } from 'react'
import { useOSStore } from '@/store/osStore'
import type { WindowState } from '@/store/osStore'

interface Props {
  window: WindowState
}

export default function Window({ window: win }: Props) {
  const { closeWindow, focusWindow, updateWindowPos } = useOSStore()
  const dragOffset = useRef<{ x: number; y: number } | null>(null)
  const [pos, setPos] = useState({ x: win.x, y: win.y })

  const onMouseDown = (e: React.MouseEvent) => {
    focusWindow(win.id)
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragOffset.current) return
      const nx = ev.clientX - dragOffset.current.x
      const ny = Math.max(0, ev.clientY - dragOffset.current.y)
      setPos({ x: nx, y: ny })
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

  return (
    <div
      className={`os-window${win.focused ? ' focused' : ''}`}
      style={{ left: pos.x, top: pos.y, width: win.width, height: win.height, zIndex: win.zIndex }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div className="window-titlebar" onMouseDown={onMouseDown}>
        <div className="window-dots">
          <button className="dot dot-close" onClick={() => closeWindow(win.id)} />
          <div className="dot dot-min" />
          <div className="dot dot-max" />
        </div>
        <span className="window-title">{win.title}</span>
      </div>
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
