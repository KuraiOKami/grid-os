import { useState, useEffect, useRef } from 'react'

// ── types ────────────────────────────────────────────────────────────────────
interface Win {
  id: string
  title: string
  icon: string
  x: number
  y: number
  w: number
  h: number
  z: number
  focused: boolean
}

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  surf2:   '#16161f',
  border:  '#2a2a3a',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
}

const APPS = [
  { id: 'browser',  title: 'GridBrowser', icon: 'WWW', w: 820, h: 540 },
  { id: 'terminal', title: 'Terminal',    icon: '>_ ', w: 620, h: 420 },
  { id: 'files',    title: 'File System', icon: '/fs', w: 660, h: 460 },
  { id: 'jobs',     title: 'Job Board',   icon: '[ ]', w: 700, h: 480 },
]

let _topZ = 10

// ── main component ───────────────────────────────────────────────────────────
export default function OSShell() {
  const [wins, setWins] = useState<Win[]>([])
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const openApp = (appId: string) => {
    const cfg = APPS.find(a => a.id === appId)!
    _topZ++
    const offset = wins.length * 28
    setWins(prev => [
      ...prev.map(w => ({ ...w, focused: false })),
      { id: `${appId}-${Date.now()}`, title: cfg.title, icon: cfg.icon,
        x: 130 + offset, y: 60 + offset, w: cfg.w, h: cfg.h,
        z: _topZ, focused: true },
    ])
  }

  const closeWin = (id: string) => setWins(prev => prev.filter(w => w.id !== id))

  const focusWin = (id: string) => {
    _topZ++
    setWins(prev => prev.map(w =>
      w.id === id ? { ...w, focused: true, z: _topZ } : { ...w, focused: false }
    ))
  }

  const moveWin = (id: string, x: number, y: number) =>
    setWins(prev => prev.map(w => w.id === id ? { ...w, x, y } : w))

  return (
    <div style={{ width:'100vw', height:'100vh', background:C.bg, display:'flex',
      flexDirection:'column', overflow:'hidden', fontFamily:"'JetBrains Mono',monospace" }}>

      {/* ── Desktop ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>

        {/* Desktop icons */}
        <div style={{ position:'absolute', top:24, left:24, display:'flex',
          flexDirection:'column', gap:20 }}>
          {APPS.map(app => (
            <DesktopIcon key={app.id} icon={app.icon} label={app.title}
              onClick={() => openApp(app.id)} />
          ))}
        </div>

        {/* Windows */}
        {wins.map(win => (
          <OsWindow key={win.id} win={win}
            onClose={() => closeWin(win.id)}
            onFocus={() => focusWin(win.id)}
            onMove={(x, y) => moveWin(win.id, x, y)} />
        ))}
      </div>

      {/* ── Taskbar ── */}
      <div style={{ height:40, background:C.surface, borderTop:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', padding:'0 12px', gap:8, flexShrink:0 }}>

        <button style={{ padding:'3px 14px', fontSize:11, fontWeight:'bold',
          color:C.accent, border:`1px solid ${C.accent}44`, borderRadius:4,
          background:'none', cursor:'pointer', fontFamily:'inherit' }}>
          GRID
        </button>

        <div style={{ width:1, height:20, background:C.border }} />

        <div style={{ flex:1, display:'flex', gap:4 }}>
          {wins.map(w => (
            <button key={w.id} onClick={() => focusWin(w.id)}
              style={{ padding:'3px 12px', fontSize:11, borderRadius:4, cursor:'pointer',
                fontFamily:'inherit', border:`1px solid ${w.focused ? C.accent+'66' : 'transparent'}`,
                background: w.focused ? C.accent+'22' : 'none',
                color: w.focused ? C.accent : C.muted }}>
              {w.title}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:14, fontSize:11, color:C.muted }}>
          <span style={{ color:C.success }}>● ONLINE</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  )
}

// ── Desktop Icon ─────────────────────────────────────────────────────────────
function DesktopIcon({ icon, label, onClick }: { icon:string; label:string; onClick:()=>void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'none', border:'none', cursor:'pointer', display:'flex',
        flexDirection:'column', alignItems:'center', gap:5, width:64, padding:0 }}>
      <div style={{ width:52, height:52, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:13, fontWeight:'bold', letterSpacing:1,
        background:C.surface, borderRadius:6, color: hov ? C.accent : C.muted,
        border:`1px solid ${hov ? C.accent : C.border}`,
        boxShadow: hov ? `0 0 12px ${C.accent}33` : 'none',
        transition:'all 0.15s', fontFamily:'inherit' }}>
        {icon}
      </div>
      <span style={{ fontSize:10, color: hov ? C.text : C.muted,
        textAlign:'center', lineHeight:1.3, transition:'color 0.15s' }}>
        {label}
      </span>
    </button>
  )
}

// ── OS Window ────────────────────────────────────────────────────────────────
function OsWindow({ win, onClose, onFocus, onMove }:
  { win:Win; onClose:()=>void; onFocus:()=>void; onMove:(x:number,y:number)=>void }) {

  const dragRef = useRef<{ ox:number; oy:number } | null>(null)

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    onFocus()
    dragRef.current = { ox: e.clientX - win.x, oy: e.clientY - win.y }
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return
      onMove(ev.clientX - dragRef.current.ox, Math.max(0, ev.clientY - dragRef.current.oy))
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div onMouseDown={onFocus}
      style={{ position:'absolute', left:win.x, top:win.y, width:win.w, height:win.h,
        zIndex:win.z, display:'flex', flexDirection:'column',
        background:C.surface, borderRadius:6,
        border:`1px solid ${win.focused ? C.accent+'55' : C.border}`,
        boxShadow: win.focused
          ? `0 8px 40px #00000088, 0 0 0 1px ${C.accent}18`
          : '0 4px 20px #00000066' }}>

      {/* Title bar */}
      <div onMouseDown={startDrag}
        style={{ height:32, display:'flex', alignItems:'center', padding:'0 12px', gap:8,
          borderBottom:`1px solid ${C.border}`, background:C.surf2,
          borderRadius:'6px 6px 0 0', flexShrink:0, cursor:'move', userSelect:'none' }}>

        <div style={{ display:'flex', gap:6 }}>
          <button onClick={(e) => { e.stopPropagation(); onClose() }}
            style={{ width:12, height:12, borderRadius:'50%', border:'none', cursor:'pointer',
              background:`${C.danger}bb` }} />
          <div style={{ width:12, height:12, borderRadius:'50%', background:`${C.warn}44` }} />
          <div style={{ width:12, height:12, borderRadius:'50%', background:`${C.success}44` }} />
        </div>

        <span style={{ flex:1, textAlign:'center', fontSize:11,
          color:C.muted, fontFamily:'inherit' }}>
          {win.title}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:'auto', display:'flex', alignItems:'center',
        justifyContent:'center', flexDirection:'column', gap:8 }}>
        <span style={{ fontSize:26, color:C.accent, fontFamily:'inherit',
          fontWeight:'bold' }}>{win.icon}</span>
        <span style={{ fontSize:12, color:C.muted }}>{win.title}</span>
        <span style={{ fontSize:10, color:C.faint }}>// coming soon</span>
      </div>
    </div>
  )
}
