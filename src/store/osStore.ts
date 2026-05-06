import { create } from 'zustand'
import type { ReactNode } from 'react'

export interface WindowState {
  id: string
  title: string
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
}

function getDefaultWindow(appId: string, zIndex: number): Omit<WindowState, 'id'> {
  const defaults: Record<string, Partial<WindowState>> = {
    browser:  { title: 'GridBrowser', width: 800, height: 520 },
    terminal: { title: 'Terminal', width: 600, height: 400 },
    files:    { title: 'File System', width: 640, height: 440 },
    jobs:     { title: 'Job Board', width: 680, height: 460 },
  }
  const offset = Math.random() * 80
  return {
    title: defaults[appId]?.title ?? appId,
    content: null,
    x: 100 + offset,
    y: 60 + offset,
    width: defaults[appId]?.width ?? 600,
    height: defaults[appId]?.height ?? 400,
    zIndex,
    focused: true,
  }
}

export const useOSStore = create<OSStore>((set, get) => ({
  windows: [],
  topZ: 10,

  openApp: (appId) => {
    const { topZ, windows } = get()
    const newZ = topZ + 1
    const id = `${appId}-${Date.now()}`
    const win: WindowState = {
      id,
      ...getDefaultWindow(appId, newZ),
      focused: true,
    }
    set({
      topZ: newZ,
      windows: [
        ...windows.map(w => ({ ...w, focused: false })),
        win,
      ],
    })
  },

  closeWindow: (id) => {
    set(state => ({ windows: state.windows.filter(w => w.id !== id) }))
  },

  focusWindow: (id) => {
    const { topZ } = get()
    const newZ = topZ + 1
    set(state => ({
      topZ: newZ,
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, focused: true, zIndex: newZ }
          : { ...w, focused: false }
      ),
    }))
  },
}))
