import { useEffect, useMemo, useState, useCallback } from 'react'
import { checkTriggers } from '@/store/triggerEngine'
import { useEmailQueueStore } from '@/store/emailQueue'
import { useMailStore } from '@/store/mailStore'
import { useMissionStore } from '@/store/missionStore'
import { useRepStore } from '@/store/reputationStore'
import { useStoryStore } from '@/store/storyStore'
import { useUnlockStore } from '@/store/unlockStore'
import { useSite, type SiteContentRow } from '@/hooks/useSite'

const C = {
  bg:      '#090b12',
  surface: '#0d111a',
  border:  '#202636',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  warn:    '#ffd166',
  danger:  '#ff6b6b',
}

export default function GridBrowser() {
  const [url, setUrl]         = useState('gridos.corp')
  const [input, setInput]     = useState('gridos.corp')
  const { site, loading }     = useSite(url)

  const navigate = useCallback((dest: string) => {
    const clean = dest.trim().replace(/^https?:\/\//, '')
    setUrl(clean)
    setInput(clean)
    checkTriggers({ type: 'page_visit', url: clean })
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate(input)
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Address bar */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex', gap: 8, padding: '10px 14px',
        background: '#0f1320', borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            flex: 1, background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '6px 10px', fontSize: 12, color: C.text,
            fontFamily: 'inherit', outline: 'none',
          }}
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" style={{
          padding: '6px 14px', borderRadius: 6, fontSize: 11,
          border: `1px solid ${C.accent}66`, background: `${C.accent}12`,
          color: C.accent, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          GO
        </button>
      </form>

      {/* Page content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {loading ? (
          <div style={{ color: C.muted, fontSize: 12 }}>Connecting…</div>
        ) : site ? (
          <SitePage site={site} navigate={navigate} />
        ) : (
          <NotFound url={url} />
        )}
      </div>
    </div>
  )
}

// ── SitePage ─────────────────────────────────────────────────────────────────

function SitePage({
  site,
  navigate,
}: {
  site: SiteContentRow
  navigate: (url: string) => void
}) {
  const lines = site.body.split('\n')

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{
        fontSize: 11, color: C.accent, letterSpacing: '0.1em',
        marginBottom: 16, opacity: 0.7,
      }}>
        {site.url}
      </div>
      <h1 style={{ fontSize: 18, color: '#eef3ff', marginBottom: 12, lineHeight: 1.3 }}>
        {site.title}
      </h1>
      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8 }}>
        {lines.map((line, i) => {
          // Render [link text](url) as clickable spans
          const parts = line.split(/(\[[^\]]+\]\([^)]+\))/g)
          return (
            <p key={i} style={{ marginBottom: 8, color: line.startsWith('//') ? C.muted : C.text }}>
              {parts.map((part, j) => {
                const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
                if (m) {
                  return (
                    <span
                      key={j}
                      onClick={() => navigate(m[2])}
                      style={{
                        color: C.accent, cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: `${C.accent}55`,
                      }}
                    >
                      {m[1]}
                    </span>
                  )
                }
                return part
              })}
            </p>
          )
        })}
      </div>
    </div>
  )
}

// ── 404 ──────────────────────────────────────────────────────────────────────

function NotFound({ url }: { url: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, paddingTop: 80,
      color: C.muted, fontSize: 12, textAlign: 'center',
    }}>
      <span style={{ fontSize: 28, color: C.faint }}>404</span>
      <span>No site found at <span style={{ color: C.warn }}>{url}</span></span>
      <span style={{ color: C.faint, fontSize: 11 }}>
        Some pages only surface after in-world events.
      </span>
    </div>
  )
}
