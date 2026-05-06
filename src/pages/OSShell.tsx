import { useState, useEffect, useRef } from 'react'
import GridBrowser from '@/apps/GridBrowser'
import JobBoard    from '@/apps/JobBoard'
import WatchApp   from '@/apps/WatchApp'
import RepHUD     from '@/components/RepHUD'

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
  { id: 'jobs',     title: 'Job Board',   icon: '[ ]', w: 700, h: 500 },
  { id: 'watch',   title: 'Watch',       icon: '■■■', w: 780, h: 520 },
]

let _topZ = 10

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
        <div style={{ position:'absolute', top:24, left:24,
          display:'flex', flexDirection:'column', gap:20 }}>
          {APPS.map(app => (
            <DesktopIcon key={app.id} icon={app.icon} label={app.title}
              accent={app.id === 'watch' ? C.danger : C.accent}
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
      <div style={{ height:44, background:C.surface, borderTop:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', padding:'0 12px', gap:8, flexShrink:0 }}>

        <button style={{ padding:'3px 14px', fontSize:11, fontWeight:'bold',
          color:C.accent, border:`1px solid ${C.accent}44`, borderRadius:4,
          background:'none', cursor:'pointer', fontFamily:'inherit' }}>
          GRID
        </button>

        <div style={{ width:1, height:20, background:C.border }} />

        {/* Open windows */}
        <div style={{ flex:1, display:'flex', gap:4 }}>
          {wins.map(w => (
            <button key={w.id} onClick={() => focusWin(w.id)}
              style={{ padding:'3px 12px', fontSize:11, borderRadius:4, cursor:'pointer',
                fontFamily:'inherit',
                border:`1px solid ${w.focused ? C.accent+'66' : 'transparent'}`,
                background: w.focused ? C.accent+'22' : 'none',
                color: w.focused ? C.accent : C.muted }}>
              {w.title}
            </button>
          ))}
        </div>

        {/* Rep HUD */}
        <RepHUD />

        <div style={{ width:1, height:20, background:C.border }} />

        <div style={{ display:'flex', gap:14, fontSize:11, color:C.muted }}>
          <span style={{ color:C.success }}>● ONLINE</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  )
}

// ── Desktop Icon ─────────────────────────────────────────────────────────────
function DesktopIcon({ icon, label, accent = '#00e5ff', onClick }:
  { icon:string; label:string; accent?:string; onClick:()=>void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'none', border:'none', cursor:'pointer', display:'flex',
        flexDirection:'column', alignItems:'center', gap:5, width:64, padding:0 }}>
      <div style={{ width:52, height:52, display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:13, fontWeight:'bold', letterSpacing:1,
        background:C.surface, borderRadius:6,
        color: hov ? accent : C.muted,
        border:`1px solid ${hov ? accent : C.border}`,
        boxShadow: hov ? `0 0 12px ${accent}33` : 'none',
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
  const isWatch = win.title === 'Watch'

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

  function renderBody() {
    if (win.title === 'GridBrowser') return <GridBrowser />
    if (win.title === 'Job Board')   return <JobBoard />
    if (win.title === 'Watch')       return <WatchApp />
    return (
      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
        justifyContent:'center', flexDirection:'column', gap:8 }}>
        <span style={{ fontSize:26, color:'#00e5ff', fontFamily:'inherit',
          fontWeight:'bold' }}>{win.icon}</span>
        <span style={{ fontSize:12, color:'#6b6b80' }}>{win.title}</span>
        <span style={{ fontSize:10, color:'#3a3a4a' }}>// coming soon</span>
      </div>
    )
  }

  // Watch window gets a red border instead of cyan
  const focusedBorder = isWatch ? '#ff3b5c55' : '#00e5ff55'
  const focusedGlow   = isWatch ? '#ff3b5c18' : '#00e5ff18'

  return (
    <div
      onMouseDown={onFocus}
      style={{ position:'absolute', left:win.x, top:win.y, width:win.w, height:win.h,
        zIndex:win.z, display:'flex', flexDirection:'column',
        background:'#111118', borderRadius:6,
        border:`1px solid ${win.focused ? focusedBorder : '#2a2a3a'}`,
        boxShadow: win.focused
          ? `0 8px 40px #00000088, 0 0 0 1px ${focusedGlow}`
          : '0 4px 20px #00000066' }}>

      {/* Title bar */}
      <div onMouseDown={startDrag}
        style={{ height:32, display:'flex', alignItems:'center', padding:'0 12px', gap:8,
          borderBottom:'1px solid #2a2a3a', background:'#16161f',
          borderRadius:'6px 6px 0 0', flexShrink:0, cursor:'move', userSelect:'none' }}>

        <div style={{ display:'flex', gap:6 }}>
          <button onClick={e => { e.stopPropagation(); onClose() }}
            style={{ width:12, height:12, borderRadius:'50%', border:'none',
              cursor:'pointer', background:'#ff3b5cbb' }} />
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#ffaa0044' }} />
          <div style={{ width:12, height:12, borderRadius:'50%', background:'#00cc8844' }} />
        </div>

        <span style={{ flex:1, textAlign:'center', fontSize:11,
          color: isWatch ? '#ff3b5c88' : '#6b6b80', fontFamily:'inherit' }}>
          {win.title}
        </span>
      </div>

      {/* Body — stopPropagation so clicks never bubble to the outer onMouseDown */}
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{ flex:1, overflow:'auto', display:'flex',
          alignItems:'stretch', justifyContent:'stretch',
          flexDirection:'column', minHeight:0 }}>
        {renderBody()}
      </div>
    </div>
  )
}
