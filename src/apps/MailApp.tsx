// ── MailApp.tsx ─────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useMailStore, type Mail, type MailTag } from '@/store/mailStore'

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

const TAG_COLOR: Record<MailTag, string> = {
  job:     C.success,
  system:  C.accent,
  lore:    C.muted,
  unlock:  C.violet,
  npc:     C.warn,
  threat:  C.danger,
}

export default function MailApp() {
  const mails     = useMailStore(s => s.mails)
  const markRead  = useMailStore(s => s.markRead)
  const [selected, setSelected] = useState<Mail | null>(null)

  function open(mail: Mail) {
    if (!mail.read) {
      markRead(mail.id)
      mail.onOpen?.()
    }
    setSelected(mail)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', monospace",
      overflow: 'hidden', fontSize: 12 }}>

      {/* Header */}
      <div style={{ padding: '12px 18px 10px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 14, color: C.accent, fontWeight: 'bold' }}>MAIL</span>
          <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}>
            {mails.filter(m => !m.read).length} unread
          </span>
        </div>
        <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
          node: local.grid // inbox
        </div>
      </div>

      {/* Split view */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Mail list */}
        <div style={{ width: 260, borderRight: `1px solid ${C.border}`,
          overflow: 'auto', flexShrink: 0 }}>
          {mails.length === 0 && (
            <div style={{ padding: 24, color: C.faint, fontSize: 11,
              textAlign: 'center' }}>
              No messages.
            </div>
          )}
          {mails.map(mail => (
            <MailRow
              key={mail.id}
              mail={mail}
              active={selected?.id === mail.id}
              onClick={() => open(mail)}
            />
          ))}
        </div>

        {/* Reading pane */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {selected ? (
            <MailView mail={selected} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 8,
              color: C.faint }}>
              <span style={{ fontSize: 22 }}>✉</span>
              <span style={{ fontSize: 11 }}>Select a message</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mail row ───────────────────────────────────────────────────────────────────
function MailRow({ mail, active, onClick }:
  { mail: Mail; active: boolean; onClick: () => void }) {
  const tagColor = TAG_COLOR[mail.tag]
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', background: active ? C.surf2 : 'none',
      border: 'none', borderBottom: `1px solid ${C.border}`,
      borderLeft: `3px solid ${active ? tagColor : 'transparent'}`,
      padding: '10px 12px', cursor: 'pointer', fontFamily: 'inherit',
      transition: 'background 0.12s' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: tagColor,
          letterSpacing: '0.06em' }}>
          {mail.tag.toUpperCase()}
        </span>
        <span style={{ fontSize: 9, color: C.faint }}>
          {mail.timestamp}
        </span>
      </div>

      <div style={{ fontSize: 11, color: mail.read ? C.muted : C.text,
        fontWeight: mail.read ? 'normal' : 'bold', marginBottom: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {mail.subject}
      </div>

      <div style={{ fontSize: 10, color: C.faint,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {mail.from}
      </div>

      {!mail.read && (
        <div style={{ width: 6, height: 6, borderRadius: '50%',
          background: tagColor, marginTop: 4 }} />
      )}
    </button>
  )
}

// ── Reading pane ─────────────────────────────────────────────────────────────
function MailView({ mail }: { mail: Mail }) {
  const tagColor = TAG_COLOR[mail.tag]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Meta */}
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
        <div style={{ fontSize: 9, color: tagColor, letterSpacing: '0.1em',
          marginBottom: 6 }}>
          [{mail.tag.toUpperCase()}]
        </div>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 8,
          lineHeight: 1.3 }}>
          {mail.subject}
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 10, color: C.muted }}>
          <span>from: <span style={{ color: C.accent }}>{mail.from}</span></span>
          <span>{mail.timestamp}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ fontSize: 11, color: C.text, lineHeight: 1.8,
        whiteSpace: 'pre-wrap' }}>
        {mail.body}
      </div>
    </div>
  )
}
