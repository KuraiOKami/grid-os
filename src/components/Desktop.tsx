import { useEffect, useRef } from 'react'
import { useOSStore } from '@/store/osStore'
import Window from './Window'
import DesktopIcon from './DesktopIcon'

export default function Desktop() {
  const windows     = useOSStore(s => s.windows)
  const openApp     = useOSStore(s => s.openApp)
  const setDesktopRef = useOSStore(s => s.setDesktopRef)

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDesktopRef(ref.current)
    return () => setDesktopRef(null)
  }, [])

  return (
    <div className="desktop" ref={ref}>
      <div className="desktop-icons">
        <DesktopIcon icon="WWW" label="Browser"     onOpen={() => openApp('browser')} />
        <DesktopIcon icon=">_"  label="Terminal"    onOpen={() => openApp('terminal')} />
        <DesktopIcon icon="/fs" label="File System" onOpen={() => openApp('files')} />
        <DesktopIcon icon="▪▪"  label="Job Board"   onOpen={() => openApp('jobs')} />
      </div>
      {windows.map(w => <Window key={w.id} window={w} />)}
    </div>
  )
}
