// CitizenIDApp.tsx — Player's GridCorp-issued identity card
import { useRepStore } from '@/store/reputationStore'

const C = {
  bg:      'var(--grid-bg)',
  surface: 'var(--grid-surface)',
  surf2:   'var(--grid-surface2)',
  surf3:   '#1c1c26',
  border:  'var(--grid-border)',
  text:    'var(--grid-text)',
  muted:   'var(--grid-muted)',
  faint:   'var(--grid-faint)',
  accent:  'var(--grid-accent)',
  danger:  'var(--grid-danger)',
  warn:    'var(--grid-warn)',
  success: 'var(--grid-success)',
  violet:  '#d6a2ff',
}

// Deterministic pseudo-random grid based on citizen number — changes per score tier
function GlyphGrid({ seed, size = 7 }: { seed: number; size?: number }) {
  const cells: boolean[] = []
  let s = seed
  for (let i = 0; i < size * size; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    cells.push((s >>> 16 & 1) === 1)
  }
  // mirror left half to right for QR-like symmetry
  const mirrored = cells.map((v, i) => {
    const col = i % size
    if (col > size / 2) return cells[Math.floor(i / size) * size + (size - 1 - col)]
    return v
  })
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${size}, 1fr)`,
      gap: 2, width: 90, height: 90,
    }}>
      {mirrored.map((on, i) => (
        <div key={i} style={{
          borderRadius: 1,
          background: on ? C.accent : C.faint,
          opacity: on ? 1 : 0.4,
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

function RepRow({ label, value, color, bgColor }: {
  label: string; value: number; color: string; bgColor?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 4 }}>
        <span style={{ color: C.muted, letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: C.surf3, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: 2,
          transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  )
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 8, color: C.faint, letterSpacing: '0.12em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: accent ? C.accent : C.text }}>{value}</div>
    </div>
  )
}

export default function CitizenIDApp() {
  const compliance = useRepStore(s => s.compliance)
  const shadow     = useRepStore(s => s.shadow)
  const compLabel  = useRepStore(s => s.complianceLabel)()
  const shadLabel  = useRepStore(s => s.shadowLabel)()

  // Access tier drives card appearance
  const tier = compliance >= 80 ? 'SENIOR ANALYST'
    : compliance >= 55 ? 'ANALYST'
    : compliance >= 30 ? 'CITIZEN — STANDARD'
    : 'FLAGGED'

  const tierColor = compliance >= 55 ? C.accent
    : compliance >= 30 ? C.muted
    : C.danger

  // Card border glows based on compliance
  const cardGlow = compliance >= 55
    ? `0 0 0 1px ${C.accent}44, 0 0 24px ${C.accent}18`
    : compliance >= 30
    ? `0 0 0 1px ${C.border}`
    : `0 0 0 1px ${C.danger}66, 0 0 24px ${C.danger}18`

  const seed = 4471 + compliance * 3 + shadow

  return (
    <div style={{
      height: '100%', overflow: 'auto',
      fontFamily: "'JetBrains Mono', monospace",
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24,
      gap: 16,
    }}>
      <style>{`
        @keyframes cardFlicker {
          0%,100%{opacity:1} 97%{opacity:0.97} 98%{opacity:0.93} 99%{opacity:1}
        }
      `}</style>

      {/* The ID card */}
      <div style={{
        width: '100%', maxWidth: 340,
        background: C.surf2,
        border: `1px solid ${tierColor}44`,
        borderRadius: 10,
        boxShadow: cardGlow,
        padding: '20px',
        animation: 'cardFlicker 8s ease-in-out infinite',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Watermark grid lines */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #00e5ff 20px, #00e5ff 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, #00e5ff 20px, #00e5ff 21px)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.18em' }}>GRIDCORP AUTHORITY</div>
            <div style={{ fontSize: 14, color: tierColor, fontWeight: 'bold', marginTop: 2, letterSpacing: '0.05em' }}>
              CITIZEN ID
            </div>
          </div>
          <div style={{
            fontSize: 8, color: tierColor,
            border: `1px solid ${tierColor}66`,
            borderRadius: 4, padding: '3px 8px',
            alignSelf: 'flex-start',
            letterSpacing: '0.1em',
          }}>
            {tier}
          </div>
        </div>

        {/* Avatar + QR glyph */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {/* Avatar box */}
          <div style={{
            width: 64, height: 80, flexShrink: 0,
            background: C.surf3,
            border: `1px solid ${tierColor}44`,
            borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: tierColor,
          }}>
            [U]
          </div>

          <div style={{ flex: 1 }}>
            <Field label="FULL NAME"      value="[REDACTED]" />
            <Field label="CITIZEN NO."   value="#4471" accent />
            <Field label="ISSUED"        value="CYCLE 01 / Y.27" />
            <Field label="EXPIRES"       value="CYCLE 12 / Y.28" />
          </div>

          {/* Glyph / QR */}
          <div style={{ flexShrink: 0 }}>
            <GlyphGrid seed={seed} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `${tierColor}22`, margin: '12px 0' }} />

        {/* Rep scores */}
        <RepRow label="GRID COMPLIANCE" value={compliance} color={C.accent} />
        <RepRow label="SHADOW REP"      value={shadow}     color={C.violet} />

        {/* Tier labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ fontSize: 9, color: C.faint }}>
            GRID STATUS: <span style={{ color: C.accent }}>{compLabel.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 9, color: C.faint }}>
            STREET: <span style={{ color: C.violet }}>{shadLabel.toUpperCase()}</span>
          </div>
        </div>

        {/* Footer strip */}
        <div style={{
          marginTop: 16, padding: '8px 10px',
          background: C.surf3,
          borderRadius: 4,
          fontSize: 8, color: C.faint, letterSpacing: '0.15em',
          borderTop: `1px solid ${C.border}`,
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          GC-AUTH ···· 4471 ···· {compliance >= 30 ? 'ACCESS PERMITTED' : 'ACCESS RESTRICTED'} ···· GRID-NET v2.4.1
        </div>
      </div>

      {/* Info note */}
      <div style={{ fontSize: 9, color: C.faint, textAlign: 'center', maxWidth: 280 }}>
        This card is issued by GridCorp Authority. Tampering is a Class-3 violation.
      </div>
    </div>
  )
}
