import { create } from 'zustand'
import type { ReactNode } from 'react'

export interface WindowState {
  id:          string
  title:       string
  icon:        string
  content:     ReactNode
  x:           number
  y:           number
  width:       number
  height:      number
  zIndex:      number
  focused:     boolean
  minimized:   boolean
  maximized:   boolean
  restoreRect: { x: number; y: number; width: number; height: number }
}

interface OSStore {
  windows:        WindowState[]
  topZ:           number
  desktopRef:     HTMLElement | null
  setDesktopRef:  (el: HTMLElement | null) => void
  openApp:        (appId: string) => void
  openWindow:     (cfg: { id: string; title: string; icon: string; content: ReactNode; width: number; height: number }) => void
  closeWindow:    (id: string) => void
  focusWindow:    (id: string) => void
  updateWindowPos:  (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
  minimizeWindow: (id: string) => void
  restoreWindow:  (id: string) => void
  toggleMaximize: (id: string) => void
}

const APP_DEFAULTS: Record<string, { title: string; icon: string; width: number; height: number }> = {
  browser:    { title: 'GridBrowser', icon: 'WWW',  width: 820, height: 540 },
  mail:       { title: 'Mail',        icon: '@',    width: 720, height: 500 },
  jobs:       { title: 'Job Board',   icon: '[ ]',  width: 700, height: 500 },
  appstore:   { title: 'App Store',   icon: '[+]',  width: 760, height: 520 },
  watch:      { title: 'Watch',       icon: '[W]',  width: 780, height: 520 },
  node:       { title: 'NODE',        icon: '[~]',  width: 780, height: 560 },
  terminal:   { title: 'Terminal',    icon: '>_',   width: 680, height: 440 },
  files:      { title: 'File System', icon: '/fs',  width: 720, height: 500 },
  map:        { title: 'City Map',    icon: '[M]',  width: 820, height: 540 },
  checkpoint: { title: 'Checkpoint',  icon: '[C]',  width: 900, height: 580 },
  databroker: { title: 'Data Broker', icon: '[$]',  width: 820, height: 540 },
  courier:    { title: 'Courier',     icon: '[>>]', width: 860, height: 560 },
  ops:        { title: 'OPS',         icon: '[!]',  width: 760, height: 520 },
  cipher:     { title: 'CIPHER',      icon: '[C]',  width: 680, height: 520 },
  relay:      { title: 'RELAY',       icon: '[R]',  width: 700, height: 540 },
  socket:     { title: 'SOCKET',      icon: '[S]',  width: 760, height: 520 },
}

function getDesktopSize(desktopRef: HTMLElement | null) {
  if (desktopRef) return { dw: desktopRef.clientWidth, dh: desktopRef.clientHeight }
  return { dw: window.innerWidth, dh: window.innerHeight - 44 }
}

export const useOSStore = create<OSStore>((set, get) => ({
  windows:    [],
  topZ:       10,
  desktopRef: null,

  setDesktopRef: (el) => set({ desktopRef: el }),

  openApp: (appId) => {
    const { topZ, windows, desktopRef } = get()
    const newZ   = topZ + 1
    const id     = `${appId}-${Date.now()}`
    const cfg    = APP_DEFAULTS[appId] ?? { title: appId, icon: '?', width: 600, height: 400 }
    const { dw, dh } = getDesktopSize(desktopRef)
    const offset = windows.length * 24
    const x = Math.min(120 + offset, dw - cfg.width  - 20)
    const y = Math.min( 60 + offset, dh - cfg.height - 20)
    const rect = { x, y, width: cfg.width, height: cfg.height }
    const win: WindowState = {
      id, title: cfg.title, icon: cfg.icon, content: null,
      ...rect, zIndex: newZ, focused: true, minimized: false, maximized: false, restoreRect: rect,
    }
    set({ topZ: newZ, windows: [...windows.map(w => ({ ...w, focused: false })), win] })
  },

  openWindow: ({ id, title, icon, content, width, height }) => {
    const { windows, topZ, desktopRef } = get()
    const newZ     = topZ + 1
    const existing = windows.find(w => w.id === id)

    if (existing) {
      set(state => ({
        topZ: newZ,
        windows: state.windows.map(w =>
          w.id === id
            ? { ...w, focused: true, minimized: false, zIndex: newZ }
            : { ...w, focused: false }
        ),
      }))
      return
    }

    const { dw, dh } = getDesktopSize(desktopRef)
    const x    = Math.round((dw - width)  / 2)
    const y    = Math.round((dh - height) / 2)
    const rect = { x, y, width, height }

    const win: WindowState = {
      id, title, icon, content,
      ...rect, zIndex: newZ, focused: true, minimized: false, maximized: false, restoreRect: rect,
    }
    set({ topZ: newZ, windows: [...windows.map(w => ({ ...w, focused: false })), win] })
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
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, x, y, ...(!w.maximized ? { restoreRect: { ...w.restoreRect, x, y } } : {}) }
          : w
      ),
    })),

  updateWindowSize: (id, width, height) =>
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, width, height, ...(!w.maximized ? { restoreRect: { ...w.restoreRect, width, height } } : {}) }
          : w
      ),
    })),

  minimizeWindow: (id) =>
    set(state => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, minimized: true, focused: false } : w
      ),
    })),

  restoreWindow: (id) => {
    const newZ = get().topZ + 1
    set(state => ({
      topZ: newZ,
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, minimized: false, focused: true, zIndex: newZ }
          : { ...w, focused: false }
      ),
    }))
  },

  toggleMaximize: (id) => {
    const { desktopRef } = get()
    const { dw, dh } = getDesktopSize(desktopRef)
    set(state => ({
      windows: state.windows.map(w => {
        if (w.id !== id) return w
        if (w.maximized) {
          return { ...w, maximized: false, x: w.restoreRect.x, y: w.restoreRect.y, width: w.restoreRect.width, height: w.restoreRect.height }
        }
        return { ...w, maximized: true, restoreRect: { x: w.x, y: w.y, width: w.width, height: w.height }, x: 0, y: 0, width: dw, height: dh }
      }),
    }))
  },
}))
