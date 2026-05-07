// ── CheckpointApp.tsx ─────────────────────────────────────────────────────────
// Papers, Please — GridOS edition.
// Review applicant documents, cross-reference the live database, stamp APPROVE
// or DENY with a reason. Wrong reasons count as wrong decisions. Timer per
// applicant. Quota pressure. The moral weight accumulates one stamp at a time.

import { useState, useEffect, useRef } from 'react'
import { useRepStore }    from '@/store/reputationStore'
import { useWalletStore } from '@/store/walletStore'
import { useCareerStore } from '@/store/careerStore'
import {
  SHIFT_01, DENY_REASONS,
  type CheckDoc, type DocField, type DenyReason,
} from '@/data/checkpoint'

const C = {
  bg:      '#080c10',
  surface: '#0c1018',
  surf2:   '#101520',
  surf3:   '#141a22',
  border:  '#1e2838',
  text:    '#c8d4e0',
  muted:   '#5a7080',
  faint:   '#2a3a48',
  accent:  '#00d4ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
  stamp_a: '#00cc88',
  stamp_d: '#ff3b5c',
}

const SHIFT = SHIFT_01
const TOTAL = SHIFT.applicants.length

const BULLETIN_TYPE_COLOR = {
  rule:    C.accent,
  update:  C.warn,
  notice:  C.muted,
  warning: C.danger,
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CheckpointApp() {
  const [phase,         setPhase]         = useState<'bulletin' | 'processing' | 'summary'>('bulletin')
  const [currentIdx,    setCurrentIdx]    = useState(0)
  const [activeDocIdx,  setActiveDocIdx]  = useState(0)
  const [timeLeft,      setTimeLeft]      = useState(SHIFT.timeLimit)
  const [dbOpen,        setDbOpen]        = useState(false)
  const [dbChecked,     setDbChecked]     = useState(false)
  const [interrogating, setInterrogating] = useState(false)
  const [extraRevealed, setExtraRevealed] = useState(false)
  const [showOutcome,   setShowOutcome]   = useState(false)
  const [lastDecision,  setLastDecision]  = useState<'approve'|'deny'|null>(null)
  const [lastCorrect,   setLastCorrect]   = useState(false)
  const [lastOutcome,   setLastOutcome]   = useState('')
  const [denyReason,    setDenyReason]    = useState<DenyReason|''>('')
  const [results,       setResults]       = useState<{
    handle: string; decision: 'approve'|'deny'; correct: boolean; pay: number
    compliance: number; shadow: number
  }[]>([])

  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const applyEvent    = useRepStore(s => s.applyEvent)
  const credit        = useWalletStore(s => s.credit)
  const addXP         = useCareerStore(s => s.addXP)

  const app        = SHIFT.applicants[currentIdx]
  const docs       = extraRevealed && app.extraDoc
    ? [...app.docs, app.extraDoc]
    : app.docs
  const activeDoc  = docs[Math.min(activeDocIdx, docs.length - 1)]
  const approvedN  = results.filter(r => r.decision === 'approve').length

  // Timer — runs during processing, paused during outcome/interrogate
  useEffect(() => {
    if (phase !== 'processing' || showOutcome || interrogating) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleDecision('deny', 'incomplete')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, showOutcome, interrogating, currentIdx])

  function startShift() {
    setPhase('processing')
    resetApplicant()
  }

  function resetApplicant() {
    setActiveDocIdx(0)
    setTimeLeft(SHIFT.timeLimit)
    setDbChecked(false)
    setDbOpen(false)
    setInterrogating(false)
    setExtraRevealed(false)
    setShowOutcome(false)
    setLastDecision(null)
    setDenyReason('')
  }

  function handleInterrogate() {
    if (!app.extraDoc || extraRevealed) return
    setInterrogating(true)
    setTimeout(() => {
      setInterrogating(false)
      setExtraRevealed(true)
      setActiveDocIdx(docs.length)   // jump to the new doc
    }, 4000)
  }

  function handleDecision(d: 'approve' | 'deny', reason?: DenyReason | 'incomplete') {
    if (timerRef.current) clearInterval(timerRef.current)
    const correct = d === 'approve'
      ? app.correct === 'approve'
      : app.correct === 'deny' && reason === app.correctReason
    const outcome = correct ? app.outcome.correct : app.outcome.wrong

    applyEvent({ compliance: outcome.compliance, shadow: outcome.shadow })
    addXP('auditor', correct ? 10 : 3)

    setResults(prev => [...prev, {
      handle: app.handle, decision: d, correct,
      pay: outcome.pay, compliance: outcome.compliance, shadow: outcome.shadow,
    }])
    setLastDecision(d)
    setLastCorrect(correct)
    setLastOutcome(outcome.text)
    setShowOutcome(true)
  }

  function nextApplicant() {
    if (currentIdx >= TOTAL - 1) {
      const totalPay = results.reduce((a, r) => a + r.pay, 0) +
        (results.filter(r => r.decision === 'approve').length >= SHIFT.quota ? SHIFT.shiftBonus : 0)
      credit(totalPay, `Checkpoint shift payout — ${SHIFT.title}`)
      setPhase('summary')
    } else {
      setCurrentIdx(i => i + 1)
      resetApplicant()
    }
  }

  // ── Bulletin phase ─────────────────────────────────────────────────────────
  if (phase === 'bulletin') {
    return (
      <div style={{
        height: '100%', background: C.bg, color: C.text,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 18px', borderBottom: `1px solid ${C.border}`,
          background: C.surf2, flexShrink: 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: C.accent, marginBottom: 2 }}>
            ■ {SHIFT.title}
          </div>
          <div style={{ fontSize: 10, color: C.muted }}>
            Cycle {SHIFT.cycle} · Quota: {SHIFT.quota} approvals · {TOTAL} applicants in queue
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.14em', marginBottom: 12 }}>
            SHIFT BULLETIN — CYCLE {SHIFT.cycle}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
            {SHIFT.bulletin.map((b, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '8px 12px',
                background: C.surface, borderRadius: 4,
                borderLeft: `3px solid ${BULLETIN_TYPE_COLOR[b.type]}`,
              }}>
                <span style={{
                  fontSize: 8, letterSpacing: '0.12em', flexShrink: 0,
                  color: BULLETIN_TYPE_COLOR[b.type], minWidth: 52, marginTop: 1,
                }}>
                  [{b.type.toUpperCase()}]
                </span>
                <span style={{ fontSize: 11, color: C.text, lineHeight: 1.6 }}>{b.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: '12px 14px', background: C.surf3,
            border: `1px solid ${C.border}`, borderRadius: 4, maxWidth: 640 }}>
            <div style={{ fontSize: 9, color: C.faint, marginBottom: 6, letterSpacing: '0.1em' }}>
              SHIFT PARAMETERS
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 11, color: C.muted }}>
              <span>Time per applicant: <span style={{ color: C.accent }}>{SHIFT.timeLimit}s</span></span>
              <span>Quota: <span style={{ color: C.accent }}>{SHIFT.quota} approvals</span></span>
              <span>Quota bonus: <span style={{ color: C.success }}>₳ {SHIFT.shiftBonus}</span></span>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.surf2 }}>
          <button
            onClick={startShift}
            style={{
              padding: '10px 28px', borderRadius: 4, fontSize: 12, fontWeight: 'bold',
              fontFamily: 'inherit', letterSpacing: '0.1em', cursor: 'pointer',
              background: `${C.accent}22`, border: `1px solid ${C.accent}88`, color: C.accent,
            }}
          >
            BEGIN SHIFT →
          </button>
        </div>
      </div>
    )
  }

  // ── Summary phase ──────────────────────────────────────────────────────────
  if (phase === 'summary') {
    const correct    = results.filter(r => r.correct).length
    const totalPay   = results.reduce((a, r) => a + r.pay, 0)
    const bonusPay   = results.filter(r => r.decision === 'approve').length >= SHIFT.quota ? SHIFT.shiftBonus : 0
    const totalCompliance = results.reduce((a, r) => a + r.compliance, 0)
    const totalShadow     = results.reduce((a, r) => a + r.shadow, 0)

    return (
      <div style={{
        height: '100%', background: C.bg, color: C.text,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 18px', borderBottom: `1px solid ${C.border}`,
          background: C.surf2, flexShrink: 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: C.muted }}>
            ■ SHIFT COMPLETE
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24,
          }}>
            {[
              { label: 'PROCESSED', value: TOTAL, color: C.text },
              { label: 'CORRECT',   value: `${correct}/${TOTAL}`, color: correct >= TOTAL * 0.7 ? C.success : C.danger },
              { label: 'APPROVED',  value: results.filter(r => r.decision === 'approve').length, color: C.accent },
              { label: 'QUOTA',     value: bonusPay > 0 ? 'MET' : 'MISSED', color: bonusPay > 0 ? C.success : C.danger },
            ].map(s => (
              <div key={s.label} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 4, padding: '10px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, color: s.color, fontWeight: 'bold' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Case log */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em', marginBottom: 8 }}>CASE LOG</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '6px 10px', background: C.surface,
                  border: `1px solid ${r.correct ? C.faint : C.danger + '44'}`,
                  borderRadius: 3,
                }}>
                  <span style={{ fontSize: 10, color: C.faint, minWidth: 18 }}>{i + 1}</span>
                  <span style={{ fontSize: 11, color: C.accent, flex: 1 }}>{r.handle}</span>
                  <span style={{
                    fontSize: 9, letterSpacing: '0.08em',
                    color: r.decision === 'approve' ? C.success : C.danger,
                    border: `1px solid ${r.decision === 'approve' ? C.success : C.danger}44`,
                    borderRadius: 3, padding: '1px 5px',
                  }}>
                    {r.decision.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 9, color: r.correct ? C.faint : C.danger }}>
                    {r.correct ? '✓ correct' : '✗ wrong'}
                  </span>
                  <span style={{ fontSize: 10, color: C.success, minWidth: 50, textAlign: 'right' }}>
                    ₳ {r.pay}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay summary */}
          <div style={{
            background: C.surf2, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: '12px 14px', maxWidth: 400,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: C.muted }}>Case pay</span>
              <span style={{ color: C.text }}>₳ {totalPay}</span>
            </div>
            {bonusPay > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.muted }}>Quota bonus</span>
                <span style={{ color: C.success }}>₳ {bonusPay}</span>
              </div>
            )}
            <div style={{ height: 1, background: C.border, margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.text }}>Total credited</span>
              <span style={{ color: C.success, fontWeight: 'bold' }}>₳ {totalPay + bonusPay}</span>
            </div>
            {(totalCompliance !== 0 || totalShadow !== 0) && (
              <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 10 }}>
                {totalCompliance !== 0 && (
                  <span style={{ color: totalCompliance > 0 ? C.accent : C.danger }}>
                    GRID {totalCompliance > 0 ? '+' : ''}{totalCompliance}
                  </span>
                )}
                {totalShadow !== 0 && (
                  <span style={{ color: totalShadow > 0 ? C.violet : C.danger }}>
                    SHADOW {totalShadow > 0 ? '+' : ''}{totalShadow}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Narrative close */}
          <div style={{ marginTop: 20, fontSize: 11, color: C.faint, lineHeight: 1.8, maxWidth: 520 }}>
            {correct < 4
              ? 'Multiple authorization errors were logged this shift. A performance review has been scheduled.'
              : correct < 7
              ? 'Shift complete. Several cases required closer attention. Your record has been updated.'
              : 'Clean shift. Authorization record is solid. The queue continues.'}
          </div>
        </div>
      </div>
    )
  }

  // ── Processing phase ────────────────────────────────────────────────────────

  const timerPct    = timeLeft / SHIFT.timeLimit
  const timerColor  = timerPct > 0.4 ? C.success : timerPct > 0.2 ? C.warn : C.danger
  const canDeny     = denyReason !== ''
  const canInterrogate = !!app.extraDoc && !extraRevealed && !interrogating

  return (
    <div style={{
      height: '100%', background: C.bg, color: C.text,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 14px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 'bold', color: C.accent }}>■ CHECKPOINT</span>
          <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em' }}>
            NEXUS BORDER CONTROL — CYCLE {SHIFT.cycle}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10 }}>
          <span style={{ color: C.muted }}>
            Queue: <span style={{ color: C.text }}>{currentIdx + 1}/{TOTAL}</span>
          </span>
          <span style={{ color: C.muted }}>
            Approved: <span style={{ color: approvedN >= SHIFT.quota ? C.success : C.warn }}>
              {approvedN}/{SHIFT.quota}
            </span>
          </span>
          <button
            onClick={() => setDbOpen(o => !o)}
            style={{
              fontSize: 9, letterSpacing: '0.08em', cursor: 'pointer',
              background: dbOpen ? `${C.accent}22` : 'none',
              border: `1px solid ${dbOpen ? C.accent : C.faint}`,
              borderRadius: 3, padding: '2px 8px', color: dbOpen ? C.accent : C.faint,
              fontFamily: 'inherit',
            }}
          >
            DATABASE
          </button>
        </div>
      </div>

      {/* DB panel */}
      {dbOpen && <DatabasePanel db={SHIFT.database} onCheck={() => setDbChecked(true)} />}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left: Documents */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Applicant header */}
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0,
          }}>
            <div style={{ fontSize: 11, color: C.accent, marginBottom: 3 }}>
              {app.request}
            </div>
            {app.plea ? (
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
                "{app.plea}"
              </div>
            ) : (
              <div style={{ fontSize: 11, color: C.faint, fontStyle: 'italic' }}>
                [applicant presents documents without speaking]
              </div>
            )}
          </div>

          {/* Doc tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0, background: C.surface }}>
            {docs.map((doc, i) => (
              <button key={i}
                onClick={() => setActiveDocIdx(i)}
                style={{
                  padding: '6px 12px', fontSize: 9, letterSpacing: '0.08em',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  borderBottom: activeDocIdx === i ? `2px solid ${C.accent}` : '2px solid transparent',
                  background: activeDocIdx === i ? C.surf2 : 'none',
                  color: activeDocIdx === i ? C.accent : C.muted,
                }}
              >
                {doc.type.toUpperCase()}
                {i === docs.length - 1 && extraRevealed && (
                  <span style={{ marginLeft: 4, color: C.violet }}>★</span>
                )}
              </button>
            ))}
          </div>

          {/* Outcome overlay */}
          {showOutcome ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
              padding: 24, background: lastCorrect ? `${C.success}08` : `${C.danger}08`,
            }}>
              <div style={{
                fontSize: 28, fontWeight: 'bold', letterSpacing: '0.1em',
                color: lastDecision === 'approve' ? C.stamp_a : C.stamp_d,
                border: `3px solid ${lastDecision === 'approve' ? C.stamp_a : C.stamp_d}`,
                padding: '8px 24px', borderRadius: 4, transform: 'rotate(-4deg)',
              }}>
                {lastDecision === 'approve' ? 'APPROVED' : 'DENIED'}
              </div>
              <div style={{ fontSize: 10, color: lastCorrect ? C.success : C.danger, letterSpacing: '0.08em' }}>
                {lastCorrect ? '✓ CORRECT DECISION' : '✗ INCORRECT DECISION'}
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, maxWidth: 460, textAlign: 'center' }}>
                {lastOutcome}
              </div>
              <button
                onClick={nextApplicant}
                style={{
                  marginTop: 8, padding: '8px 24px', fontSize: 11, fontWeight: 'bold',
                  fontFamily: 'inherit', letterSpacing: '0.08em', cursor: 'pointer',
                  background: `${C.accent}18`, border: `1px solid ${C.accent}66`, color: C.accent,
                  borderRadius: 4,
                }}
              >
                {currentIdx >= TOTAL - 1 ? 'END SHIFT' : 'NEXT APPLICANT →'}
              </button>
            </div>
          ) : interrogating ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
            }}>
              <div style={{ fontSize: 11, color: C.muted }}>Requesting additional documentation...</div>
              <div style={{ width: 200, height: 3, background: C.faint, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: C.accent, borderRadius: 2,
                  animation: 'chkLoad 4s linear forwards',
                }} />
              </div>
              <style>{`@keyframes chkLoad { from { width: 0% } to { width: 100% } }`}</style>
            </div>
          ) : (
            /* Document view */
            <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
              {activeDoc && <DocCard doc={activeDoc} dbChecked={dbChecked} />}
            </div>
          )}
        </div>

        {/* Right: Action panel */}
        <div style={{
          width: 210, flexShrink: 0,
          borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          background: C.surface,
        }}>
          {/* Timer */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginBottom: 6 }}>TIME REMAINING</div>
            <div style={{ height: 4, background: C.faint, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{
                height: '100%', width: `${timerPct * 100}%`,
                background: timerColor, borderRadius: 2,
                transition: 'width 1s linear, background 0.5s',
              }} />
            </div>
            <div style={{ fontSize: 16, color: timerColor, fontWeight: 'bold' }}>{timeLeft}s</div>
          </div>

          {/* Stats */}
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}`, fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: C.faint }}>Applicant</span>
              <span style={{ color: C.text }}>{currentIdx + 1} / {TOTAL}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.faint }}>Quota</span>
              <span style={{ color: approvedN >= SHIFT.quota ? C.success : C.warn }}>
                {approvedN} / {SHIFT.quota}
              </span>
            </div>
          </div>

          {/* DB cross-reference button */}
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}` }}>
            <button
              onClick={() => { setDbChecked(true); setDbOpen(true) }}
              style={{
                width: '100%', padding: '6px 0', fontSize: 10, fontFamily: 'inherit',
                letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 3,
                background: dbChecked ? `${C.success}12` : `${C.warn}12`,
                border: `1px solid ${dbChecked ? C.success + '44' : C.warn + '44'}`,
                color: dbChecked ? C.success : C.warn,
              }}
            >
              {dbChecked ? '✓ DB CHECKED' : 'CHECK DATABASE'}
            </button>
          </div>

          {/* Interrogate */}
          {app.extraDoc && (
            <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}` }}>
              <button
                onClick={handleInterrogate}
                disabled={!canInterrogate || showOutcome}
                style={{
                  width: '100%', padding: '6px 0', fontSize: 10, fontFamily: 'inherit',
                  letterSpacing: '0.06em', cursor: canInterrogate ? 'pointer' : 'default',
                  borderRadius: 3,
                  background: extraRevealed ? `${C.faint}` : `${C.violet}12`,
                  border: `1px solid ${extraRevealed ? C.faint : C.violet + '44'}`,
                  color: extraRevealed ? C.faint : C.violet,
                }}
              >
                {extraRevealed ? '✓ DOC RETRIEVED' : interrogating ? 'RETRIEVING...' : 'INTERROGATE'}
              </button>
              {!extraRevealed && !interrogating && (
                <div style={{ fontSize: 9, color: C.faint, marginTop: 4, textAlign: 'center' }}>
                  Request additional document
                </div>
              )}
            </div>
          )}

          {/* Decision */}
          <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em' }}>VERDICT</div>

            <button
              onClick={() => !showOutcome && handleDecision('approve')}
              disabled={showOutcome}
              style={{
                padding: '10px 0', borderRadius: 4, fontSize: 11, fontWeight: 'bold',
                fontFamily: 'inherit', letterSpacing: '0.1em', cursor: showOutcome ? 'default' : 'pointer',
                background: `${C.success}22`, border: `1px solid ${C.success}88`, color: C.success,
                transition: 'all 0.12s',
              }}
            >
              ✓ APPROVE
            </button>

            {/* Deny reason */}
            <div>
              <select
                value={denyReason}
                onChange={e => setDenyReason(e.target.value as DenyReason | '')}
                disabled={showOutcome}
                style={{
                  width: '100%', padding: '5px 6px', fontSize: 10,
                  background: C.surf3, border: `1px solid ${denyReason ? C.danger + '66' : C.faint}`,
                  color: denyReason ? C.text : C.faint, borderRadius: 3,
                  fontFamily: 'inherit', cursor: 'pointer', marginBottom: 6,
                  appearance: 'none',
                }}
              >
                <option value="">— deny reason —</option>
                {DENY_REASONS.map(r => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={() => !showOutcome && canDeny && handleDecision('deny', denyReason as DenyReason)}
                disabled={!canDeny || showOutcome}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 4,
                  fontSize: 11, fontWeight: 'bold',
                  fontFamily: 'inherit', letterSpacing: '0.1em',
                  cursor: canDeny && !showOutcome ? 'pointer' : 'default',
                  background: canDeny ? `${C.danger}22` : 'none',
                  border: `1px solid ${canDeny ? C.danger + '88' : C.faint}`,
                  color: canDeny ? C.danger : C.faint,
                  transition: 'all 0.12s',
                }}
              >
                ✕ DENY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Database Panel ─────────────────────────────────────────────────────────────

function DatabasePanel({ db, onCheck }: {
  db: typeof SHIFT_01.database
  onCheck: () => void
}) {
  useEffect(() => { onCheck() }, [])

  return (
    <div style={{
      borderBottom: `1px solid ${C.border}`,
      background: C.surf3, padding: '10px 16px',
      display: 'flex', gap: 28, overflowX: 'auto', flexShrink: 0, fontSize: 10,
    }}>
      {/* Live compliance */}
      <div style={{ minWidth: 180 }}>
        <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginBottom: 6 }}>
          LIVE COMPLIANCE
        </div>
        {Object.entries(db.liveCompliance).map(([handle, data]) => (
          <div key={handle} style={{ display: 'flex', gap: 10, marginBottom: 3 }}>
            <span style={{ color: C.accent, minWidth: 110 }}>{handle}</span>
            <span style={{
              color: data.label === 'TRUSTED' ? C.success : data.label === 'FLAGGED' ? C.danger : C.muted,
            }}>
              {data.score} / {data.label}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 6, fontSize: 9, color: C.faint }}>
          Nexus threshold: ≥ {db.nexusThreshold}
        </div>
      </div>

      {/* Sector status */}
      <div style={{ minWidth: 160 }}>
        <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginBottom: 6 }}>
          SECTOR STATUS
        </div>
        {Object.entries(db.sectorStatus).map(([sector, status]) => (
          <div key={sector} style={{ display: 'flex', gap: 10, marginBottom: 3 }}>
            <span style={{ color: C.muted, minWidth: 110 }}>{sector}</span>
            <span style={{ color: status === 'OPEN' ? C.success : C.danger }}>{status}</span>
          </div>
        ))}
      </div>

      {/* Approved employers */}
      <div style={{ minWidth: 180 }}>
        <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginBottom: 6 }}>
          APPROVED EMPLOYERS
        </div>
        {db.approvedEmployers.map(emp => (
          <div key={emp} style={{ color: C.muted, marginBottom: 3 }}>{emp}</div>
        ))}
      </div>

      {/* Authority */}
      <div>
        <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginBottom: 6 }}>
          CURRENT AUTHORITY
        </div>
        <div style={{ color: C.text }}>{db.currentAuthority}</div>
        <div style={{ color: C.faint, marginTop: 4, fontSize: 9 }}>Cycle {db.cycle}</div>
      </div>
    </div>
  )
}

// ── Document Card ──────────────────────────────────────────────────────────────

function DocCard({ doc, dbChecked }: { doc: CheckDoc; dbChecked: boolean }) {
  const typeColor: Record<string, string> = {
    id: C.accent, permit: C.success, compliance: C.warn,
    employment: C.violet, registration: C.muted,
  }
  const color = typeColor[doc.type] ?? C.muted

  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: 4,
      overflow: 'hidden', maxWidth: 520,
    }}>
      {/* Doc header */}
      <div style={{
        background: C.surf2, padding: '8px 12px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          fontSize: 8, letterSpacing: '0.12em', color,
          border: `1px solid ${color}44`, borderRadius: 3, padding: '1px 5px',
        }}>
          {doc.type.toUpperCase()}
        </span>
        <span style={{ fontSize: 11, color: C.text }}>{doc.title}</span>
      </div>

      {/* Fields */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {doc.fields.map((f, i) => (
          <FieldRow key={i} field={f} dbChecked={dbChecked} />
        ))}
      </div>

      {/* Issuer footer */}
      <div style={{
        padding: '6px 12px', borderTop: `1px solid ${C.border}`,
        fontSize: 9, color: C.faint, background: C.surf2,
      }}>
        {doc.issuer}
      </div>
    </div>
  )
}

function FieldRow({ field, dbChecked }: { field: DocField; dbChecked: boolean }) {
  const showMismatch = dbChecked && field.dbMismatch
  const isExpired    = field.expired

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '4px 6px',
      background: (showMismatch || isExpired) ? `${C.danger}14` : 'transparent',
      borderLeft: (showMismatch || isExpired) ? `2px solid ${C.danger}` : '2px solid transparent',
      borderRadius: 2,
    }}>
      <span style={{ fontSize: 10, color: C.faint, minWidth: 130, flexShrink: 0 }}>
        {field.label}
      </span>
      <span style={{ fontSize: 10, color: (showMismatch || isExpired) ? C.danger : C.text, flex: 1 }}>
        {field.value}
      </span>
      {showMismatch && (
        <span style={{ fontSize: 9, color: C.danger, flexShrink: 0, marginLeft: 8 }}>
          !! DB: {field.dbValue}
        </span>
      )}
      {isExpired && (
        <span style={{ fontSize: 9, color: C.danger, flexShrink: 0, marginLeft: 8 }}>
          !! EXPIRED
        </span>
      )}
    </div>
  )
}
