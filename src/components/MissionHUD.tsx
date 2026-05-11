// ── MissionHUD.tsx ───────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useMissionStore } from '@/store/missionStore'
import type { MissionId } from '@/store/storyStore.shim'

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

  const hydrate            = useMissionStore(s => s.hydrate)
  const hydrated           = useMissionStore(s => s.hydrated)
  const loading            = useMissionStore(s => s.loading)
  const statuses           = useMissionStore(s => s.statuses)
  const missions           = useMissionStore(s => s.missions)
  const objectives         = useMissionStore(s => s.objectives)
  const completedObjectives = useMissionStore(s => s.completedObjectives)

  // Trigger hydration from Supabase on first mount.
  // hydrate() is a no-op if already loading or hydrated.
  useEffect(() => { hydrate() }, [hydrate])

  const activeId = (Object.keys(statuses) as MissionId[]).find(
    id => statuses[id] === 'active'
  ) ?? null

  if (!activeId) return null

  const activeMission = missions[activeId] ?? null
  const objRows       = objectives[activeId] ?? []
  const done          = objRows.filter(o => completedObjectives[o.id] === true).length
  const total         = objRows.length
  const title         = activeMission?.title ?? activeId
  const desc          = activeMission?.description ?? null

  // What to show in the objectives section
  const objectivesBody = () => {
    if (loading && !hydrated) {
      return (
        <div style={{ padding: '8px 12px', fontSize: 10, color: C.muted }}>
          Syncing…
        </div>
      )
    }
    if (objRows.length === 0) {
      return (
        <div style={{ padding: '8px 12px', fontSize: 10, color: C.muted }}>
          No objectives defined.
        </div>
      )
    }
    return (
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {objRows.map(obj => {
          const complete = completedObjectives[obj.id] === true
          return (
            <div key={obj.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              opacity: complete ? 0.45 : 1,
            }}>
              <span style={{
                color: complete ? C.success : C.warn,
                fontSize: 13, lineHeight: 1.2, flexShrink: 0, marginTop: 1,
              }}>
                {complete ? '\u2713' : '\u25cb'}
              </span>
              <span style={{
                fontSize: 10, color: complete ? C.muted : C.text,
                lineHeight: 1.5, textDecoration: complete ? 'line-through' : 'none',
              }}>
                {obj.description}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* Compact pill */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '3px 10px',
          background: open ? C.faint : 'none',
          border: `1px solid ${open ? C.warn + '80' : C.border}`,
          borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 10, color: C.muted, whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: C.warn, fontWeight: 'bold', letterSpacing: 1 }}>MISSION</span>
        <span style={{ color: C.text, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </span>
        {total > 0 && (
          <span style={{ color: done === total ? C.success : C.warn }}>{done}/{total}</span>
        )}
        <span style={{ color: C.muted, fontSize: 9 }}>{open ? '\u25be' : '\u25b4'}</span>
      </button>

      {/* Upward dropdown */}
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', bottom: '110%', left: 0,
            width: 300, background: C.bg,
            border: `1px solid ${C.border}`, borderRadius: 6,
            overflow: 'hidden', zIndex: 200,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
          }}>
            {/* Header */}
            <div style={{
              padding: '8px 12px', background: C.surface,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: C.warn, fontWeight: 'bold', fontSize: 10, letterSpacing: 1 }}>MISSION</span>
              <span style={{ color: C.text, fontWeight: 'bold', fontSize: 11 }}>{title}</span>
              {total > 0 && <span style={{ color: C.muted, fontSize: 10 }}>{done}/{total}</span>}
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div style={{ height: 2, background: C.faint }}>
                <div style={{
                  width: `${Math.round((done / total) * 100)}%`,
                  height: '100%',
                  background: done === total ? C.success : C.warn,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            )}

            {/* Briefing */}
            {desc && (
              <div style={{
                padding: '8px 12px', fontSize: 10, color: C.muted,
                lineHeight: 1.6, borderBottom: `1px solid ${C.border}`,
              }}>
                {desc}
              </div>
            )}

            {/* Objectives */}
            {objectivesBody()}
          </div>
        </>
      )}
    </div>
  )
}
