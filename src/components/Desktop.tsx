import { useOSStore } from '@/store/osStore'
import Window from '@/components/Window'
import DesktopIcon from '@/components/DesktopIcon'

const APPS = [
  { id: 'browser',  label: 'Browser',     icon: 'WWW' },
  { id: 'terminal', label: 'Terminal',     icon: '>_'  },
  { id: 'files',    label: 'Files',        icon: '/fs' },
  { id: 'jobs',     label: 'Job Board',    icon: '\u25a0\u25a0' },
]

export default function Desktop() {
  const { windows, openApp } = useOSStore()

  return (
    <div className="desktop">
      <div className="desktop-icons">
        {APPS.map(app => (
          <DesktopIcon
            key={app.id}
            label={app.label}
            icon={app.icon}
            onClick={() => openApp(app.id)}
          />
        ))}
      </div>

      {windows.map(win => (
        <Window key={win.id} window={win} />
      ))}
    </div>
  )
}
