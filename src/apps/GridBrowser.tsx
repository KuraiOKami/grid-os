import { useCallback, useState } from 'react'
import { checkTriggers } from '@/store/triggerEngine'
import { useSite } from '@/hooks/useSite'
import type { SiteRow, SiteContentRow } from '@/lib/browserTypes'

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
  green:   '#39ff99',
}

export default function GridBrowser() {
  const [url, setUrl]   = useState('gridos.corp')
  const [input, setInput] = useState('gridos.corp')
  const result          = useSite(url)

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
        {result.status === 'loading' || result.status === 'idle' ? (
          <div style={{ color: C.muted, fontSize: 12 }}>Connecting…</div>
        ) : result.status === 'ok' ? (
          <SitePage site={result.site} navigate={navigate} />
        ) : result.status === 'not_found' ? (
          <NotFound url={url} />
        ) : (
          <ErrorState message={result.message} />
        )}
      </div>
    </div>
  )
}

// ── SitePage ──────────────────────────────────────────────────────────────────

function SitePage({ site, navigate }: { site: SiteRow; navigate: (url: string) => void }) {
  const rows: SiteContentRow[] = site.content ?? []

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C.accent, letterSpacing: '0.1em', marginBottom: 6, opacity: 0.7 }}>
          {site.slug}
        </div>
        <h1 style={{ fontSize: 18, color: '#eef3ff', marginBottom: 4, lineHeight: 1.3 }}>
          {site.title}
        </h1>
        {site.subtitle && (
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{site.subtitle}</p>
        )}
      </div>

      {/* Content rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 && (
          <p style={{ color: C.faint, fontSize: 12 }}>[ No content ]</p>
        )}
        {rows.map(row => {
          if (row.kind === 'body') {
            return (
              <BodyBlock key={row.id} text={row.body_text ?? ''} navigate={navigate} />
            )
          }
          if (row.kind === 'link') {
            return (
              <span
                key={row.id}
                onClick={() => row.link_url && navigate(row.link_url)}
                style={{
                  color: C.accent, cursor: 'pointer', fontSize: 12,
                  textDecoration: 'underline', textDecorationColor: `${C.accent}55`,
                }}
              >
                → {row.link_label ?? row.link_url}
              </span>
            )
          }
          if (row.kind === 'job') {
            return (
              <div key={row.id} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '10px 14px', fontSize: 12,
              }}>
                <div style={{ color: C.green, marginBottom: 4 }}>{row.job_title}</div>
                <div style={{ color: C.muted }}>
                  {row.job_corp} — <span style={{ color: C.warn }}>{row.job_pay}</span>
                </div>
              </div>
            )
          }
          if (row.kind === 'forum_post') {
            return (
              <div key={row.id} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '10px 14px', fontSize: 12,
                opacity: row.post_removed ? 0.4 : 1,
              }}>
                <div style={{ color: C.accent, marginBottom: 4 }}>
                  {row.post_author}
                  {row.post_handle && (
                    <span style={{ color: C.muted }}> @{row.post_handle}</span>
                  )}
                </div>
                <p style={{ color: C.text, margin: '0 0 6px', lineHeight: 1.6 }}>
                  {row.post_removed ? '[removed]' : row.post_body}
                </p>
                {(row.post_replies ?? 0) > 0 && (
                  <div style={{ color: C.faint, fontSize: 11 }}>
                    {row.post_replies} repl{row.post_replies === 1 ? 'y' : 'ies'}
                  </div>
                )}
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

// ── BodyBlock — parses [label](url) markdown links ───────────────────────────

function BodyBlock({ text, navigate }: { text: string; navigate: (url: string) => void }) {
  const lines = text.split('\n')
  return (
    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        const parts = line.split(/(\[[^\]]+\]\([^)]+\))/g)
        return (
          <p key={i} style={{ marginBottom: 6, color: line.startsWith('//') ? C.muted : C.text }}>
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
  )
}

// ── 404 ───────────────────────────────────────────────────────────────────────

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

// ── Error ─────────────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ color: C.danger, fontSize: 12, paddingTop: 40 }}>
      ⚠ Connection error: {message}
    </div>
  )
}
