// ── MissionHUD.tsx ────────────────────────────────────────────────────────────
// Persistent desktop overlay showing the current active mission + objectives.
// Collapsible. Not a window — always sits on the desktop.

import { useState } from 'react'
import { useMissionStore } from '@/store/missionStore'

const C = {
  bg:      '#0d0d14',
  border:  '#2a2a3a',
  accent:  '#00e5ff',
  warn:    '#ffaa00',
  muted:   '#6b6b80',
  text:    '#c8c8d8',
  success: '#00cc88',
  faint:   '#1a1a26',
}

export default function MissionHUD() {
  const [collapsed, setCollapsed] = useState(false)
  const missions = useMissionStore(s => s.missions)

  // Show the earliest active mission
  const activeMission = Object.values(missions)
    .filter(m => m.status === 'active')[0] ?? null

  if (!activeMission) return null

  const done      = activeMission.objectives.filter(o => o.complete).length
  const total     = activeMission.objectives.length
  const allDone   = done === total
  const progress  = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div style={{
      position:   'absolute',
      top:        16,
      right:      16,
      width:      260,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize:   11,
      zIndex:     50,
      userSelect: 'none',
    }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          gap:            8,
          padding:        '6px 10px',
          background:     C.bg,
          border:         `1px solid ${C.border}`,
          borderBottom:   collapsed ? `1px solid ${C.border}` : 'none',
          borderRadius:   collapsed ? 6 : '6px 6px 0 0',
          cursor:         'pointer',
          color:          C.muted,
          fontFamily:     'inherit',
          fontSize:       10,
        }}
      >
        <span style={{ color: C.warn, fontWeight: 'bold', letterSpacing: 1 }}>
          MISSION
        </span>
        <span style={{ color: C.text, fontWeight: 'bold', flex: 1, textAlign: 'left' }}>
          {activeMission.title}
        </span>
        <span style={{ color: C.muted, fontSize: 9 }}>
          {done}/{total}
        </span>
        <span style={{ color: C.muted }}>{collapsed ? '▾' : '▴'}</span>
      </button>

      {/* Progress bar */}
      {!collapsed && (
        <div style={{ background: C.faint, height: 2 }}>
          <div style={{
            width:      `${progress}%`,
            height:     '100%',
            background: allDone ? C.success : C.warn,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {/* Body */}
      {!collapsed && (
        <div style={{
          background:   C.bg,
          border:       `1px solid ${C.border}`,
          borderTop:    'none',
          borderRadius: '0 0 6px 6px',
          padding:      '8px 10px',
        }}>
          {/* Briefing (truncated) */}
          {activeMission.description && (
            <div style={{
              color:        C.muted,
              fontSize:     10,
              lineHeight:   1.5,
              marginBottom: 8,
              paddingBottom:8,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {activeMission.description.length > 120
                ? activeMission.description.slice(0, 117) + '…'
                : activeMission.description}
            </div>
          )}

          {/* Objectives */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {activeMission.objectives.map(obj => (
              <div key={obj.id} style={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:        7,
                opacity:    obj.complete ? 0.45 : 1,
              }}>
                <span style={{
                  color:      obj.complete ? C.success : C.warn,
                  fontSize:   12,
                  lineHeight: 1.2,
                  flexShrink: 0,
                  marginTop:  1,
                }}>
                  {obj.complete ? '✓' : '○'}
                </span>
                <span style={{
                  color:          obj.complete ? C.muted : C.text,
                  lineHeight:     1.4,
                  textDecoration: obj.complete ? 'line-through' : 'none',
                }}>
                  {obj.label}
                </span>
              </div>
            ))}
          </div>

          {/* Giver */}
          {activeMission.giver && (
            <div style={{
              marginTop:  8,
              paddingTop: 8,
              borderTop:  `1px solid ${C.border}`,
              color:      C.muted,
              fontSize:   9,
              letterSpacing: 0.5,
            }}>
              SOURCE: {activeMission.giver.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
