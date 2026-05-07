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
  minimized: boolean
  maximized: boolean
  restoreRect: { x: number; y: number; width: number; height: number }
}

interface OSStore {
  windows: WindowState[]
  topZ: number
  desktopRef: HTMLElement | null
  setDesktopRef: (el: HTMLElement | null) => void
  openApp: (appId: string) => void
  openSystemPanel: (panelId: 'settings' | 'connections' | 'citizen-id') => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  updateWindowPos: (id: string, x: number, y: number) => void
  updateWindowSize: (id: string, width: number, height: number) => void
  minimizeWindow: (id: string) => void
  restoreWindow: (id: string) => void
  toggleMaximize: (id: string) => void
}

const APP_DEFAULTS: Record<string, { title: string; icon: string; width: number; height: number }> = {
  browser:      { title: 'GridBrowser', icon: 'WWW', width: 820, height: 540 },
  terminal:     { title: 'Terminal',    icon: '>_',  width: 620, height: 420 },
  files:        { title: 'File System', icon: '/fs', width: 660, height: 460 },
  jobs:         { title: 'Job Board',   icon: '\u25a0\u25a0', width: 700, height: 480 },
}

const PANEL_DEFAULTS: Record<string, { title: string; icon: string; width: number; height: number }> = {
  'settings':    { title: 'Settings',    icon: '[=]', width: 480, height: 520 },
  'connections': { title: 'Connections', icon: '[~]', width: 540, height: 500 },
  'citizen-id':  { title: 'Citizen ID',  icon: '[i]', width: 400, height: 560 },
}

function getDesktopSize(desktopRef: HTMLElement | null) {
  if (desktopRef) {
    return { dw: desktopRef.clientWidth, dh: desktopRef.clientHeight }
  }
  return { dw: window.innerWidth, dh: window.innerHeight - 40 }
}

export const useOSStore = create<OSStore>((set, get) => ({
  windows: [],
  topZ: 10,
  desktopRef: null,

  setDesktopRef: (el) => set({ desktopRef: el }),

  openApp: (appId) => {
    const { topZ, windows } = get()
    const newZ = topZ + 1
    const id = `${appId}-${Date.now()}`
    const cfg = APP_DEFAULTS[appId] ?? { title: appId, icon: '?', width: 600, height: 400 }
    const offset = windows.length * 24
    const rect = { x: 120 + offset, y: 60 + offset, width: cfg.width, height: cfg.height }
    const win: WindowState = {
      id,
      title: cfg.title,
      icon: cfg.icon,
      content: null,
      ...rect,
      zIndex: newZ,
      focused: true,
      minimized: false,
      maximized: false,
      restoreRect: rect,
    }
    set({
      topZ: newZ,
      windows: [...windows.map(w => ({ ...w, focused: false })), win],
    })
  },

  // System panels are singletons — if already open, just focus them
  openSystemPanel: (panelId) => {
    const { windows, topZ } = get()
    const existing = windows.find(w => w.id === `sys-${panelId}`)
    if (existing) {
      const newZ = topZ + 1
      set(state => ({
        topZ: newZ,
        windows: state.windows.map(w =>
          w.id === existing.id
            ? { ...w, focused: true, minimized: false, zIndex: newZ }
            : { ...w, focused: false }
        ),
      }))
      return
    }

    // Lazy-load content to avoid circular deps at module level
    let content: ReactNode = null
    if (panelId === 'settings') {
      const SettingsApp = require('./settingsContent').default
      content = <SettingsApp />
    }
    if (panelId === 'connections') {
      const ConnectionsApp = require('./connectionsContent').default
      content = <ConnectionsApp />
    }
    if (panelId === 'citizen-id') {
      const CitizenIDApp = require('./citizenIdContent').default
      content = <CitizenIDApp />
    }

    const newZ = topZ + 1
    const cfg  = PANEL_DEFAULTS[panelId]
    const { dw, dh } = getDesktopSize(get().desktopRef)
    const x = Math.round((dw - cfg.width)  / 2)
    const y = Math.round((dh - cfg.height) / 2)
    const rect = { x, y, width: cfg.width, height: cfg.height }

    const win: WindowState = {
      id:    `sys-${panelId}`,
      title: cfg.title,
      icon:  cfg.icon,
      content,
      ...rect,
      zIndex:      newZ,
      focused:     true,
      minimized:   false,
      maximized:   false,
      restoreRect: rect,
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
        w.id === id
          ? { ...w, focused: true, zIndex: newZ }
          : { ...w, focused: false }
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
          return {
            ...w,
            maximized: false,
            x:      w.restoreRect.x,
            y:      w.restoreRect.y,
            width:  w.restoreRect.width,
            height: w.restoreRect.height,
          }
        } else {
          return {
            ...w,
            maximized: true,
            restoreRect: { x: w.x, y: w.y, width: w.width, height: w.height },
            x: 0, y: 0,
            width: dw, height: dh,
          }
        }
      }),
    }))
  },
}))
