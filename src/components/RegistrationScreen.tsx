// ── RegistrationScreen.tsx ────────────────────────────────────────────────────
// First-launch citizen registration. Shown once, before boot.
// GridOS citizenship is mandatory. The player has no real choice.

import { useState, useEffect, useRef } from 'react'
import { useCitizenStore } from '@/store/citizenStore'

type Step = 'splash' | 'handle' | 'terms' | 'init' | 'welcome'

const INIT_LINES = [
  'Verifying citizen pool...',
  'Generating citizen ID...',
  'Assigning compliance baseline...',
  'Initializing behavioral monitor...',
  'Registering device fingerprint...',
  'Configuring data retention policy...',
  'Synchronizing with NEXUS authority...',
  'Finalizing registration...',
]

const C = {
  bg:     '#070710',
  border: '#1a1a2e',
  accent: '#00e5ff',
  text:   '#c8c8d8',
  muted:  '#6b6b80',
  faint:  '#3a3a4a',
  warn:   '#ffaa00',
  danger: '#ff3b5c',
}

interface Props {
  onComplete: () => void
}

export default function RegistrationScreen({ onComplete }: Props) {
  const [step,      setStep]      = useState<Step>('splash')
  const [handle,    setHandle]    = useState('')
  const [handleErr, setHandleErr] = useState('')
  const [termsRead, setTermsRead] = useState(false)
  const [declined,  setDeclined]  = useState(false)
  const [initLines, setInitLines] = useState<string[]>([])
  const [profile,   setProfile]   = useState<{ citizenId: string; handle: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { register } = useCitizenStore()

  useEffect(() => {
    if (step === 'handle') setTimeout(() => inputRef.current?.focus(), 100)
  }, [step])

  // Run initialization sequence
  useEffect(() => {
    if (step !== 'init') return
    let i = 0
    const iv = setInterval(() => {
      setInitLines(prev => {
        if (i >= INIT_LINES.length) {
          clearInterval(iv)
          setTimeout(() => setStep('welcome'), 600)
          return prev
        }
        const line = INIT_LINES[i++]
        return [...prev, line]
      })
    }, 480)
    return () => clearInterval(iv)
  }, [step])

  function handleSubmit() {
    const h = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (h.length < 3) { setHandleErr('Handle must be at least 3 characters.'); return }
    if (h.length > 20) { setHandleErr('Handle must be 20 characters or fewer.'); return }
    setHandle(h)
    setHandleErr('')
    setStep('terms')
  }

  function handleAccept() {
    const p = register(handle)
    setProfile(p)
    setInitLines([])
    setStep('init')
  }

  function handleDecline() {
    setDeclined(true)
    setTimeout(() => setDeclined(false), 2000)
  }

  const S: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: C.bg,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    color: C.text,
    zIndex: 9999,
    padding: 24,
  }

  // ── SPLASH ────────────────────────────────────────────────────────────────
  if (step === 'splash') return (
    <div style={S}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 12, color: C.accent, marginBottom: 8 }}>
          GRIDOS
        </div>
        <div style={{ color: C.muted, fontSize: 11, letterSpacing: 3, marginBottom: 32 }}>
          CITIZEN INTEGRATION PROGRAM — v4.7.1
        </div>
        <div style={{ width: '100%', height: 1, background: C.border, marginBottom: 32 }} />
        <div style={{ fontSize: 13, color: C.text, lineHeight: 2, marginBottom: 40 }}>
          A new node has been detected on the network.<br />
          This device has not been registered.<br />
          <span style={{ color: C.warn }}>Registration is mandatory.</span>
        </div>
        <button
          onClick={() => setStep('handle')}
          style={{
            padding: '12px 48px', fontSize: 12, fontWeight: 'bold',
            letterSpacing: 2, background: C.accent, color: C.bg,
            border: 'none', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          BEGIN REGISTRATION
        </button>
        <div style={{ marginTop: 24, fontSize: 10, color: C.faint }}>
          Failure to register will result in involuntary compliance assignment.
        </div>
      </div>
    </div>
  )

  // ── HANDLE INPUT ──────────────────────────────────────────────────────────
  if (step === 'handle') return (
    <div style={S}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, marginBottom: 24 }}>
          STEP 1 OF 3 — CITIZEN IDENTITY
        </div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: C.accent, marginBottom: 8 }}>
          Choose your handle
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8, marginBottom: 32 }}>
          Your handle is your identity on the GridOS network.<br />
          It will appear on all communications, employment records,<br />
          and civic documentation. <span style={{ color: C.warn }}>It cannot be changed.</span>
        </div>

        <div style={{ marginBottom: 8, fontSize: 11, color: C.muted, letterSpacing: 1 }}>HANDLE</div>
        <input
          ref={inputRef}
          value={handle}
          onChange={e => { setHandle(e.target.value); setHandleErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="letters, numbers, underscores"
          maxLength={20}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 14,
            background: '#0d0d1a', border: `1px solid ${handleErr ? C.danger : C.border}`,
            borderRadius: 4, color: C.accent, fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {handleErr && (
          <div style={{ color: C.danger, fontSize: 11, marginTop: 8 }}>{handleErr}</div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            marginTop: 24, width: '100%', padding: '12px 0',
            fontSize: 12, fontWeight: 'bold', letterSpacing: 2,
            background: 'none', border: `1px solid ${C.accent}`,
            color: C.accent, borderRadius: 4, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  )

  // ── TERMS ─────────────────────────────────────────────────────────────────
  if (step === 'terms') return (
    <div style={S}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, marginBottom: 24 }}>
          STEP 2 OF 3 — CITIZEN AGREEMENT
        </div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: C.text, marginBottom: 8 }}>
          Read carefully.
        </div>

        <div
          onScroll={e => {
            const el = e.currentTarget
            if (el.scrollHeight - el.scrollTop <= el.clientHeight + 20) setTermsRead(true)
          }}
          style={{
            background: '#0d0d1a', border: `1px solid ${C.border}`,
            borderRadius: 4, padding: '16px 20px',
            maxHeight: 280, overflowY: 'auto',
            fontSize: 11, lineHeight: 1.9, color: C.muted,
            marginBottom: 20,
          }}
        >
          <div style={{ color: C.text, fontWeight: 'bold', marginBottom: 12 }}>
            GRIDCORP CITIZEN SERVICES — UNIFIED ACCESS COMPACT
          </div>
          <div>§ 1.1 — All terminal activity is logged and retained indefinitely by GridOS Corporation and its authorised agents.</div>
          <div style={{ marginTop: 8 }}>§ 1.2 — Behavioral compliance is monitored in real-time. Your compliance score is visible to GridOS operators, Nexus Authority, and any third parties with Tier-2 data access or above.</div>
          <div style={{ marginTop: 8 }}>§ 1.3 — GridOS may adjust, suspend, or terminate your citizen account at any time without notice or justification under UAC Provision 44.</div>
          <div style={{ marginTop: 8 }}>§ 1.4 — Network access is a managed privilege. Access to certain domains and services may be restricted based on your compliance score, faction associations, or arbitrary administrative review.</div>
          <div style={{ marginTop: 8 }}>§ 1.5 — You waive all claims to data privacy. Information collected by GridOS is the sole property of GridOS Corporation.</div>
          <div style={{ marginTop: 8 }}>§ 1.6 — This agreement is irrevocable upon acceptance. There is no withdrawal period. There is no appeals process.</div>
          <div style={{ marginTop: 8 }}>§ 1.7 — Citizens who attempt to circumvent GridOS systems are subject to compliance review, score adjustment, and potential network isolation.</div>
          <div style={{ marginTop: 16, color: C.faint, fontSize: 10 }}>
            This document was last updated without notice. Continued use of the network constitutes acceptance of any future amendments.
          </div>
        </div>

        {!termsRead && (
          <div style={{ fontSize: 10, color: C.faint, marginBottom: 12, textAlign: 'center' }}>
            Scroll to read the full agreement before proceeding.
          </div>
        )}

        {declined && (
          <div style={{
            marginBottom: 12, padding: '10px 14px',
            background: '#1a0a0a', border: `1px solid ${C.danger}`,
            borderRadius: 4, fontSize: 11, color: C.danger,
          }}>
            GridOS citizenship is mandatory in your sector. Declination is not permitted.
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleDecline}
            style={{
              flex: 1, padding: '11px 0', fontSize: 11, fontWeight: 'bold',
              background: 'none', border: `1px solid ${C.faint}`,
              color: C.muted, borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: 1,
            }}
          >
            DECLINE
          </button>
          <button
            onClick={termsRead ? handleAccept : undefined}
            style={{
              flex: 2, padding: '12px 0', fontSize: 12, fontWeight: 'bold',
              background: termsRead ? C.accent : C.faint,
              border: 'none', color: termsRead ? C.bg : C.muted,
              borderRadius: 4, cursor: termsRead ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', letterSpacing: 2,
              transition: 'all 0.2s',
            }}
          >
            ACCEPT &amp; REGISTER
          </button>
        </div>
      </div>
    </div>
  )

  // ── INITIALIZATION ────────────────────────────────────────────────────────
  if (step === 'init') return (
    <div style={S}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, marginBottom: 24 }}>
          STEP 3 OF 3 — NODE INITIALIZATION
        </div>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 2.2 }}>
          {INIT_LINES.map((line, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: i < initLines.length ? C.text : 'transparent' }}>
              <span>{line}</span>
              <span style={{ color: C.success }}>OK</span>
            </div>
          ))}
          {initLines.length < INIT_LINES.length && (
            <span style={{ color: C.accent, animation: 'none' }}>
              {initLines[initLines.length - 1] ?? ''}
              <span style={{ opacity: 0.6 }}> ▋</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )

  // ── WELCOME ───────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    const p = useCitizenStore.getState().profile
    return (
      <div style={S}>
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: '100%', height: 1, background: C.accent + '44', marginBottom: 40 }} />
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, marginBottom: 16 }}>
            REGISTRATION COMPLETE
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.accent, marginBottom: 8 }}>
            CITIZEN #{p?.citizenId}
          </div>
          <div style={{ fontSize: 16, color: C.text, marginBottom: 40 }}>
            @{p?.handle}
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 2, marginBottom: 40 }}>
            Welcome to GridOS.<br />
            Your activity begins now.<br />
            <span style={{ color: C.faint }}>Everything is being recorded.</span>
          </div>
          <div style={{ width: '100%', height: 1, background: C.accent + '44', marginBottom: 40 }} />
          <button
            onClick={onComplete}
            style={{
              padding: '14px 64px', fontSize: 13, fontWeight: 'bold',
              letterSpacing: 3, background: C.accent, color: C.bg,
              border: 'none', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ENTER GRIDOS
          </button>
        </div>
      </div>
    )
  }

  return null
}
