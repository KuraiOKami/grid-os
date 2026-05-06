import { useOSStore } from '@/store/osStore'

export default function Taskbar() {
  const { windows, focusWindow } = useOSStore()

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="h-10 bg-grid-surface border-t border-grid-border
      flex items-center px-3 gap-2 shrink-0">

      {/* Start / GridOS logo */}
      <button className="px-3 py-1 text-xs font-mono font-bold text-grid-accent
        border border-grid-accent/30 rounded hover:bg-grid-accent/10
        hover:border-grid-accent transition-all duration-150">
        GRID
      </button>

      <div className="w-px h-5 bg-grid-border" />

      {/* Open window buttons */}
      <div className="flex items-center gap-1 flex-1">
        {windows.map(win => (
          <button
            key={win.id}
            onClick={() => focusWindow(win.id)}
            className={`px-3 py-1 text-xs font-mono rounded transition-all duration-150
              ${
                win.focused
                  ? 'bg-grid-accent/20 text-grid-accent border border-grid-accent/40'
                  : 'text-grid-muted border border-transparent hover:border-grid-border hover:text-grid-text'
              }`
            }
          >
            {win.title}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div className="flex items-center gap-3 text-xs font-mono text-grid-muted">
        <span className="text-grid-success">● ONLINE</span>
        <span>{now}</span>
      </div>
    </div>
  )
}
