// Taskbar.tsx — shows open windows; click minimizes focused / restores minimized
import { useState, useEffect } from 'react'
import { useOSStore } from '@/store/osStore'

export default function Taskbar() {
  const { windows, focusWindow, minimizeWindow, restoreWindow } = useOSStore()
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function handleTaskbarClick(id: string) {
    const win = windows.find(w => w.id === id)
    if (!win) return
    if (win.minimized) {
      restoreWindow(id)         // un-minimize + focus
    } else if (win.focused) {
      minimizeWindow(id)        // click focused window = minimize
    } else {
      focusWindow(id)           // click unfocused window = focus
    }
  }

  return (
    <div className="taskbar">
      <button className="taskbar-logo">GRID</button>
      <div className="taskbar-divider" />
      <div className="taskbar-windows">
        {windows.map(win => (
          <button
            key={win.id}
            className={[
              'taskbar-btn',
              win.focused && !win.minimized ? 'focused' : '',
              win.minimized ? 'minimized' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleTaskbarClick(win.id)}
            title={win.title}
          >
            <span className="taskbar-btn-icon">{win.icon}</span>
            <span className="taskbar-btn-label">{win.title}</span>
            {win.minimized && <span className="taskbar-minimized-dot" />}
          </button>
        ))}
      </div>
      <div className="taskbar-tray">
        <span className="status-online">● ONLINE</span>
        <span>{time}</span>
      </div>
    </div>
  )
}
