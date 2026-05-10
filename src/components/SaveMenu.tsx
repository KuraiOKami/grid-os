// ── SaveMenu.tsx ──────────────────────────────────────────────────────────────
// 3-slot save/load interface. Overlay on the desktop.

import { useState } from 'react'
import { createSave, loadSave, deleteSlot, getSlotMeta, newGame, fmtPlaytime, type SlotId } from '@/store/saveStore'

const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  border:  '#2a2a3a',
  accent:  '#00e5ff',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  success: '#00cc88',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  faint:   '#1a1a26',
}

interface Props {
  playtime:  number
  onClose:   () => void
}

export default function SaveMenu({ playtime, onClose }: Props) {
  const [slots, setSlots]       = useState(() => ([1, 2, 3] as SlotId[]).map(getSlotMeta))
  const [confirm, setConfirm]   = useState<{ action: string; slot?: SlotId } | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  function refresh() {
    setSlots(([1, 2, 3] as SlotId[]).map(getSlotMeta))
  }

  function flash(msg: string) {
    setFeedback(msg)
    setTimeout(() => setFeedback(null), 2000)
  }

  function save(slot: SlotId) {
    createSave(slot, playtime)
    refresh()
    flash(`Saved to slot ${slot}.`)
    setConfirm(null)
  }

  function load(slot: SlotId) {
    const ok = loadSave(slot)
    if (ok) { flash('Game loaded.'); setTimeout(onClose, 800) }
    else     flash('Load failed.')
    setConfirm(null)
  }

  function del(slot: SlotId) {
    deleteSlot(slot)
    refresh()
    flash(`Slot ${slot} cleared.`)
    setConfirm(null)
  }

  function fmtDate(ts: number) {
    return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const PHASE_LABEL: Record<number, string> = {
    0: 'Tutorial',
    1: 'Phase 1 — Discovery',
    2: 'Phase 2 — Underground',
    3: 'Phase 3 — Faction',
    4: 'Phase 4 — Convergence',
    5: 'Endgame',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{
        width: 640, background: C.bg,
        border: `1px solid ${C.border}`, borderRadius: 8,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 'bold', color: C.accent, letterSpacing: 2, fontSize: 11 }}>
            SYSTEM // SAVE &amp; LOAD
          </span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: C.muted, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit',
            }}
          >×</button>
        </div>

        {/* Feedback bar */}
        {feedback && (
          <div style={{
            padding: '8px 20px', fontSize: 11, color: C.success,
            background: '#001a0e', borderBottom: `1px solid ${C.border}`,
          }}>
            ✓ {feedback}
          </div>
        )}

        {/* Slots */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {([1, 2, 3] as SlotId[]).map((slot, i) => {
            const meta = slots[i]
            return (
              <div key={slot} style={{
                border: `1px solid ${C.border}`,
                borderRadius: 6, overflow: 'hidden',
              }}>
                {/* Slot header */}
                <div style={{
                  padding: '10px 16px',
                  background: C.faint,
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: meta ? `1px solid ${C.border}` : 'none',
                }}>
                  <span style={{ fontSize: 10, color: C.muted, letterSpacing: 2 }}>
                    SLOT {slot}
                  </span>
                  {meta && (
                    <>
                      <span style={{ color: C.accent, fontWeight: 'bold', fontSize: 12 }}>
                        @{meta.handle}
                      </span>
                      <span style={{ color: C.muted, fontSize: 10 }}>
                        CITIZEN #{meta.citizenId}
                      </span>
                      <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 10 }}>
                        {fmtDate(meta.savedAt)}
                      </span>
                    </>
                  )}
                  {!meta && (
                    <span style={{ color: C.faint, fontSize: 11 }}>Empty</span>
                  )}
                </div>

                {/* Slot detail */}
                {meta && (
                  <div style={{
                    padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    fontSize: 11, color: C.muted,
                  }}>
                    <span style={{ color: C.text }}>
                      {PHASE_LABEL[meta.phase] ?? `Phase ${meta.phase}`}
                    </span>
                    {meta.activeMission && (
                      <span>› {meta.activeMission}</span>
                    )}
                    <span style={{ marginLeft: 'auto' }}>
                      {fmtPlaytime(meta.playtime)} played
                    </span>
                  </div>
                )}

                {/* Slot actions */}
                <div style={{
                  padding: '8px 16px',
                  display: 'flex', gap: 8,
                  borderTop: meta ? `1px solid ${C.border}` : 'none',
                  background: C.bg,
                }}>
                  {meta ? (
                    <>
                      <Btn label="LOAD"    color={C.accent}  onClick={() => setConfirm({ action: 'load', slot })} />
                      <Btn label="SAVE"    color={C.success}  onClick={() => setConfirm({ action: 'save', slot })} />
                      <Btn label="DELETE"  color={C.danger}   onClick={() => setConfirm({ action: 'delete', slot })} />
                    </>
                  ) : (
                    <Btn label="SAVE HERE" color={C.success} onClick={() => setConfirm({ action: 'save', slot })} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* New Game */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 10, color: C.faint }}>
            New Game will clear all saves and reset citizen registration.
          </span>
          <button
            onClick={() => setConfirm({ action: 'newgame' })}
            style={{
              padding: '8px 20px', fontSize: 11, fontWeight: 'bold',
              background: 'none', border: `1px solid ${C.danger}`,
              color: C.danger, borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: 1,
            }}
          >
            NEW GAME
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: 28, width: 360,
            fontFamily: "'JetBrains Mono', monospace",
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: C.text, marginBottom: 8, fontWeight: 'bold' }}>
              {confirm.action === 'newgame' ? 'Start New Game?' :
               confirm.action === 'delete'  ? `Delete Slot ${confirm.slot}?` :
               confirm.action === 'load'    ? `Load Slot ${confirm.slot}?` :
               `Save to Slot ${confirm.slot}?`}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 24 }}>
              {confirm.action === 'newgame' ? 'All progress will be permanently lost.' :
               confirm.action === 'delete'  ? 'This save will be permanently deleted.' :
               confirm.action === 'load'    ? 'Unsaved progress will be lost.' :
               'Any existing save in this slot will be overwritten.'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirm(null)}
                style={{
                  padding: '8px 24px', background: 'none',
                  border: `1px solid ${C.faint}`, color: C.muted,
                  borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  if (confirm.action === 'newgame') newGame()
                  else if (confirm.action === 'save'   && confirm.slot) save(confirm.slot)
                  else if (confirm.action === 'load'   && confirm.slot) load(confirm.slot)
                  else if (confirm.action === 'delete' && confirm.slot) del(confirm.slot)
                }}
                style={{
                  padding: '8px 24px',
                  background: confirm.action === 'delete' || confirm.action === 'newgame' ? C.danger : C.accent,
                  border: 'none',
                  color: C.bg,
                  borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 'bold', fontSize: 11,
                }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Btn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px', fontSize: 10, fontWeight: 'bold',
        background: 'none', border: `1px solid ${color}44`,
        color, borderRadius: 4, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: 1, transition: 'border-color 0.15s',
      }}
    >
      {label}
    </button>
  )
}
