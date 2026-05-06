// ── MapApp.tsx ────────────────────────────────────────────────────────────────
// Physical world map. Move between locations, scan for signals,
// sniff open networks, and identify hack targets for the Terminal.

import { useState, useEffect } from 'react'
import { useMapStore } from '@/store/mapStore'
import { useRepStore } from '@/store/reputationStore'
import { useWalletStore } from '@/store/walletStore'
import { useFSStore } from '@/store/fsStore'
import {
  LOCATIONS, getLocation, isAdjacent, travelTime,
  type LocationSignal,
} from '@/data/locations'

const C = {
  bg:      '#090b12',
  surface: '#0d111a',
  surf2:   '#111520',
  border:  '#202636',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

const RISK_COLOR   = ['#00cc8888', '#ffaa0088', '#ff6b6b88', '#ff3b5c']
const RISK_LABEL   = ['NONE', 'LOW', 'MODERATE', 'HIGH']
const SIGNAL_COLOR: Record<string, string> = {
  wifi:      C.accent,
  bluetooth: C.violet,
  device:    C.warn,
  phone:     C.danger,
}
const SIGNAL_TAG: Record<string, string> = {
  wifi:      'WIFI',
  bluetooth: 'BT',
  device:    'DEVICE',
  phone:     'PHONE',
}

const SNIFF_DURATION_MS = 5_000
const MAP_W = 240
const MAP_H = 300

export default function MapApp() {
  const currentId      = useMapStore(s => s.currentLocationId)
  const travelTargetId = useMapStore(s => s.travelTargetId)
  const travelStarted  = useMapStore(s => s.travelStartedAt)
  const travelDuration = useMapStore(s => s.travelDurationMs)
  const scanned        = useMapStore(s => s.scanned)
  const startTravel    = useMapStore(s => s.startTravel)
  const cancelTravel   = useMapStore(s => s.cancelTravel)
  const tickTravel     = useMapStore(s => s.tickTravel)
  const markScanned    = useMapStore(s => s.markScanned)

  const applyEvent = useRepStore(s => s.applyEvent)

  const [selectedId,    setSelectedId]    = useState(currentId)
  const [sniffingId,    setSniffingId]    = useState<string | null>(null)
  const [sniffStarted,  setSniffStarted]  = useState(0)
  const [sniffResult,   setSniffResult]   = useState<string | null>(null)
  const [now,           setNow]           = useState(Date.now())
  const [arrivedAt,     setArrivedAt]     = useState<string | null>(null)

  // 1-second tick for travel + sniff progress
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now())
      const arrived = tickTravel()
      if (arrived) {
        const dest = useMapStore.getState().currentLocationId
        setSelectedId(dest)
        setArrivedAt(dest)
        setTimeout(() => setArrivedAt(null), 3000)
      }
      // Sniff completion
      if (sniffingId && Date.now() - sniffStarted >= SNIFF_DURATION_MS) {
        completeSniff()
      }
    }, 250)
    return () => clearInterval(id)
  }, [sniffingId, sniffStarted])

  // When travel completes, the selected view jumps to current location
  useEffect(() => {
    if (!travelTargetId) setSelectedId(currentId)
  }, [currentId, travelTargetId])

  function completeSniff() {
    if (!sniffingId) return
    const loc = getLocation(currentId)
    const sig = loc?.signals.find(s => s.id === sniffingId)
    setSniffingId(null)
    if (!sig?.sniffLoot) { setSniffResult('Nothing found.'); return }

    const loot = sig.sniffLoot
    if (loot.type === 'credits' && loot.amount) {
      if (loot.amount > 0) {
        useWalletStore.getState().credit(loot.amount, `Signal sniff: ${sig.name}`)
      }
      // High-risk locations cost compliance when snooping
      const location = getLocation(currentId)
      if ((location?.riskLevel ?? 0) >= 2) applyEvent({ compliance: -1 })
    }
    if (loot.type === 'data' && loot.filename && loot.content) {
      const fs = useFSStore.getState()
      fs.writeFile(['home', 'citizen', loot.filename], loot.content)
    }
    setSniffResult(loot.label)
    setTimeout(() => setSniffResult(null), 5000)
  }

  function handleTravel(destId: string) {
    if (travelTargetId) { cancelTravel(); return }
    const ms = travelTime(currentId, destId)
    startTravel(destId, ms)
  }

  const selected     = getLocation(selectedId) ?? LOCATIONS[0]
  const current      = getLocation(currentId)!
  const isScanned    = scanned.includes(selectedId)
  const isCurrent    = selectedId === currentId
  const isTraveling  = !!travelTargetId
  const adjacent     = isAdjacent(currentId, selectedId)
  const ttMs         = travelTime(currentId, selectedId)

  // Travel progress 0–1
  const travelPct = travelStarted && travelDuration
    ? Math.min(1, (now - travelStarted) / travelDuration)
    : 0

  // Sniff progress 0–1
  const sniffPct = sniffingId && sniffStarted
    ? Math.min(1, (now - sniffStarted) / SNIFF_DURATION_MS)
    : 0

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12, color: C.text, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 14, fontWeight: 'bold', color: C.success }}>[M]</span>
        <span style={{ fontSize: 13, fontWeight: 'bold', color: C.text }}>CITY MAP</span>
        <span style={{ color: C.faint }}>//</span>
        <span style={{ fontSize: 11, color: C.success }}>
          ● {current.name}
        </span>
        {isTraveling && (
          <span style={{ fontSize: 10, color: C.warn, marginLeft: 'auto' }}>
            ▶ EN ROUTE → {getLocation(travelTargetId!)?.name}
          </span>
        )}
        {arrivedAt && (
          <span style={{ fontSize: 10, color: C.success, marginLeft: 'auto' }}>
            ✓ Arrived at {getLocation(arrivedAt)?.name}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Map canvas */}
        <div style={{
          width: MAP_W + 1, flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          background: C.surface,
        }}>
          <div style={{ padding: '8px 10px 0', fontSize: 9, color: C.faint, letterSpacing: '0.1em' }}>
            NODE MAP
          </div>
          <div style={{ position: 'relative', width: MAP_W, height: MAP_H, flexShrink: 0 }}>
            {/* SVG connection lines */}
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: MAP_W, height: MAP_H, pointerEvents: 'none' }}
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            >
              {LOCATIONS.map(loc =>
                loc.connections.map(conn => {
                  const dest = getLocation(conn.id)
                  if (!dest) return null
                  // Only draw each line once (from lower ID)
                  if (loc.id > conn.id) return null
                  const active = (loc.id === currentId || conn.id === currentId)
                  const traveling = (loc.id === travelTargetId || conn.id === travelTargetId)
                  return (
                    <line
                      key={`${loc.id}-${conn.id}`}
                      x1={loc.mapX} y1={loc.mapY}
                      x2={dest.mapX} y2={dest.mapY}
                      stroke={traveling ? C.warn : active ? C.success + '66' : C.faint}
                      strokeWidth={traveling ? 1.5 : 1}
                      strokeDasharray={traveling ? '4 3' : 'none'}
                    />
                  )
                })
              )}
            </svg>

            {/* Location nodes */}
            {LOCATIONS.map(loc => {
              const isHere     = loc.id === currentId
              const isSelected = loc.id === selectedId
              const isEnRoute  = loc.id === travelTargetId
              const nodeColor  = isHere ? C.success : isEnRoute ? C.warn : C.muted

              return (
                <button
                  key={loc.id}
                  onClick={() => !isTraveling && setSelectedId(loc.id)}
                  style={{
                    position: 'absolute',
                    left:     loc.mapX - 36,
                    top:      loc.mapY - 22,
                    width:    72, height: 44,
                    background: isSelected ? `${nodeColor}18` : C.bg,
                    border: `1px solid ${isSelected ? nodeColor : isHere ? nodeColor + '88' : C.faint}`,
                    borderRadius: 6,
                    cursor: isTraveling ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    boxShadow: isSelected ? `0 0 10px ${nodeColor}44` : 'none',
                  }}
                >
                  <span style={{ fontSize: 9, color: nodeColor, fontWeight: 'bold', letterSpacing: '0.06em' }}>
                    {isHere ? '● YOU' : isEnRoute ? '▶ →' : loc.district.split(' ')[1] ?? loc.district}
                  </span>
                  <span style={{
                    fontSize: 8, color: isSelected ? C.text : C.muted,
                    maxWidth: 64, textAlign: 'center', lineHeight: 1.2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {loc.name.length > 12 ? loc.name.slice(0, 11) + '…' : loc.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{
            flex: 1, padding: '10px 12px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <LegendRow color={C.success} label="Current location" />
            <LegendRow color={C.warn}    label="Travel target"    />
            <LegendRow color={C.faint}   label="Unvisited"        />
          </div>
        </div>

        {/* Right: Location detail */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Location header */}
          <div style={{
            padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0,
          }}>
            <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em', marginBottom: 4 }}>
              {selected.district}
            </div>
            <div style={{ fontSize: 15, color: C.text, fontWeight: 'bold', marginBottom: 6 }}>
              {selected.name}
            </div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, marginBottom: 10 }}>
              {selected.flavor}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
              <span>
                risk:{' '}
                <span style={{ color: RISK_COLOR[selected.riskLevel] }}>
                  {RISK_LABEL[selected.riskLevel]}
                </span>
              </span>
              <span style={{ color: selected.gridCoverage ? C.danger : C.success }}>
                {selected.gridCoverage ? '⚠ GridOS monitored' : '● No GridOS coverage'}
              </span>
            </div>
          </div>

          {/* Travel progress (when traveling to selected or anywhere) */}
          {isTraveling && (
            <div style={{
              padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
              background: `${C.warn}0a`, flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: C.warn, marginBottom: 6, letterSpacing: '0.08em' }}>
                ▶ TRAVELING → {getLocation(travelTargetId!)?.name}
              </div>
              <ProgressBar pct={travelPct} color={C.warn} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: C.faint }}>
                <span>{Math.round(travelPct * 100)}%</span>
                <span>{Math.ceil((1 - travelPct) * travelDuration / 1000)}s remaining</span>
              </div>
              <button
                onClick={cancelTravel}
                style={{
                  marginTop: 8, fontSize: 10, color: C.muted,
                  background: 'none', border: `1px solid ${C.faint}`,
                  borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                cancel travel
              </button>
            </div>
          )}

          {/* Actions: scan / travel */}
          {!isTraveling && (
            <div style={{
              padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
              background: C.surface, flexShrink: 0,
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              {isCurrent ? (
                <button
                  onClick={() => markScanned(selectedId)}
                  style={actionBtn(C.accent, !isScanned)}
                >
                  {isScanned ? '✓ SCANNED' : 'SCAN SIGNALS'}
                </button>
              ) : adjacent ? (
                <button
                  onClick={() => handleTravel(selectedId)}
                  style={actionBtn(C.success, true)}
                >
                  TRAVEL — {Math.round(ttMs / 1000)}s
                </button>
              ) : (
                <span style={{ fontSize: 10, color: C.faint }}>
                  No direct route — travel to an adjacent node first.
                </span>
              )}
              {isCurrent && !isScanned && (
                <span style={{ fontSize: 10, color: C.faint }}>
                  Discover nearby signals
                </span>
              )}
            </div>
          )}

          {/* Sniff result toast */}
          {sniffResult && (
            <div style={{
              margin: '10px 16px 0', padding: '10px 12px',
              background: `${C.success}12`, border: `1px solid ${C.success}44`,
              borderRadius: 6, fontSize: 11, color: C.success,
            }}>
              ✓ {sniffResult}
            </div>
          )}

          {/* Signal list */}
          <div style={{ padding: '14px 16px', flex: 1 }}>
            {!isScanned ? (
              <div style={{ fontSize: 11, color: C.faint, paddingTop: 20, textAlign: 'center' }}>
                {isCurrent ? 'No signals discovered yet. Run a scan.' : 'Travel here to scan for signals.'}
              </div>
            ) : selected.signals.length === 0 ? (
              <div style={{ fontSize: 11, color: C.faint, paddingTop: 20, textAlign: 'center' }}>
                No signals detected at this location.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em', marginBottom: 4 }}>
                  SIGNALS — {selected.signals.length} DETECTED
                </div>
                {selected.signals.map(sig => (
                  <SignalCard
                    key={sig.id}
                    signal={sig}
                    isCurrent={isCurrent}
                    isSniffing={sniffingId === sig.id}
                    sniffPct={sniffingId === sig.id ? sniffPct : 0}
                    canSniff={!sniffingId && isCurrent && !sig.secured}
                    onSniff={() => { setSniffingId(sig.id); setSniffStarted(Date.now()); setSniffResult(null) }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Signal Card ───────────────────────────────────────────────────────────────

function SignalCard({ signal, isCurrent, isSniffing, sniffPct, canSniff, onSniff }: {
  signal:     LocationSignal
  isCurrent:  boolean
  isSniffing: boolean
  sniffPct:   number
  canSniff:   boolean
  onSniff:    () => void
}) {
  const color    = SIGNAL_COLOR[signal.type] ?? C.muted
  const tierDots = '★'.repeat(signal.tier) + '☆'.repeat(4 - signal.tier)

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${isSniffing ? color + '88' : C.border}`,
      borderRadius: 8, padding: '10px 12px',
      borderLeft: `3px solid ${color}${signal.secured ? '44' : ''}`,
    }}>
      {/* Signal header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          fontSize: 8, letterSpacing: '0.1em',
          color, border: `1px solid ${color}44`, borderRadius: 3,
          padding: '1px 5px', flexShrink: 0,
        }}>
          {SIGNAL_TAG[signal.type]}
        </span>
        <span style={{ fontSize: 12, color: signal.secured ? C.muted : C.text, flex: 1 }}>
          {signal.name}
        </span>
        <span style={{ fontSize: 10, color: C.faint, letterSpacing: '0.06em', flexShrink: 0 }}>
          {tierDots}
        </span>
        <span style={{
          fontSize: 8, letterSpacing: '0.08em', flexShrink: 0,
          color: signal.secured ? C.warn : C.success,
          border: `1px solid ${signal.secured ? C.warn + '44' : C.success + '44'}`,
          borderRadius: 3, padding: '1px 5px',
        }}>
          {signal.secured ? 'SECURED' : 'OPEN'}
        </span>
      </div>

      {signal.owner && (
        <div style={{ fontSize: 10, color: C.faint, marginBottom: 6 }}>owner: {signal.owner}</div>
      )}

      {/* Sniff progress */}
      {isSniffing && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color, marginBottom: 4 }}>Sniffing... {Math.round(sniffPct * 100)}%</div>
          <ProgressBar pct={sniffPct} color={color} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        {!signal.secured && isCurrent && (
          <button
            onClick={onSniff}
            disabled={!canSniff || isSniffing}
            style={signalBtn(color, canSniff && !isSniffing)}
          >
            {isSniffing ? 'SNIFFING…' : `SNIFF — ${Math.round(signal.sniffTimeMs / 1000)}s`}
          </button>
        )}

        {signal.hackNodeId && isCurrent && (
          <div style={{
            fontSize: 10, color: C.violet,
            border: `1px solid ${C.violet}44`, borderRadius: 4,
            padding: '4px 10px', background: `${C.violet}0d`,
          }}>
            HACK → Terminal: <span style={{ color: C.accent }}>connect {signal.hackNodeId}</span>
          </div>
        )}

        {signal.secured && !signal.hackNodeId && (
          <span style={{ fontSize: 10, color: C.faint }}>
            Requires Tier {signal.tier} breach — use Terminal
          </span>
        )}

        {signal.secured && signal.hackNodeId && !isCurrent && (
          <span style={{ fontSize: 10, color: C.faint }}>Travel here to interact</span>
        )}
      </div>
    </div>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 4, background: C.faint, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct * 100}%`,
        background: color, borderRadius: 2,
        transition: 'width 0.25s linear',
      }} />
    </div>
  )
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: C.faint }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      {label}
    </div>
  )
}

function actionBtn(color: string, active: boolean): React.CSSProperties {
  return {
    padding: '7px 16px', borderRadius: 6, fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold',
    letterSpacing: '0.06em', cursor: active ? 'pointer' : 'default',
    border: `1px solid ${active ? color + '88' : C.faint}`,
    background: active ? `${color}18` : 'none',
    color: active ? color : C.faint,
    transition: 'all 0.15s',
  }
}

function signalBtn(color: string, active: boolean): React.CSSProperties {
  return {
    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
    padding: '4px 10px', borderRadius: 4, cursor: active ? 'pointer' : 'not-allowed',
    border: `1px solid ${active ? color + '66' : C.faint}`,
    background: active ? `${color}12` : 'none',
    color: active ? color : C.faint,
    transition: 'all 0.15s',
  }
}
