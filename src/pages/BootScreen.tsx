import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LINES = [
  { t: 'GridOS v4.1.7 — Copyright © GridOS Corp. All rights reserved.', hi: false },
  { t: 'Initializing kernel........................................... OK', hi: false },
  { t: 'Mounting encrypted volumes................................... OK', hi: false },
  { t: 'Loading user profile......................................... OK', hi: false },
  { t: 'Connecting to GridNet........................................ OK', hi: false },
  { t: 'Starting desktop environment.................................', hi: false },
  { t: '', hi: false },
  { t: '> Welcome back, User.', hi: true },
] as const

const C = { bg:'#0a0a0f', muted:'#6b6b80', accent:'#00e5ff' }

export default function BootScreen() {
  const navigate = useNavigate()
  const [lines, setLines] = useState<(typeof LINES)[number][]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const id = window.setInterval(() => {
      if (i >= LINES.length) {
        window.clearInterval(id)
        setDone(true)
        return
      }

      const nextLine = LINES[i]
      if (nextLine) setLines(prev => [...prev, nextLine])
      i += 1

      if (i >= LINES.length) {
        window.clearInterval(id)
        setDone(true)
      }
    }, 210)

    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!done) return
    const id = window.setTimeout(() => navigate('/os'), 900)
    return () => window.clearTimeout(id)
  }, [done, navigate])

  return (
    <div style={{ width:'100vw', height:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ maxWidth:640, width:'100%', padding:'48px 32px', fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>
        <div style={{ color:C.accent, fontSize:26, fontWeight:'bold', letterSpacing:'0.12em', marginBottom:28 }}>
          GRID<span style={{ color:C.muted }}>OS</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {lines.filter(Boolean).map((l, i) => (
            <div key={i} style={{ color: l.hi ? C.accent : C.muted }}>
              {l.t || '\u00A0'}
            </div>
          ))}
          {!done && (
            <div style={{ color:C.muted }}>
              <BlinkCursor />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BlinkCursor() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const id = window.setInterval(() => setOn(p => !p), 500)
    return () => window.clearInterval(id)
  }, [])
  return <span style={{ color:'#00e5ff' }}>{on ? '_' : '\u00A0'}</span>
}