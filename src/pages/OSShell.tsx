import Taskbar from '@/components/Taskbar'
import Desktop from '@/components/Desktop'

export default function OSShell() {
  return (
    <div className="os-shell scanlines">
      <Desktop />
      <Taskbar />
    </div>
  )
}
