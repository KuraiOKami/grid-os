import { useState, useEffect } from 'react'
import { useOSStore } from '@/store/osStore'

export default function Taskbar() {
  const { windows, focusWindow } = useOSStore()
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="taskbar">
      <button className="taskbar-logo">GRID</button>
      <div className="taskbar-divider" />
      <div className="taskbar-windows">
        {windows.map(win => (
          <button
            key={win.id}
            className={`taskbar-btn${win.focused ? ' focused' : ''}`}
            onClick={() => focusWindow(win.id)}
          >
            {win.title}
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
