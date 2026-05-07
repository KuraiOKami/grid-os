// SettingsApp.tsx — System settings panel
import { useState } from 'react'

const C = {
  bg:      'var(--grid-bg)',
  surface: 'var(--grid-surface)',
  surf2:   'var(--grid-surface2)',
  border:  'var(--grid-border)',
  text:    'var(--grid-text)',
  muted:   'var(--grid-muted)',
  faint:   'var(--grid-faint)',
  accent:  'var(--grid-accent)',
  danger:  'var(--grid-danger)',
  warn:    'var(--grid-warn)',
  success: 'var(--grid-success)',
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: value ? C.accent : C.faint,
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      aria-checked={value}
      role="switch"
    >
      <span style={{
        position: 'absolute',
        top: 2, left: value ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: value ? '#000' : C.muted,
        transition: 'left 0.18s cubic-bezier(0.16,1,0.3,1)',
      }} />
    </button>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontSize: 12, color: C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 9, color: C.faint, letterSpacing: '0.14em',
        marginBottom: 8, fontWeight: 'bold',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function SettingsApp() {
  const [scanlines,   setScanlines]   = useState(true)
  const [soundFx,     setSoundFx]     = useState(true)
  const [ambientBg,   setAmbientBg]   = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [clockSec,    setClockSec]    = useState(true)
  const [confirmWipe, setConfirmWipe] = useState(false)

  return (
    <div style={{
      height: '100%', overflow: 'auto',
      fontFamily: "'JetBrains Mono', monospace",
      padding: '20px 24px',
      background: C.bg,
      color: C.text,
    }}>

      <Section title="DISPLAY">
        <Row label="Scanline overlay" sub="CRT scanline effect on desktop">
          <Toggle value={scanlines} onChange={setScanlines} />
        </Row>
        <Row label="Ambient background" sub="Subtle animated grid on desktop">
          <Toggle value={ambientBg} onChange={setAmbientBg} />
        </Row>
        <Row label="Compact UI" sub="Reduce padding in windows and taskbar">
          <Toggle value={compactMode} onChange={setCompactMode} />
        </Row>
      </Section>

      <Section title="AUDIO">
        <Row label="Sound effects" sub="UI clicks, notifications, alerts">
          <Toggle value={soundFx} onChange={setSoundFx} />
        </Row>
      </Section>

      <Section title="TASKBAR">
        <Row label="Show seconds in clock" sub="HH:MM:SS vs HH:MM">
          <Toggle value={clockSec} onChange={setClockSec} />
        </Row>
      </Section>

      <Section title="ACCOUNT">
        <Row label="Citizen #" sub="GridCorp-assigned identifier">
          <span style={{ fontSize: 11, color: C.accent }}>4471</span>
        </Row>
        <Row label="GridOS version" sub="Current build">
          <span style={{ fontSize: 11, color: C.muted }}>v0.4.1-dev</span>
        </Row>
        <Row label="Session token" sub="Active auth token">
          <span style={{ fontSize: 10, color: C.faint, letterSpacing: '0.06em' }}>GS-··········7F3A</span>
        </Row>
      </Section>

      <Section title="DANGER ZONE">
        {!confirmWipe ? (
          <Row label="Wipe save data" sub="Resets all progress. Cannot be undone.">
            <button
              onClick={() => setConfirmWipe(true)}
              style={{
                background: 'none', border: `1px solid ${C.danger}`,
                color: C.danger, borderRadius: 4, padding: '4px 12px',
                fontSize: 10, fontFamily: 'inherit', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#ff3b5c22')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              WIPE
            </button>
          </Row>
        ) : (
          <div style={{
            padding: '12px 0',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 11, color: C.danger, marginBottom: 10 }}>
              ⚠ This will delete all saved data. Are you sure?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmWipe(false)}
                style={{
                  flex: 1, background: 'none', border: `1px solid ${C.border}`,
                  color: C.muted, borderRadius: 4, padding: '6px 0',
                  fontSize: 10, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: dispatch wipe action when save system is built
                  setConfirmWipe(false)
                }}
                style={{
                  flex: 1, background: C.danger, border: 'none',
                  color: '#000', borderRadius: 4, padding: '6px 0',
                  fontSize: 10, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                CONFIRM WIPE
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
