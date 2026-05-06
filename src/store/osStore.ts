import { create } from 'zustand'
import type { ReactNode } from 'react'

export interface WindowState {
  id: string
  title: string
  icon: string
  content: ReactNode
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  focused: boolean
}

interface OSStore {
  windows: WindowState[]
  topZ: number
  openApp: (appId: string) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPos: (id: string, x: number, y: number) => void
}

const APP_DEFAULTS: Record<string, { title: string; icon: string; width: number; height: number }> = {
  browser:  { title: 'GridBrowser', icon: 'WWW', width: 820, height: 540 },
  terminal: { title: 'Terminal',    icon: '>_',  width: 620, height: 420 },
  files:    { title: 'File System', icon: '/fs', width: 660, height: 460 },
  jobs:     { title: 'Job Board',   icon: '\u25a0\u25a0', width: 700, height: 480 },
}

export const useOSStore = create<OSStore>((set, get) => ({
  windows: [],
  topZ: 10,

  openApp: (appId) => {
    const { topZ, windows } = get()
    const newZ = topZ + 1
    const id = `${appId}-${Date.now()}`
    const cfg = APP_DEFAULTS[appId] ?? { title: appId, icon: '?', width: 600, height: 400 }
    const offset = windows.length * 24
    const win: WindowState = {
      id,
      title: cfg.title,
      icon: cfg.icon,
      content: null,
      x: 120 + offset,
      y: 60 + offset,
      width: cfg.width,
      height: cfg.height,
      zIndex: newZ,
      focused: true,
    }
    set({
      topZ: newZ,
      windows: [...windows.map(w => ({ ...w, focused: false })), win],
    })
  },

  closeWindow: (id) =>
    set(state => ({ windows: state.windows.filter(w => w.id !== id) })),

  focusWindow: (id) => {
    const newZ = get().topZ + 1
    set(state => ({
      topZ: newZ,
      windows: state.windows.map(w =>
        w.id === id ? { ...w, focused: true, zIndex: newZ } : { ...w, focused: false }
      ),
    }))
  },

  updateWindowPos: (id, x, y) =>
    set(state => ({
      windows: state.windows.map(w => w.id === id ? { ...w, x, y } : w),
    })),
}))
