import { useOSStore } from '@/store/osStore'
import Window from '@/components/Window'
import DesktopIcon from '@/components/DesktopIcon'

export default function Desktop() {
  const { windows, openApp } = useOSStore()

  return (
    <div className="flex-1 relative overflow-hidden select-none">
      {/* Desktop icons */}
      <div className="absolute top-6 left-6 flex flex-col gap-6">
        <DesktopIcon label="Browser" icon="🌐" onClick={() => openApp('browser')} />
        <DesktopIcon label="Terminal" icon=">_" onClick={() => openApp('terminal')} />
        <DesktopIcon label="File System" icon="📁" onClick={() => openApp('files')} />
        <DesktopIcon label="Jobs" icon="💼" onClick={() => openApp('jobs')} />
      </div>

      {/* Render open windows */}
      {windows.map(win => (
        <Window key={win.id} window={win} />
      ))}
    </div>
  )
}
