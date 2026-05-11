// ── NotificationToast.tsx ─────────────────────────────────────────────────────────
// Windows-style bottom-right toast stack.
// Mount once inside OSShell, above the taskbar z-layer.
// Notifications slide in from the right, stack upward, auto-dismiss.

import { useEffect, useState } from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notification, NotifType } from '@/store/notificationStore'

const TYPE_ACCENT: Record<NotifType, string> = {
  info:    '#00e5ff',
  success: '#00cc88',
  warning: '#ffaa00',
  danger:  '#ff3b5c',
  mission: '#ffaa00',
  mail:    '#00e5ff',
}

const TYPE_ICON: Record<NotifType, string> = {
  info:    'ℹ',
  success: '✓',
  warning: '⚠',
  danger:  '⚠',
  mission: '[□]',
  mail:    '✉',
}

function Toast({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const accent = TYPE_ACCENT[notif.type ?? 'info']
  const icon   = TYPE_ICON[notif.type ?? 'info']

  // Slide-in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      style={{
        width:         320,
        background:    '#111118',
        border:        `1px solid ${accent}44`,
        borderLeft:    `3px solid ${accent}`,
        borderRadius:  6,
        boxShadow:     '0 4px 24px rgba(0,0,0,0.7)',
        overflow:      'hidden',
        fontFamily:    "'JetBrains Mono', monospace",
        transform:     visible ? 'translateX(0)' : 'translateX(110%)',
        opacity:       visible ? 1 : 0,
        transition:    'transform 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease',
        pointerEvents: 'all',
      }}
    >
      {/* Header row */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '8px 10px 6px',
        background:     '#16161f',
        borderBottom:   `1px solid #2a2a3a`,
      }}>
        <span style={{ color: accent, fontSize: 12, flexShrink: 0 }}>{icon}</span>
        <span style={{
          flex:         1,
          fontSize:     10,
          fontWeight:   'bold',
          color:        accent,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {notif.title}
        </span>
        <button
          onClick={onDismiss}
          style={{
            background:  'none',
            border:      'none',
            color:       '#6b6b80',
            cursor:      'pointer',
            fontSize:    12,
            lineHeight:  1,
            padding:     '0 2px',
            flexShrink:  0,
          }}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>

      {/* Body */}
      {notif.body && (
        <div style={{
          padding:    '7px 10px 8px',
          fontSize:   10,
          color:      '#c8c8d8',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>
          {notif.body}
        </div>
      )}

      {/* Progress bar — shrinks over duration */}
      {(notif.duration ?? 5000) > 0 && (
        <div style={{ height: 2, background: '#1a1a26' }}>
          <div
            style={{
              height:     '100%',
              background: accent + '88',
              animation:  `toast-shrink ${notif.duration ?? 5000}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function NotificationToast() {
  const toasts  = useNotificationStore(s => s.toasts)
  const dismiss = useNotificationStore(s => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <>
      {/* Keyframe for progress bar */}
      <style>{`
        @keyframes toast-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {/* Toast stack — bottom-right, above taskbar (z-index 500) */}
      <div style={{
        position:      'fixed',
        bottom:        52,   /* sit just above the 44px taskbar */
        right:         16,
        zIndex:        500,
        display:       'flex',
        flexDirection: 'column-reverse',
        gap:           8,
        pointerEvents: 'none',
      }}>
        {toasts.map(n => (
          <Toast key={n.id} notif={n} onDismiss={() => dismiss(n.id)} />
        ))}
      </div>
    </>
  )
}
