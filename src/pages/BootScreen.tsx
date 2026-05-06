import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BOOT_LINES = [
  { text: 'GridOS v4.1.7 — Copyright © GridOS Corp. All rights reserved.', accent: false },
  { text: 'Initializing kernel... OK', accent: false },
  { text: 'Mounting encrypted volumes... OK', accent: false },
  { text: 'Loading user profile... OK', accent: false },
  { text: 'Connecting to GridNet... OK', accent: false },
  { text: 'Starting desktop environment...', accent: false },
  { text: '', accent: false },
  { text: '> Welcome back, User.', accent: true },
]

export default function BootScreen() {
  const navigate = useNavigate()
  const [lines, setLines] = useState<typeof BOOT_LINES>( [])
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines(prev => [...prev, BOOT_LINES[i]])
        i++
      } else {
        clearInterval(interval)
        setDone(true)
      }
    }, 220)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate('/os'), 1000)
      return () => clearTimeout(t)
    }
  }, [done, navigate])

  return (
    <div className="boot-screen">
      <div className="boot-inner">
        <div className="boot-logo">GRID<span>OS</span></div>
        <div className="boot-lines">
          {lines.map((line, i) => (
            <div key={i} className={`boot-line${line.accent ? ' accent' : ''}`}>
              {line.text || '\u00A0'}
            </div>
          ))}
          {!done && <div className="boot-line cursor" />}
        </div>
      </div>
    </div>
  )
}
