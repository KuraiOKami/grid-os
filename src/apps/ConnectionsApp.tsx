// ConnectionsApp.tsx — Network connections panel
import { useState, useEffect } from 'react'
import { useNodeStore } from '@/store/nodeStore'

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
  violet:  '#d6a2ff',
}

type NodeEntry = {
  id: string
  label: string
  ip: string
  status: 'online' | 'offline' | 'restricted'
  ping: number | null
  type: 'corp' | 'public' | 'shadow' | 'system'
}

const MOCK_NODES: NodeEntry[] = [
  { id: 'gc-core',     label: 'GRIDCORP CORE',      ip: '10.0.0.1',    status: 'online',     ping: 4,    type: 'corp'   },
  { id: 'gc-cdn',      label: 'GC-CDN-01',          ip: '10.0.1.12',   status: 'online',     ping: 11,   type: 'corp'   },
  { id: 'gc-mail',     label: 'GC-MAIL',            ip: '10.0.2.5',    status: 'online',     ping: 8,    type: 'corp'   },
  { id: 'pub-dns',     label: 'PUBLIC DNS',         ip: '172.16.0.53', status: 'online',     ping: 23,   type: 'public' },
  { id: 'pub-news',    label: 'GRIDFEED NEWS',      ip: '172.16.4.20', status: 'online',     ping: 31,   type: 'public' },
  { id: 'pub-market',  label: 'GRIDMART',           ip: '172.16.8.9',  status: 'online',     ping: 19,   type: 'public' },
  { id: 'shadow-void', label: 'VOID-BAY',           ip: '192.168.x.x', status: 'restricted', ping: null, type: 'shadow' },
  { id: 'shadow-net',  label: 'THE SPLICE (NET)',   ip: '192.168.x.x', status: 'restricted', ping: null, type: 'shadow' },
  { id: 'sys-local',   label: 'LOCALHOST',          ip: '127.0.0.1',   status: 'online',     ping: 0,    type: 'system' },
]

const TYPE_COLOR: Record<NodeEntry['type'], string> = {
  corp:   '#00e5ff',
  public: '#00cc88',
  shadow: '#d6a2ff',
  system: '#6b6b80',
}

const STATUS_COLOR: Record<NodeEntry['status'], string> = {
  online:     '#00cc88',
  offline:    '#ff3b5c',
  restricted: '#ffaa00',
}

function PingDots({ ping }: { ping: number | null }) {
  if (ping === null) return <span style={{ color: '#ffaa00', fontSize: 9 }}>RESTRICTED</span>
  if (ping === 0)    return <span style={{ color: '#00cc88', fontSize: 9 }}>LOCAL</span>
  const bars = ping < 10 ? 4 : ping < 30 ? 3 : ping < 80 ? 2 : 1
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
      {[1,2,3,4].map(i => (
        <span key={i} style={{
          display: 'inline-block',
          width: 3,
          height: 3 + i * 2,
          borderRadius: 1,
          background: i <= bars ? '#00cc88' : '#3a3a4a',
          transition: 'background 0.3s',
        }} />
      ))}
      <span style={{ fontSize: 9, color: '#6b6b80', marginLeft: 4 }}>{ping}ms</span>
    </span>
  )
}

export default function ConnectionsApp() {
  const [vpn,       setVpn]       = useState(false)
  const [filter,    setFilter]    = useState<'all' | NodeEntry['type']>('all')
  const [pinging,   setPinging]   = useState(false)
  const [pings,     setPings]     = useState<Record<string, number | null>>(() =>
    Object.fromEntries(MOCK_NODES.map(n => [n.id, n.ping]))
  )
  const [scanAnim,  setScanAnim]  = useState(false)

  // Simulate a "ping all" sweep
  function runPingAll() {
    if (pinging) return
    setPinging(true)
    setScanAnim(true)
    const base = { ...pings }
    // stagger pings with small jitter
    MOCK_NODES.forEach((node, i) => {
      setTimeout(() => {
        setPings(p => ({
          ...p,
          [node.id]: node.ping !== null
            ? Math.max(0, node.ping + Math.floor(Math.random() * 6) - 3)
            : null,
        }))
        if (i === MOCK_NODES.length - 1) {
          setPinging(false)
          setTimeout(() => setScanAnim(false), 400)
        }
      }, i * 90 + 80)
    })
  }

  const visible = filter === 'all'
    ? MOCK_NODES
    : MOCK_NODES.filter(n => n.type === filter)

  const online = MOCK_NODES.filter(n => n.status === 'online').length

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: "'JetBrains Mono', monospace",
      background: C.bg, color: C.text,
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px 10px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}>
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#00cc88',
              boxShadow: '0 0 6px #00cc88',
              display: 'inline-block',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: C.text }}>
              {online} / {MOCK_NODES.length} nodes reachable
            </span>
          </div>
          <button
            onClick={runPingAll}
            disabled={pinging}
            style={{
              background: 'none',
              border: `1px solid ${pinging ? C.faint : C.accent}`,
              color: pinging ? C.faint : C.accent,
              borderRadius: 4, padding: '3px 10px',
              fontSize: 9, fontFamily: 'inherit', cursor: pinging ? 'default' : 'pointer',
              letterSpacing: '0.08em',
              transition: 'all 0.15s',
            }}
          >
            {pinging ? 'SCANNING...' : 'PING ALL'}
          </button>
        </div>

        {/* VPN toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px',
          background: vpn ? 'rgba(155,93,229,0.1)' : C.surf2,
          border: `1px solid ${vpn ? '#9b5de5' : C.border}`,
          borderRadius: 5,
        }}>
          <div>
            <div style={{ fontSize: 11, color: vpn ? C.violet : C.text }}>VPN Tunnel</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>
              {vpn ? 'Route via VOID-RELAY-03 · Hidden identity' : 'Direct connection · Identity exposed'}
            </div>
          </div>
          <button
            onClick={() => setVpn(v => !v)}
            style={{
              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: vpn ? C.violet : C.faint,
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: vpn ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: vpn ? '#1a0a2e' : C.muted,
              transition: 'left 0.18s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        flexShrink: 0,
      }}>
        {(['all', 'corp', 'public', 'shadow', 'system'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              flex: 1, border: 'none', cursor: 'pointer',
              background: 'none',
              padding: '7px 0',
              fontSize: 9, fontFamily: 'inherit',
              letterSpacing: '0.08em',
              color: filter === f ? C.accent : C.muted,
              borderBottom: filter === f ? `2px solid ${C.accent}` : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Node list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes scanLine {
            from { transform: translateY(-100%); opacity: 0.6; }
            to   { transform: translateY(400%);  opacity: 0; }
          }
        `}</style>
        {visible.map((node, i) => (
          <div
            key={node.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: scanAnim && i % 2 === 0 ? 'rgba(0,229,255,0.02)' : 'none',
              transition: 'background 0.3s',
            }}
          >
            {/* Status dot */}
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: STATUS_COLOR[node.status],
              boxShadow: node.status === 'online' ? `0 0 5px ${STATUS_COLOR[node.status]}` : 'none',
            }} />

            {/* Type badge */}
            <span style={{
              fontSize: 8, color: TYPE_COLOR[node.type],
              border: `1px solid ${TYPE_COLOR[node.type]}44`,
              borderRadius: 3, padding: '1px 5px',
              letterSpacing: '0.08em', flexShrink: 0,
            }}>
              {node.type.toUpperCase()}
            </span>

            {/* Label + IP */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node.label}
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 1 }}>{node.ip}</div>
            </div>

            {/* Ping */}
            <PingDots ping={pings[node.id] ?? node.ping} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 20px',
        borderTop: `1px solid ${C.border}`,
        background: C.surface,
        fontSize: 9, color: C.faint,
        display: 'flex', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span>GRID-NET v2.4.1</span>
        <span style={{ color: vpn ? C.violet : C.faint }}>
          {vpn ? '⬢ VPN ACTIVE' : '⬡ NO VPN'}
        </span>
      </div>
    </div>
  )
}
