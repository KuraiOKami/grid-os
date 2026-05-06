import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BOOT_LINES = [
  'GridOS v4.1.7 — Copyright © GridOS Corp. All rights reserved.',
  'Initializing kernel... OK',
  'Mounting encrypted volumes... OK',
  'Loading user profile... OK',
  'Connecting to GridNet... OK',
  'Starting desktop environment...',
  '',
  '> Welcome back, User.',
]

export default function BootScreen() {
  const navigate = useNavigate()
  const [lines, setLines] = useState<string[]>([])
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
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (done) {
      const timeout = setTimeout(() => navigate('/os'), 1200)
      return () => clearTimeout(timeout)
    }
  }, [done, navigate])

  return (
    <div className="w-full h-full bg-grid-bg flex items-center justify-center">
      <div className="w-full max-w-2xl px-8 py-12 font-mono text-sm">
        {/* GridOS Logo */}
        <div className="mb-8 text-grid-accent text-xl font-bold tracking-widest">
          ██████╗ ██████╗ ██╗██████╗  ██████╗ ███████╗
        </div>
        <div className="mb-8 text-grid-accent text-xl font-bold tracking-widest">
          GRID<span className="text-grid-muted">OS</span>
        </div>

        {/* Boot log */}
        <div className="space-y-1">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`${
                line.startsWith('>') ? 'text-grid-accent' : 'text-grid-muted'
              }`}
            >
              {line || '\u00A0'}
            </div>
          ))}
          {!done && <div className="text-grid-muted cursor" />}
        </div>
      </div>
    </div>
  )
}
