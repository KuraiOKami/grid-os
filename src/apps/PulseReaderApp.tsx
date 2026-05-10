// PulseReaderApp — sanitised Pulse Network feed reader

import { useState } from 'react'

const C = {
  bg: '#0a0c10', surface: '#0f1318', border: '#1e2430',
  text: '#c8c8d8', muted: '#6b6b80', accent: '#00e5ff',
  warn: '#ffaa00', danger: '#ff3b5c', faint: '#2a2a3a',
}

const ARTICLES = [
  {
    id: 'a1', category: 'INFRASTRUCTURE', ts: '07 May · 06:14',
    headline: 'ROOT BLOOM — third cell disrupted this week',
    body: 'GridOS officials say containment is "proceeding as scheduled." Anonymous sources within the compliance queue say otherwise. The third disruption in six days has not been disclosed in public infrastructure logs.',
    flagged: true,
  },
  {
    id: 'a2', category: 'MARKETS', ts: '07 May · 08:31',
    headline: 'GridOS shares rise 4.2% after biometric indexing approval',
    body: 'Regulators approved expanded biometric indexing across three major sectors. Analysts note the move consolidates GridOS\'s position as the dominant infrastructure provider. Shareholder memo: "vertical integration remains the company\'s strongest strategic moat."',
    flagged: false,
  },
  {
    id: 'a3', category: 'CIVIC', ts: '07 May · 09:02',
    headline: 'Civic archive suspended pending "routine maintenance"',
    body: 'The civic archive has been inaccessible since Tuesday. GridOS has not provided an estimated return window. An anonymous watchdog claims select pages are being quietly rewritten overnight. No official comment.',
    flagged: true,
  },
  {
    id: 'a4', category: 'LOGISTICS', ts: '07 May · 10:45',
    headline: 'Southern relay disruptions continue — cause unspecified',
    body: 'Shipping delays continue in the southern relay following unexplained node blackouts. GridOS classifies the cause as "routine service decay." Three courier guilds have filed separate service interruption reports.',
    flagged: false,
  },
  {
    id: 'a5', category: 'WORKFORCE', ts: '07 May · 11:17',
    headline: 'GridMart expands to three new fulfillment nodes in Sector 9',
    body: 'Workforce integration is underway. Automated systems will handle 94% of floor operations. GridOS Workforce Division confirms 240 citizen contracts will not be renewed following the transition.',
    flagged: false,
  },
  {
    id: 'a6', category: 'COURIER GUILD', ts: '07 May · 13:55',
    headline: 'Two Anonymous Courier Guild members listed as inactive',
    body: 'The Courier Guild has updated its active member registry. Two senior members have been marked inactive effective immediately. No reason has been provided. Guild leadership has not responded to requests for comment.',
    flagged: true,
  },
]

export default function PulseReaderApp() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = ARTICLES.find(a => a.id === activeId)

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px', background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ color: C.accent, fontWeight: 'bold', letterSpacing: 2 }}>PULSE</span>
          <span style={{ color: C.muted, marginLeft: 8, fontSize: 10 }}>// NETWORK // SANITISED EDITION</span>
        </div>
        <span style={{ fontSize: 10, color: C.muted }}>07 May 2026</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Article list */}
        <div style={{ width: 280, borderRight: `1px solid ${C.border}`, overflowY: 'auto', flexShrink: 0 }}>
          {ARTICLES.map(a => (
            <button
              key={a.id}
              onClick={() => setActiveId(a.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 14px',
                borderBottom: `1px solid ${C.border}`,
                background: activeId === a.id ? `${C.accent}0a` : 'transparent',
                border: 'none', cursor: 'pointer',
                borderLeft: activeId === a.id ? `2px solid ${C.accent}` : '2px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 9, color: a.flagged ? C.warn : C.muted, letterSpacing: 1, marginBottom: 4 }}>
                {a.category} {a.flagged && '⚠'}
              </div>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>{a.headline}</div>
              <div style={{ fontSize: 9, color: C.faint, marginTop: 4 }}>{a.ts}</div>
            </button>
          ))}
        </div>

        {/* Article body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {!active ? (
            <div style={{ color: C.muted, paddingTop: 40, textAlign: 'center' }}>
              Select an article to read.
            </div>
          ) : (
            <div style={{ maxWidth: 560 }}>
              <div style={{ fontSize: 9, color: active.flagged ? C.warn : C.muted, letterSpacing: 1, marginBottom: 8 }}>
                {active.category} · {active.ts}
                {active.flagged && <span style={{ marginLeft: 8, color: C.warn }}>⚠ FLAGGED DOMAIN COVERAGE</span>}
              </div>
              <div style={{ fontSize: 16, color: C.text, fontWeight: 'bold', lineHeight: 1.4, marginBottom: 16 }}>
                {active.headline}
              </div>
              <div style={{ width: 40, height: 2, background: C.accent, marginBottom: 16 }} />
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.9 }}>{active.body}</div>
              <div style={{ marginTop: 24, padding: '10px 14px', background: C.surface,
                border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 10, color: C.faint }}>
                This article has been reviewed by GridOS Content Integrity. All coverage is sanitised in accordance with the Unified Access Compact.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
