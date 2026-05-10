// ── MissionHUD.tsx ────────────────────────────────────────────────────────────
// Compact inline taskbar widget. Click to expand an upward dropdown.
// Never overlaps windows or desktop content.

import { useState } from 'react'
import { useMissionStore } from '@/store/missionStore'

const C = {
  bg:      '#0d0d14',
  border:  '#2a2a3a',
  surface: '#111118',
  accent:  '#00e5ff',
  warn:    '#ffaa00',
  muted:   '#6b6b80',
  text:    '#c8c8d8',
  success: '#00cc88',
  faint:   '#1a1a26',
}

export default function MissionHUD() {
  const [open, setOpen] = useState(false)
  const missions = useMissionStore(s => s.missions)

  const active = Object.values(missions).filter(m => m.status === 'active')[0] ?? null
  if (!active) return null

  const done  = active.objectives.filter(o => o.complete).length
  const total = active.objectives.length

  return (
    <div style={{ position: 'relative', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* Compact pill button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          padding:     '3px 10px',
          background:  open ? C.faint : 'none',
          border:      `1px solid ${open ? C.warn + '80' : C.border}`,
          borderRadius: 4,
          cursor:      'pointer',
          fontFamily:  'inherit',
          fontSize:    10,
          color:       C.muted,
          whiteSpace:  'nowrap',
        }}
      >
        <span style={{ color: C.warn, fontWeight: 'bold', letterSpacing: 1 }}>MISSION</span>
        <span style={{ color: C.text, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {active.title}
        </span>
        <span style={{ color: done === total ? C.success : C.warn }}>
          {done}/{total}
        </span>
        <span style={{ color: C.muted, fontSize: 9 }}>{open ? '▾' : '▴'}</span>
      </button>

      {/* Dropdown — opens upward from taskbar */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position:     'absolute',
            bottom:       '110%',
            left:         0,
            width:        300,
            background:   C.bg,
            border:       `1px solid ${C.border}`,
            borderRadius: 6,
            overflow:     'hidden',
            zIndex:       200,
            boxShadow:    '0 -4px 24px rgba(0,0,0,0.6)',
          }}>
            {/* Header */}
            <div style={{
              padding:        '8px 12px',
              background:     C.surface,
              borderBottom:   `1px solid ${C.border}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: C.warn, fontWeight: 'bold', fontSize: 10, letterSpacing: 1 }}>
                MISSION
              </span>
              <span style={{ color: C.text, fontWeight: 'bold', fontSize: 11 }}>
                {active.title}
              </span>
              <span style={{ color: C.muted, fontSize: 10 }}>{done}/{total}</span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: C.faint }}>
              <div style={{
                width:      `${total ? Math.round((done / total) * 100) : 0}%`,
                height:     '100%',
                background: done === total ? C.success : C.warn,
                transition: 'width 0.3s ease',
              }} />
            </div>

            {/* Briefing */}
            {active.description && (
              <div style={{
                padding:      '8px 12px',
                fontSize:     10,
                color:        C.muted,
                lineHeight:   1.6,
                borderBottom: `1px solid ${C.border}`,
              }}>
                {active.description}
              </div>
            )}

            {/* Objectives */}
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {active.objectives.map(obj => (
                <div key={obj.id} style={{
                  display:    'flex',
                  alignItems: 'flex-start',
                  gap:        8,
                  opacity:    obj.complete ? 0.45 : 1,
                }}>
                  <span style={{
                    color:      obj.complete ? C.success : C.warn,
                    fontSize:   13,
                    lineHeight: 1.2,
                    flexShrink: 0,
                    marginTop:  1,
                  }}>
                    {obj.complete ? '✓' : '○'}
                  </span>
                  <span style={{
                    fontSize:       10,
                    color:          obj.complete ? C.muted : C.text,
                    lineHeight:     1.5,
                    textDecoration: obj.complete ? 'line-through' : 'none',
                  }}>
                    {obj.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            {active.giver && (
              <div style={{
                padding:    '6px 12px',
                borderTop:  `1px solid ${C.border}`,
                fontSize:   9,
                color:      C.muted,
                letterSpacing: 0.5,
              }}>
                SOURCE: {active.giver.toUpperCase()}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
