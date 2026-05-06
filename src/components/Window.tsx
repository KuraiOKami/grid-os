import { useRef } from 'react'
import { useOSStore } from '@/store/osStore'
import type { WindowState } from '@/store/osStore'

interface Props {
  window: WindowState
}

export default function Window({ window: win }: Props) {
  const { closeWindow, focusWindow } = useOSStore()
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      onMouseDown={() => focusWindow(win.id)}
      className="absolute bg-grid-surface border border-grid-border rounded
        shadow-lg flex flex-col animate-boot"
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
        borderColor: win.focused ? 'rgba(0,229,255,0.4)' : undefined,
      }}
    >
      {/* Title bar */}
      <div className="h-8 flex items-center px-3 gap-2 border-b border-grid-border
        bg-grid-surface2 rounded-t shrink-0">
        <div className="flex gap-1.5">
          <button
            onClick={() => closeWindow(win.id)}
            className="w-3 h-3 rounded-full bg-grid-danger/70
              hover:bg-grid-danger transition-colors"
          />
          <div className="w-3 h-3 rounded-full bg-grid-warn/40" />
          <div className="w-3 h-3 rounded-full bg-grid-success/40" />
        </div>
        <span className="text-xs font-mono text-grid-muted flex-1 text-center">
          {win.title}
        </span>
      </div>

      {/* Window content */}
      <div className="flex-1 overflow-auto">
        {win.content}
      </div>
    </div>
  )
}
