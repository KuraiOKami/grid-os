// ── RepHUD.tsx ───────────────────────────────────────────────────────────────
// Compact dual-bar reputation display for the taskbar.

import { useRepStore } from '@/store/reputationStore'

const BAR_W = 64

export default function RepHUD() {
  const compliance      = useRepStore(s => s.compliance)
  const shadow          = useRepStore(s => s.shadow)
  const complianceLabel = useRepStore(s => s.complianceLabel)()
  const shadowLabel     = useRepStore(s => s.shadowLabel)()

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <RepBar
        label="GRID"
        value={compliance}
        tier={complianceLabel}
        fillColor="#00e5ff"
        dangerColor="#ff3b5c"
        danger={compliance < 30}
      />
      <RepBar
        label="SHADOW"
        value={shadow}
        tier={shadowLabel}
        fillColor="#d6a2ff"
        dangerColor="#ffaa00"
        danger={shadow < 30}
      />
    </div>
  )
}

function RepBar({ label, value, tier, fillColor, dangerColor, danger }: {
  label: string
  value: number
  tier: string
  fillColor: string
  dangerColor: string
  danger: boolean
}) {
  const color = danger ? dangerColor : fillColor
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: 9, letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace" }}>
        <span style={{ color: '#6b6b80' }}>{label}</span>
        <span style={{ color }}>{tier}</span>
      </div>
      <div style={{ width: BAR_W, height: 4, background: '#2a2a3a', borderRadius: 999 }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
          transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1), background 0.3s',
          boxShadow: `0 0 6px ${color}66`,
        }} />
      </div>
    </div>
  )
}
