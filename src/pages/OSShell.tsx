import Taskbar from '@/components/Taskbar'
import Desktop from '@/components/Desktop'

export default function OSShell() {
  return (
    <div className="w-full h-full bg-grid-bg flex flex-col scanlines animate-boot">
      {/* Desktop area */}
      <Desktop />
      {/* Taskbar always on bottom */}
      <Taskbar />
    </div>
  )
}
