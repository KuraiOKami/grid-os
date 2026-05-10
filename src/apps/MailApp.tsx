// ── MailApp.tsx ───────────────────────────────────────────────────────────────
// In-game mail client. Reads from mailStore.
// Displays unread badge, tag colours, and full message body.

import { useState } from 'react'
import { checkTriggers } from '@/store/triggerEngine'
import { useMailStore, Mail } from '@/store/mailStore'

const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  surf2:   '#16161f',
  border:  '#2a2a3a',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

const TAG_COLOR: Record<Mail['tag'], string> = {
  SYSTEM: '#00e5ff',
  LORE:   '#6b6b80',
  JOB:    '#00cc88',
  NPC:    '#d6a2ff',
  THREAT: '#ff3b5c',
  ANON:   '#ffaa00',
}

export default function MailApp() {
  const mails    = useMailStore(s => s.mails)
  const markRead = useMailStore(s => s.markRead)
  const [activeId, setActiveId] = useState<string | null>(mails[0]?.id ?? null)

  const active = mails.find(m => m.id === activeId) ?? null

  function open(id: string) {
    const mail = mails.find(m => m.id === id)
    setActiveId(id)
    markRead(id)
    if (mail) checkTriggers({ type: 'email_read', emailId: mail.storyId ?? mail.id })
  }

  const unread = mails.filter(m => m.unread).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>

      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 14, color: C.accent, fontWeight: 'bold' }}>MAIL</span>
          {unread > 0 && (
            <span style={{ fontSize: 10, color: C.warn }}>{unread} unread</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
          node: local.grid // inbox
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Mail list */}
        <div style={{ width: 260, borderRight: `1px solid ${C.border}`,
          overflow: 'auto', flexShrink: 0 }}>
          {mails.map(m => (
            <MailRow
              key={m.id}
              mail={m}
              active={m.id === activeId}
              onClick={() => open(m.id)}
            />
          ))}
        </div>

        {/* Mail body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px' }}>
          {active ? <MailDetail mail={active} /> : (
            <div style={{ color: C.faint, fontSize: 11, marginTop: 40, textAlign: 'center' }}>
              // select a message
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mail Row ──────────────────────────────────────────────────────────────────
function MailRow({ mail, active, onClick }:
  { mail: Mail; active: boolean; onClick: () => void }) {

  const tc = TAG_COLOR[mail.tag]

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
        padding: '10px 12px',
        background: active ? C.surf2 : 'none',
        borderBottom: `1px solid ${C.border}`,
        borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
        fontFamily: 'inherit',
        transition: 'background 0.12s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: tc, letterSpacing: '0.1em',
          fontWeight: 'bold' }}>{mail.tag}</span>
        <span style={{ fontSize: 9, color: C.faint }}>{mail.date}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* unread dot */}
        {mail.unread && (
          <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: mail.dot ?? C.muted }} />
        )}
        <div style={{ fontSize: 11, color: mail.unread ? C.text : C.muted,
          fontWeight: mail.unread ? 'bold' : 'normal',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: 1 }}>
          {mail.subject}
        </div>
      </div>

      <div style={{ fontSize: 10, color: C.faint, marginTop: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {mail.from}
      </div>
    </button>
  )
}

// ── Mail Detail ───────────────────────────────────────────────────────────────
function MailDetail({ mail }: { mail: Mail }) {
  const tc = TAG_COLOR[mail.tag]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Subject line */}
      <div>
        <div style={{ fontSize: 9, color: tc, letterSpacing: '0.12em',
          marginBottom: 6 }}>[{mail.tag}]</div>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 'bold',
          lineHeight: 1.4, marginBottom: 6 }}>
          {mail.subject}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>
          from: <span style={{ color: tc }}>{mail.from}</span>
          {'  '}{mail.date}
        </div>
      </div>

      <div style={{ height: 1, background: C.border }} />

      {/* Body */}
      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8,
        whiteSpace: 'pre-wrap' }}>
        {mail.body}
      </div>

      {/* Watch code callout */}
      {mail.watchCode && (
        <div style={{
          marginTop: 8,
          background: `${C.accent}0d`,
          border: `1px solid ${C.accent}44`,
          borderRadius: 6, padding: '10px 14px',
        }}>
          <div style={{ fontSize: 9, color: C.accent, letterSpacing: '0.12em',
            marginBottom: 6 }}>ACCESS CODE</div>
          <div style={{ fontSize: 16, color: C.accent, fontWeight: 'bold',
            letterSpacing: '0.15em' }}>
            {mail.watchCode}
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
            Use this in the App Store → Restricted → Watch
          </div>
        </div>
      )}
    </div>
  )
}
