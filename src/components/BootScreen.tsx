// ── BootScreen.tsx ──────────────────────────────────────────────────────────
// Plays once per session (in-memory flag). Terminal-style boot sequence
// then fades out and calls onDone() to reveal the desktop.

import { useEffect, useRef, useState } from 'react'

const LINES = [
  { text: 'GRIDOS v4.1.2  //  kernel: GRID-XENON', delay: 0,    color: '#00e5ff' },
  { text: '', delay: 300 },
  { text: '> mounting filesystem...', delay: 500 },
  { text: '  [OK]  /fs mounted at root', delay: 900,  color: '#00cc88' },
  { text: '> loading citizen profile...', delay: 1200 },
  { text: '  [OK]  profile: UNASSIGNED — awaiting registration', delay: 1600, color: '#00cc88' },
  { text: '> syncing compliance ledger...', delay: 2000 },
  { text: '  [OK]  GRID: 0  SHADOW: 0', delay: 2350, color: '#00cc88' },
  { text: '> connecting to grid relay...', delay: 2700 },
  { text: '  [OK]  node online  //  ip: 10.grid.88.44', delay: 3100, color: '#00cc88' },
  { text: '> scanning inbox...', delay: 3500 },
  { text: '  [!]  5 unread messages', delay: 3850, color: '#ffaa00' },
  { text: '', delay: 4200 },
  { text: '> launching shell...', delay: 4500, color: '#00e5ff' },
]

const TOTAL_MS = 5200   // when fade-out starts
const FADE_MS  = 600

interface Props { onDone: () => void }

export default function BootScreen({ onDone }: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [fading,       setFading]       = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    LINES.forEach((line, i) => {
      timerRef.current = setTimeout(() =>
        setVisibleCount(c => Math.max(c, i + 1)),
        line.delay
      )
    })
    const fadeTimer = setTimeout(() => setFading(true), TOTAL_MS)
    const doneTimer = setTimeout(onDone, TOTAL_MS + FADE_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: `opacity ${FADE_MS}ms ease`,
      opacity: fading ? 0 : 1,
      pointerEvents: fading ? 'none' : 'all',
    }}>
      <div style={{
        width: 560,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        lineHeight: 1.8,
      }}>
        {LINES.slice(0, visibleCount).map((line, i) => (
          <div key={i} style={{ color: line.color ?? '#6b6b80' }}>
            {line.text || '\u00a0'}
          </div>
        ))}
        {/* blinking cursor */}
        {visibleCount >= LINES.length && !fading && (
          <BlinkCursor />
        )}
      </div>
    </div>
  )
}

function BlinkCursor() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setOn(v => !v), 530)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>
      {on ? '█' : '\u00a0'}
    </span>
  )
}
