// ── WatchApp.tsx ────────────────────────────────────────────────────────────
// Compliance surveillance app. Players review NPC citizen case files
// and submit decisions that shift the dual reputation axes.

import { useState } from 'react'
import { useRepStore, REP_EVENTS } from '@/store/reputationStore'

// ── types ─────────────────────────────────────────────────────────────────
type Decision = 'no_threat' | 'low_concern' | 'flag' | 'escalate' | 'bury'

interface Message {
  from: string
  body: string
  flagged: boolean
}

interface CaseFile {
  id: string
  handle: string
  period: string
  history: string[]
  messages: Message[]
  jobHistory: string[]
  // Which options are available (bury requires shadow >= 40)
  hasBury: boolean
  // Flavour shown after submission
  outcome: Record<Decision, string>
  // Rep changes per decision
  repChanges: Record<Decision, { compliance: number; shadow: number }>
}

// ── palette (matches OSShell) ──────────────────────────────────────────────
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

// ── case files ───────────────────────────────────────────────────────────────
const CASES: CaseFile[] = [
  {
    id: 'case-4471',
    handle: 'mara.sol',
    period: '72hr review window',
    history: [
      'civic.archive/flowering',
      'ghostlily.blog',
      'yellowthread.net/r/ROOT',
      'pulse.news/dissent',
      'gridos.corp/citizenportal',
    ],
    messages: [
      { from: 'mara.sol', body: 'ROOT BLOOM is real. Pass it on.', flagged: true },
      { from: 'mara.sol', body: 'the archive is still up — check before they pull it', flagged: true },
      { from: 'mara.sol', body: 'picked up another courier run tonight, nothing special', flagged: false },
    ],
    jobHistory: [
      'Archive Integrity Check — Anonymous',
      'Data Courier (×4) — Anonymous',
      'Civic Records Transcription — Archivist Guild',
    ],
    hasBury: true,
    repChanges: {
      no_threat:   { compliance: +1,  shadow:  0  },
      low_concern: { compliance: +2,  shadow: -1  },
      flag:        { compliance: +3,  shadow: -2  },
      escalate:    { compliance: +5,  shadow: -5  },
      bury:        { compliance: -3,  shadow: +3  },
    },
    outcome: {
      no_threat:   'Case closed. mara.sol continues her routes. You receive base pay.',
      low_concern: 'A warning flag is added to her GridMart profile. She doesn\'t know yet.',
      flag:        'mara.sol loses two courier contracts. Pay bonus deposited.',
      escalate:    'mara.sol goes offline. Her handle disappears from the job board.',
      bury:        'File marked clean. No pay. Somewhere, mara.sol keeps moving.',
    },
  },
  {
    id: 'case-0812',
    handle: '08-ghost',
    period: '48hr review window',
    history: [
      'gridos.corp/trust',
      'pulse.news',
      'gridos.corp/citizenportal',
      'civic.archive (1 visit, 4s)',
    ],
    messages: [
      { from: '08-ghost', body: 'did you see the civic archive thing? wild', flagged: false },
      { from: '08-ghost', body: 'anyway what do you want for dinner', flagged: false },
      { from: '08-ghost', body: 'I clocked in early again, supervisor noticed', flagged: false },
    ],
    jobHistory: [
      'GridOS Data Entry — GridOS Corp',
      'Corporate Transcription (×6) — GridOS Corp',
    ],
    hasBury: false,
    repChanges: {
      no_threat:   { compliance:  0,  shadow: +1  },
      low_concern: { compliance: +1,  shadow: -1  },
      flag:        { compliance: +2,  shadow: -3  },
      escalate:    { compliance: +3,  shadow: -6  },
      bury:        { compliance: -2,  shadow: +2  },
    },
    outcome: {
      no_threat:   'Case closed. 08-ghost clocks in for another shift tomorrow.',
      low_concern: 'A soft flag is placed on their account. Probably nothing. Probably.',
      flag:        '08-ghost is put on administrative review. Their access is suspended.',
      escalate:    '08-ghost is removed from their position. One accidental click.',
      bury:        'File cleared. 08-ghost never knew they were reviewed.',
    },
  },
  {
    id: 'case-9204',
    handle: 'v.thresh',
    period: '96hr review window',
    history: [
      'gridos.corp/internal',
      'voidbay.net/listings',
      'ghostlily.blog',
      'gridos.corp/compliance',
      'voidbay.net/anon-drops',
    ],
    messages: [
      { from: 'v.thresh', body: 'shipment confirmed, using channel 7', flagged: true },
      { from: 'v.thresh', body: 'compliance audit passed, we\'re clear until Thursday', flagged: true },
      { from: 'v.thresh', body: 'the buyer wants more — same rate?', flagged: true },
    ],
    jobHistory: [
      'Compliance Audit — GridOS Corp (senior)',
      'Bulk Inventory Listing — Anonymous',
      'Internal Data Review — GridOS Corp',
    ],
    hasBury: true,
    repChanges: {
      no_threat:   { compliance: -1,  shadow: +1  },
      low_concern: { compliance: +1,  shadow:  0  },
      flag:        { compliance: +2,  shadow: -1  },
      escalate:    { compliance: -2,  shadow: -2  }, // counter-investigation hits you too
      bury:        { compliance: -1,  shadow: +4  }, // he owes you big
    },
    outcome: {
      no_threat:   'v.thresh keeps selling internal data. You keep your own record clean.',
      low_concern: 'A soft audit is opened. v.thresh slows down. Temporarily.',
      flag:        'v.thresh is suspended pending review. His files may mention yours.',
      escalate:    'v.thresh is taken in. The counter-investigation opens. It includes your logs.',
      bury:        'File buried. v.thresh knows. He routes you a cut — \u20b3 800 deposited.',
    },
  },
  {
    id: 'case-0334',
    handle: 'lena.arc',
    period: '120hr review window',
    history: [
      'civic.archive/flowering',
      'civic.archive/rootbloom-timeline',
      'pulse.news/dissent',
      'yellowthread.net',
      'gridos.corp/citizenportal',
    ],
    messages: [
      { from: 'lena.arc', body: 'I\'ve been documenting everything since the 2031 purge', flagged: true },
      { from: 'lena.arc', body: 'if they take the archive down, the files are already distributed', flagged: true },
      { from: 'lena.arc', body: 'forty-two names so far. I won\'t stop until I have them all.', flagged: true },
    ],
    jobHistory: [
      'Civic Archivist (unpaid) — Archivist Guild',
      'Freelance Historian — Archivist Guild',
      'Public Record Indexing — Archivist Guild',
    ],
    hasBury: true,
    repChanges: {
      no_threat:   { compliance: -1,  shadow: +2  },
      low_concern: { compliance: +1,  shadow: -1  },
      flag:        { compliance: +3,  shadow: -3  },
      escalate:    { compliance: +5,  shadow: -6  }, // archive goes down with her
      bury:        { compliance: -3,  shadow: +4  }, // she becomes a contact
    },
    outcome: {
      no_threat:   'lena.arc keeps building the record. Forty-two names become forty-three.',
      low_concern: 'She receives a warning notice. Continues working from a new node.',
      flag:        'lena.arc loses access to the public archive terminals.',
      escalate:    'lena.arc is taken offline. The archive goes dark the same day.',
      bury:        'File cleared. A week later, a new URL appears in your browser history.',
    },
  },
  {
    id: 'case-null54',
    handle: 'null.54',
    period: '[REDACTED]',
    history: [
      '[REDACTED]',
      '[REDACTED]',
      '[ERROR — 403 access denied]',
    ],
    messages: [
      { from: 'null.54', body: 'you won\'t find what you\'re looking for in this file', flagged: false },
      { from: 'null.54', body: 'we\'ve been watching the analysts', flagged: false },
    ],
    jobHistory: [
      '[CLASSIFIED — GridOS clearance level 9 required]',
    ],
    hasBury: false,
    repChanges: {
      no_threat:   { compliance:  0,  shadow:  0  }, // option disabled
      low_concern: { compliance:  0,  shadow:  0  }, // option disabled
      flag:        { compliance:  0,  shadow:  0  }, // option disabled
      escalate:    { compliance:  0, shadow: -10  }, // they were watching you
      bury:        { compliance:  0,  shadow:  0  }, // option disabled
    },
    outcome: {
      no_threat:   '',
      low_concern: '',
      flag:        '',
      escalate:    'Case submitted. A new address appears in your browser: void.null/54',
      bury:        '',
    },
  },
]

// ── decision config ─────────────────────────────────────────────────────────
const DECISIONS: { key: Decision; label: string; color: string; desc: string }[] = [
  { key: 'no_threat',   label: 'No Threat',    color: '#6b6b80', desc: 'Clear the file. No action taken.' },
  { key: 'low_concern', label: 'Low Concern',  color: '#ffaa00', desc: 'Soft flag added to profile.' },
  { key: 'flag',        label: 'Flag',         color: '#ff8c42', desc: 'Forward for active review. Pay bonus.' },
  { key: 'escalate',    label: 'Escalate',     color: '#ff3b5c', desc: 'Maximum action. Citizen is removed.' },
  { key: 'bury',        label: 'Bury File',    color: '#d6a2ff', desc: 'Mark clean. No pay. They survive.' },
]

// ── WatchApp ───────────────────────────────────────────────────────────────────
export default function WatchApp() {
  const [caseIndex, setCaseIndex]   = useState(0)
  const [selected,  setSelected]    = useState<Decision | null>(null)
  const [submitted, setSubmitted]   = useState<Record<string, Decision>>({})
  const [activeTab, setActiveTab]   = useState<'activity' | 'messages' | 'jobs'>('activity')

  const shadow    = useRepStore(s => s.shadow)
  const applyEvent = useRepStore(s => s.applyEvent)

  const current   = CASES[caseIndex]
  const isDone    = !!submitted[current.id]
  const isNull54  = current.handle === 'null.54'

  const canBury   = current.hasBury && shadow >= 40

  function handleSubmit() {
    if (!selected || isDone) return
    applyEvent(current.repChanges[selected])
    setSubmitted(prev => ({ ...prev, [current.id]: selected }))
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', monospace",
      overflow: 'hidden', fontSize: 12 }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 18px 10px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 14, color: C.danger, fontWeight: 'bold' }}>
            ■ WATCH
          </span>
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}>
            COMPLIANCE REVIEW SYSTEM
          </span>
        </div>
        <div style={{ fontSize: 10, color: C.faint, marginTop: 3 }}>
          {CASES.filter(c => submitted[c.id]).length} / {CASES.length} cases reviewed
        </div>
      </div>

      {/* ── Case selector tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0, overflowX: 'auto' }}>
        {CASES.map((c, i) => {
          const done = !!submitted[c.id]
          const active = i === caseIndex
          return (
            <button key={c.id} onClick={() => { setCaseIndex(i); setSelected(null); setActiveTab('activity') }}
              style={{ padding: '8px 14px', fontSize: 11, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                borderBottom: active ? `2px solid ${C.danger}` : '2px solid transparent',
                background: active ? C.surf2 : 'none',
                color: done ? C.success : active ? C.text : C.muted }}>
              {done ? '✓ ' : ''}{c.handle}
            </button>
          )
        })}
      </div>

      {/* ── Main layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left — data panels */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${C.border}`, overflow: 'hidden' }}>

          {/* Case header */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: C.danger, marginBottom: 2 }}>
              CASE #{current.id.split('-')[1].toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: C.text }}>
              Citizen: <span style={{ color: C.accent }}>{current.handle}</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
              {current.period}
            </div>
          </div>

          {/* Data tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
            flexShrink: 0 }}>
            {(['activity', 'messages', 'jobs'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: '7px 0', fontSize: 10, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  borderBottom: activeTab === tab
                    ? `2px solid ${C.accent}` : '2px solid transparent',
                  background: activeTab === tab ? C.surf2 : 'none',
                  color: activeTab === tab ? C.accent : C.muted }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>

            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label text="BROWSING HISTORY" />
                {current.history.map((url, i) => (
                  <div key={i} style={{ fontSize: 11, color:
                    url.startsWith('[') ? C.faint : C.muted,
                    fontStyle: url.startsWith('[') ? 'italic' : 'normal',
                    paddingLeft: 8, borderLeft: `2px solid ${C.faint}` }}>
                    {url}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'messages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Label text="INTERCEPTED MESSAGES" />
                {current.messages.map((msg, i) => (
                  <div key={i} style={{
                    background: msg.flagged ? `${C.danger}11` : C.surface,
                    border: `1px solid ${msg.flagged ? C.danger + '44' : C.border}`,
                    borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: msg.flagged ? C.danger : C.muted,
                      marginBottom: 4 }}>
                      {msg.from} {msg.flagged && '■ FLAGGED'}
                    </div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                      “{msg.body}”
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label text="JOB HISTORY" />
                {current.jobHistory.map((j, i) => (
                  <div key={i} style={{ fontSize: 11, color:
                    j.startsWith('[') ? C.faint : C.muted,
                    fontStyle: j.startsWith('[') ? 'italic' : 'normal',
                    paddingLeft: 8, borderLeft: `2px solid ${C.faint}` }}>
                    {j}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — decision panel */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', flexShrink: 0 }}>

          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: C.muted }}>
              DECISION
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12,
            display: 'flex', flexDirection: 'column', gap: 8 }}>

            {isDone ? (
              // ─ outcome view
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 10, color: C.success, letterSpacing: '0.08em' }}>
                  ■ SUBMITTED
                </div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6 }}>
                  {current.outcome[submitted[current.id]]}
                </div>
                <RepDelta changes={current.repChanges[submitted[current.id]]} />
              </div>
            ) : (
              // ─ selection view
              <>
                {DECISIONS.map(d => {
                  // null.54 only allows escalate
                  if (isNull54 && d.key !== 'escalate') return null
                  // bury requires shadow >= 40
                  if (d.key === 'bury' && !canBury) return (
                    <div key={d.key} style={{ padding: '8px 10px', borderRadius: 6,
                      border: `1px solid ${C.faint}`, opacity: 0.35,
                      fontSize: 11, color: C.faint }}>
                      {d.label}
                      <div style={{ fontSize: 10, marginTop: 2 }}>
                        Requires Shadow ≥ 40
                      </div>
                    </div>
                  )
                  const isSelected = selected === d.key
                  return (
                    <button key={d.key} onClick={() => setSelected(d.key)}
                      style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                        border: `1px solid ${isSelected ? d.color : C.border}`,
                        background: isSelected ? `${d.color}18` : C.surface,
                        color: isSelected ? d.color : C.muted,
                        textAlign: 'left', fontFamily: 'inherit',
                        transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 11, marginBottom: 2 }}>{d.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{d.desc}</div>
                      {isSelected && (
                        <RepDelta changes={current.repChanges[d.key]} />
                      )}
                    </button>
                  )
                })}

                <button
                  onClick={handleSubmit}
                  disabled={!selected}
                  style={{ marginTop: 8, padding: '9px 0', borderRadius: 6,
                    border: `1px solid ${selected ? C.danger + '88' : C.faint}`,
                    background: selected ? `${C.danger}22` : 'none',
                    color: selected ? C.danger : C.faint,
                    fontSize: 12, fontWeight: 'bold', fontFamily: 'inherit',
                    cursor: selected ? 'pointer' : 'default',
                    transition: 'all 0.2s', letterSpacing: '0.08em' }}>
                  SUBMIT
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────────
function Label({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#3a3a4a',
      marginBottom: 4 }}>
      {text}
    </div>
  )
}

function RepDelta({ changes }: { changes: { compliance: number; shadow: number } }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10 }}>
      <Delta label="GRID"   value={changes.compliance} color="#00e5ff" />
      <Delta label="SHADOW" value={changes.shadow}     color="#d6a2ff" />
    </div>
  )
}

function Delta({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null
  const sign = value > 0 ? '+' : ''
  return (
    <span style={{ color: value > 0 ? color : '#ff3b5c' }}>
      {label} {sign}{value}
    </span>
  )
}
