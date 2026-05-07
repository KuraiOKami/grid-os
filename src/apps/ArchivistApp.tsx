// ── ArchivistApp.tsx ───────────────────────────────────────────────────────────
// Return-of-the-Obra-Dinn style deduction: match corrupted record fragments
// to citizens and fates. Data is spread across three panes. All deduction,
// no combat, no timer.
import { useState, useMemo } from 'react'

const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  surf2:   '#16161f',
  surf3:   '#1c1c26',
  border:  '#2a2a3a',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  warn:    '#ffaa00',
  danger:  '#ff3b5c',
  success: '#00cc88',
  violet:  '#d6a2ff',
  amber:   '#e8a020',
}

// ─ Data ────────────────────────────────────────────────────────────
type Fate = 'reassigned' | 'deleted' | 'exiled' | 'unknown' | 'absorbed'

interface Citizen {
  id:       string
  code:     string        // e.g. "#0041" — shown on records
  name:     string        // the answer, hidden until solved
  sector:   string
  fate:     Fate
  fateNote: string
}

interface Fragment {
  id:       string
  type:     'timestamp' | 'biometric' | 'log' | 'memo' | 'image'
  label:    string
  content:  string
  clues:    string[]      // citizen.id values this fragment hints at
  solved:   boolean
}

const CITIZENS: Citizen[] = [
  { id: 'c01', code: '#0041', name: 'MAREN SOLVIK',    sector: 'GRID-7',   fate: 'deleted',      fateNote: 'Compliance score zeroed — ROOT BLOOM cycle 14.' },
  { id: 'c02', code: '#0078', name: 'DESH PARAVAR',    sector: 'GRID-2',   fate: 'reassigned',   fateNote: 'Transferred to Monitoring Division, no further record.' },
  { id: 'c03', code: '#0113', name: 'LIRA VANCE',      sector: 'GRID-9',   fate: 'exiled',       fateNote: 'Node access revoked. Last ping: Outer Ring relay.' },
  { id: 'c04', code: '#0202', name: 'OREN CASTEL',     sector: 'GRID-3',   fate: 'unknown',      fateNote: 'Record fragmented. Timestamp collision at cycle 19.' },
  { id: 'c05', code: '#0317', name: 'SABLE NUUR',      sector: 'GRID-11',  fate: 'absorbed',     fateNote: 'Identity merged with Citizen #0318. GridCorp anomaly.' },
  { id: 'c06', code: '#0318', name: 'TAO MIREILLE',    sector: 'GRID-11',  fate: 'absorbed',     fateNote: 'Identity merged with Citizen #0317. See above.' },
  { id: 'c07', code: '#0444', name: 'PREN HALCOURT',   sector: 'GRID-4',   fate: 'deleted',      fateNote: 'Flagged for anomalous data-broker activity.' },
  { id: 'c08', code: '#0501', name: 'YUKI STRAND',     sector: 'GRID-6',   fate: 'reassigned',   fateNote: 'Courier contract flagged, file sealed.' },
  { id: 'c09', code: '#0612', name: 'VOSS AMARI',      sector: 'GRID-8',   fate: 'exiled',       fateNote: 'Self-exiled after Observer breach — unconfirmed.' },
  { id: 'c10', code: '#0714', name: 'FENRIS DALE',     sector: 'GRID-1',   fate: 'unknown',      fateNote: 'No terminal activity since cycle 22. Ping unresolved.' },
]

const FRAGMENTS: Fragment[] = [
  {
    id: 'f01', type: 'timestamp', solved: false,
    label: 'TIMESTAMP LOG — PARTIAL',
    content: 'cycle_14 │ node_7_C │ compliance_score: 0.00 │ [REDACTED] │ purge_flag: TRUE',
    clues: ['c01'],
  },
  {
    id: 'f02', type: 'memo', solved: false,
    label: 'INTERNAL MEMO — CORRUPTED',
    content: '...transfer auth signed by DIV-MON-02... reassignment effective immed... sector GRID-2... no appeal window...',
    clues: ['c02'],
  },
  {
    id: 'f03', type: 'log', solved: false,
    label: 'ACCESS LOG — OUTER RING',
    content: 'relay_OA9 │ ping_received │ sector: GRID-9 origin │ node access: REVOKED │ timestamp: [CORRUPTED]',
    clues: ['c03'],
  },
  {
    id: 'f04', type: 'timestamp', solved: false,
    label: 'TIMESTAMP COLLISION — CYCLE 19',
    content: 'citizen_ref: [?????] │ two writes │ same tick │ sector GRID-3 │ data integrity: FAIL',
    clues: ['c04'],
  },
  {
    id: 'f05', type: 'biometric', solved: false,
    label: 'BIOMETRIC RECORD — MERGE ANOMALY',
    content: 'identity_hash_A: 9f2e... │ identity_hash_B: 9f2e... │ sector: GRID-11 │ GridCorp ref: ANOMALY-7',
    clues: ['c05', 'c06'],
  },
  {
    id: 'f06', type: 'log', solved: false,
    label: 'ACTIVITY FLAG — DATA BROKER',
    content: 'citizen_ref: #0444 │ VoidBay_tx: 14 │ exfil_volume: HIGH │ flag: DELETION_QUEUED',
    clues: ['c07'],
  },
  {
    id: 'f07', type: 'memo', solved: false,
    label: 'COURIER FILE — SEALED',
    content: '...contract_ref: C-0812... sector GRID-6... flag raised on delivery... file classification: SEALED...',
    clues: ['c08'],
  },
  {
    id: 'f08', type: 'log', solved: false,
    label: 'OBSERVER BREACH REPORT',
    content: 'breach_ref: OB-0019 │ sector: GRID-8 │ self-reported: UNCONFIRMED │ last_ping: [SILENCE]',
    clues: ['c09'],
  },
  {
    id: 'f09', type: 'timestamp', solved: false,
    label: 'TERMINAL ACTIVITY — FLATLINE',
    content: 'citizen_ref: #0714 │ last_write: cycle_22 │ ping: UNRESOLVED │ sector: GRID-1 │ status: [VOID]',
    clues: ['c10'],
  },
  {
    id: 'f10', type: 'image', solved: false,
    label: 'IMAGE FRAGMENT — CORRUPTED',
    content: '[VISUAL DATA CORRUPTED] │ metadata: sector_GRID-7 │ cycle_13 │ subject_count: 1 │ face_hash: 7c4a...',
    clues: ['c01'],
  },
  {
    id: 'f11', type: 'biometric', solved: false,
    label: 'COMPLIANCE RECORD — FRAGMENTED',
    content: 'scan_ref: BIO-0041 │ sector: GR[CORRUPTED] │ score_delta: -100 │ operator: ROOT_BLOOM_SYS',
    clues: ['c01'],
  },
  {
    id: 'f12', type: 'memo', solved: false,
    label: 'TRANSFER ORDER — PARTIAL',
    content: '...DIV-MON intake ref... previous assignment: [REDACTED]... sector GRID-2 origin confirmed...',
    clues: ['c02'],
  },
]

const FATES: { value: Fate; label: string; color: string }[] = [
  { value: 'deleted',    label: 'DELETED',    color: C.danger  },
  { value: 'reassigned', label: 'REASSIGNED', color: C.warn    },
  { value: 'exiled',     label: 'EXILED',     color: C.violet  },
  { value: 'absorbed',   label: 'ABSORBED',   color: C.accent  },
  { value: 'unknown',    label: 'UNKNOWN',    color: C.muted   },
]

function fateColor(f: Fate) { return FATES.find(x => x.value === f)?.color ?? C.muted }
function fateLabel(f: Fate) { return FATES.find(x => x.value === f)?.label ?? '???' }

// ─ Component ───────────────────────────────────────────────────────────
export default function ArchivistApp() {
  const [fragments, setFragments]   = useState<Fragment[]>(FRAGMENTS)
  const [selected,  setSelected]    = useState<Fragment | null>(null)
  const [deductions, setDeductions] = useState<Record<string, { citizenId: string; fate: Fate } | null>>(() =>
    Object.fromEntries(FRAGMENTS.map(f => [f.id, null]))
  )
  const [confirmed, setConfirmed]   = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FRAGMENTS.map(f => [f.id, false]))
  )
  const [activeTab, setActiveTab]   = useState<'fragments' | 'registry' | 'ledger'>('fragments')

  const solved = useMemo(() =>
    fragments.filter(f => confirmed[f.id] && isCorrect(f, deductions[f.id])).length,
    [fragments, confirmed, deductions]
  )

  function isCorrect(f: Fragment, d: { citizenId: string; fate: Fate } | null) {
    if (!d) return false
    const citizen = CITIZENS.find(c => c.id === d.citizenId)
    if (!citizen) return false
    return f.clues.includes(d.citizenId) && d.fate === citizen.fate
  }

  function setDeduction(fragmentId: string, citizenId: string, fate: Fate) {
    setDeductions(prev => ({ ...prev, [fragmentId]: { citizenId, fate } }))
    setConfirmed(prev => ({ ...prev, [fragmentId]: false }))
  }

  function confirmDeduction(fragmentId: string) {
    const d = deductions[fragmentId]
    if (!d) return
    setConfirmed(prev => ({ ...prev, [fragmentId]: true }))
    if (isCorrect(fragments.find(f => f.id === fragmentId)!, d)) {
      setFragments(prev => prev.map(f => f.id === fragmentId ? { ...f, solved: true } : f))
    }
  }

  const typeIcon = (t: Fragment['type']) => ({ timestamp: '⧗', biometric: '◆', log: '≡', memo: '✎', image: '▣' }[t])
  const typeColor = (t: Fragment['type']) => ({ timestamp: C.accent, biometric: C.violet, log: C.success, memo: C.warn, image: C.amber }[t])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.text }}>

      {/* Header */}
      <div style={{ padding: '10px 16px 0', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 'bold', color: C.amber }}>◆ ARCHIVIST</span>
          <span style={{ color: C.muted }}>ROOT BLOOM — MISSING PERSONS RECOVERY</span>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: C.success }}>
            {solved}/{fragments.length} RESOLVED
          </div>
          <div style={{
            width: 120, height: 4, background: C.faint, borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{ height: '100%', width: `${(solved / fragments.length) * 100}%`, background: C.success, transition: 'width 0.4s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['fragments', 'registry', 'ledger'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 16px', border: 'none', cursor: 'pointer',
              background: 'none', fontFamily: 'inherit', fontSize: 10,
              color: activeTab === tab ? C.accent : C.muted,
              borderBottom: `2px solid ${activeTab === tab ? C.accent : 'transparent'}`,
              letterSpacing: '0.08em', transition: 'color 0.15s',
            }}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* FRAGMENTS TAB */}
        {activeTab === 'fragments' && (
          <>
            {/* Fragment list */}
            <div style={{ width: 220, borderRight: `1px solid ${C.border}`, overflow: 'auto', flexShrink: 0 }}>
              {fragments.map(f => (
                <button key={f.id} onClick={() => setSelected(f)} style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  padding: '10px 12px',
                  background: selected?.id === f.id ? C.surf3 : 'none',
                  borderBottom: `1px solid ${C.border}`,
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.1s',
                }}>
                  <span style={{ color: typeColor(f.type), flexShrink: 0 }}>{typeIcon(f.type)}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 10, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{f.type.toUpperCase()}</div>
                  </div>
                  {f.solved && <span style={{ color: C.success, fontSize: 10 }}>✓</span>}
                  {!f.solved && confirmed[f.id] && <span style={{ color: C.danger, fontSize: 10 }}>✗</span>}
                </button>
              ))}
            </div>

            {/* Fragment detail + deduction */}
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {!selected ? (
                <div style={{ color: C.muted, textAlign: 'center', marginTop: 80, fontSize: 12 }}>
                  Select a fragment to begin analysis.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ color: typeColor(selected.type), fontSize: 16 }}>{typeIcon(selected.type)}</span>
                      <span style={{ fontSize: 13, fontWeight: 'bold', color: C.amber }}>{selected.label}</span>
                    </div>
                    <div style={{
                      padding: 14,
                      background: C.surf2,
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      lineHeight: 1.8,
                      color: C.text,
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {selected.content}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: '0.1em' }}>ASSIGN CITIZEN</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {CITIZENS.map(c => {
                        const chosen = deductions[selected.id]?.citizenId === c.id
                        return (
                          <button key={c.id} onClick={() => {
                            const fate = deductions[selected.id]?.fate ?? 'unknown'
                            setDeduction(selected.id, c.id, fate)
                          }} style={{
                            padding: '4px 10px', border: `1px solid ${chosen ? C.accent : C.border}`,
                            borderRadius: 3, cursor: 'pointer',
                            background: chosen ? C.accent + '22' : 'none',
                            color: chosen ? C.accent : C.muted,
                            fontFamily: 'inherit', fontSize: 10,
                            transition: 'all 0.1s',
                          }}>
                            {c.code}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: '0.1em' }}>ASSIGN FATE</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {FATES.map(ft => {
                        const chosen = deductions[selected.id]?.fate === ft.value
                        return (
                          <button key={ft.value} onClick={() => {
                            const cId = deductions[selected.id]?.citizenId ?? CITIZENS[0].id
                            setDeduction(selected.id, cId, ft.value)
                          }} style={{
                            padding: '4px 10px', border: `1px solid ${chosen ? ft.color : C.border}`,
                            borderRadius: 3, cursor: 'pointer',
                            background: chosen ? ft.color + '22' : 'none',
                            color: chosen ? ft.color : C.muted,
                            fontFamily: 'inherit', fontSize: 10,
                            transition: 'all 0.1s',
                          }}>
                            {ft.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    disabled={!deductions[selected.id]}
                    onClick={() => confirmDeduction(selected.id)}
                    style={{
                      padding: '7px 22px', border: `1px solid ${C.amber}`,
                      borderRadius: 4, cursor: deductions[selected.id] ? 'pointer' : 'not-allowed',
                      background: deductions[selected.id] ? C.amber + '22' : 'none',
                      color: deductions[selected.id] ? C.amber : C.faint,
                      fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em',
                      transition: 'all 0.15s',
                    }}
                  >
                    CONFIRM DEDUCTION
                  </button>

                  {confirmed[selected.id] && (
                    <div style={{
                      marginTop: 12, padding: '8px 14px', borderRadius: 4,
                      background: selected.solved ? C.success + '18' : C.danger + '18',
                      border: `1px solid ${selected.solved ? C.success : C.danger}44`,
                      color: selected.solved ? C.success : C.danger,
                      fontSize: 11,
                    }}>
                      {selected.solved
                        ? `✓ CORRECT — ${CITIZENS.find(c => c.id === deductions[selected.id]?.citizenId)?.name}`
                        : '✗ INCORRECT — re-examine the evidence'}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* REGISTRY TAB */}
        {activeTab === 'registry' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 16, letterSpacing: '0.1em' }}>CIVIC REGISTRY — MISSING PERSONS — ROOT BLOOM TIMELINE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['CODE', 'SECTOR', 'STATUS', 'FATE NOTE'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, color: C.muted, letterSpacing: '0.1em', fontWeight: 'normal' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CITIZENS.map(c => {
                  const isSolved = fragments.some(f => f.solved && f.clues.includes(c.id))
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${C.faint}` }}>
                      <td style={{ padding: '8px 10px', color: C.accent }}>{c.code}</td>
                      <td style={{ padding: '8px 10px', color: C.muted }}>{c.sector}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 2,
                          background: fateColor(c.fate) + '18',
                          color: fateColor(c.fate), fontSize: 9, letterSpacing: '0.08em',
                        }}>
                          {isSolved ? fateLabel(c.fate) : '[REDACTED]'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: isSolved ? C.text : C.faint, fontSize: 10, maxWidth: 280 }}>
                        {isSolved ? c.fateNote : '/// ACCESS RESTRICTED ///'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* LEDGER TAB */}
        {activeTab === 'ledger' && (
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 16, letterSpacing: '0.1em' }}>DEDUCTION LEDGER</div>
            {fragments.map(f => {
              const d   = deductions[f.id]
              const c   = d ? CITIZENS.find(x => x.id === d.citizenId) : null
              const ok  = f.solved
              const bad = confirmed[f.id] && !ok
              return (
                <div key={f.id} style={{
                  padding: '10px 14px', marginBottom: 6,
                  background: ok ? C.success + '0f' : bad ? C.danger + '0f' : C.surface,
                  border: `1px solid ${ok ? C.success + '44' : bad ? C.danger + '33' : C.border}`,
                  borderRadius: 4, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ color: typeColor(f.type), flexShrink: 0 }}>{typeIcon(f.type)}</span>
                  <span style={{ flex: 1, color: C.text, fontSize: 10 }}>{f.label}</span>
                  <span style={{ color: c ? C.accent : C.faint, fontSize: 10 }}>{c?.code ?? '—'}</span>
                  <span style={{
                    color: d ? fateColor(d.fate) : C.faint, fontSize: 9,
                    padding: '2px 8px', borderRadius: 2,
                    background: d ? fateColor(d.fate) + '18' : 'none',
                  }}>
                    {d ? fateLabel(d.fate) : '—'}
                  </span>
                  <span style={{ fontSize: 12, color: ok ? C.success : bad ? C.danger : C.faint }}>
                    {ok ? '✓' : bad ? '✗' : '○'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
