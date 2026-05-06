import { useMemo, useState } from 'react'

type LinkItem = {
  label: string
  url: string
}

type PageData = {
  site: string
  title: string
  subtitle?: string
  theme?: 'corp' | 'news' | 'forum' | 'blog' | 'hidden'
  body: string[]
  links: LinkItem[]
}

const PAGES: Record<string, PageData> = {
  'gridos.corp': {
    site: 'GridOS Corporate',
    title: 'Welcome to GridOS',
    subtitle: 'Infrastructure for a safer, more connected civilization.',
    theme: 'corp',
    body: [
      'GridOS powers 94% of all consumer and enterprise systems across the continental network.',
      'From banking to identity verification to logistics routing, GridOS delivers trust at scale.',
      'Unauthorized system tampering is a violation of the Unified Access Compact.',
    ],
    links: [
      { label: 'Investor Relations', url: 'gridos.corp/investors' },
      { label: 'Trust & Safety', url: 'gridos.corp/trust' },
      { label: 'Careers', url: 'gridos.corp/careers' },
    ],
  },

  'gridos.corp/investors': {
    site: 'GridOS Corporate',
    title: 'Investor Relations',
    subtitle: 'Quarterly confidence through total systems ownership.',
    theme: 'corp',
    body: [
      'GridOS posted record growth in public infrastructure, identity tooling, and behavioral compliance analytics.',
      'Shareholder memo: vertical integration remains the company’s strongest strategic moat.',
      'Analysts note concern over rising “ghost traffic” within unmanaged public nodes.',
    ],
    links: [
      { label: 'Return to Home', url: 'gridos.corp' },
      { label: 'Read Trust & Safety', url: 'gridos.corp/trust' },
      { label: 'View Pulse News coverage', url: 'pulse.news' },
    ],
  },

  'gridos.corp/trust': {
    site: 'GridOS Corporate',
    title: 'Trust & Safety',
    subtitle: 'Security is freedom.',
    theme: 'corp',
    body: [
      'GridOS continuously scans for malicious automation, dissident signal clustering, and hostile script behavior.',
      'To ensure user wellbeing, flagged activity may trigger silent intervention.',
      'Reminder: privacy is a managed privilege, not a default condition.',
    ],
    links: [
      { label: 'Corporate Home', url: 'gridos.corp' },
      { label: 'Open Public Forum Thread', url: 'yellowthread.forum/thread/gridos-watch' },
    ],
  },

  'gridos.corp/careers': {
    site: 'GridOS Corporate',
    title: 'Careers at GridOS',
    subtitle: 'Build the network that builds the world.',
    theme: 'corp',
    body: [
      'Open roles include Content Integrity Operator, Credit Risk Verifier, Junior Behavioral Auditor, and Node Sanitation Associate.',
      'Candidates with forensics, moderation, and systems scripting experience are strongly preferred.',
      'All hires undergo identity mesh review and loyalty scoring.',
    ],
    links: [
      { label: 'Return to Home', url: 'gridos.corp' },
      { label: 'Read Ghostlily blog', url: 'ghostlily.blog' },
    ],
  },

  'pulse.news': {
    site: 'Pulse News',
    title: 'Pulse // Daily Feed',
    subtitle: 'Signal. Markets. Weather. Compliance.',
    theme: 'news',
    body: [
      'GridOS shares rose 4.2% after regulators approved expanded biometric indexing in three major sectors.',
      'Shipping delays continue in the southern relay after unexplained node blackouts.',
      'An anonymous watchdog claims public archive pages are being quietly rewritten overnight.',
    ],
    links: [
      { label: 'Market Brief: GridOS climbs again', url: 'pulse.news/markets/gridos' },
      { label: 'Local outages spread', url: 'pulse.news/outages' },
      { label: 'Open Ghostlily blog', url: 'ghostlily.blog' },
    ],
  },

  'pulse.news/markets/gridos': {
    site: 'Pulse News',
    title: 'GridOS climbs again',
    subtitle: 'Investors reward centralization, critics warn of overreach.',
    theme: 'news',
    body: [
      'Institutional confidence remains high as GridOS expands deeper into finance, transit, and identity services.',
      'Short sellers continue to bet on a public trust collapse, but no material downside has appeared this quarter.',
      'Unverified chatter suggests internal sabotage is being misreported as “routine service decay.”',
    ],
    links: [
      { label: 'Back to Pulse', url: 'pulse.news' },
      { label: 'Read forum thread', url: 'yellowthread.forum/thread/gridos-watch' },
    ],
  },

  'pulse.news/outages': {
    site: 'Pulse News',
    title: 'Local outages spread',
    subtitle: 'GridOS says disruptions are contained.',
    theme: 'news',
    body: [
      'Citizens across low-priority districts reported authentication failures, payment freezes, and transit routing errors.',
      'GridOS issued a short statement calling the incidents “non-systemic.”',
      'A leaked screenshot appears to reference an internal term: ROOT BLOOM.',
    ],
    links: [
      { label: 'Back to Pulse', url: 'pulse.news' },
      { label: 'What is ROOT BLOOM?', url: 'ghostlily.blog/root-bloom' },
    ],
  },

  'yellowthread.forum': {
    site: 'YellowThread Forum',
    title: 'YellowThread // Public Index',
    subtitle: 'Public discussion. Minimal moderation. Max noise.',
    theme: 'forum',
    body: [
      'Trending topics: fake outage maps, vanished archives, ghost traffic, corp recruiters in public boards.',
      'Most users assume the site is monitored, but that has never stopped anyone from posting.',
      'Thread quality varies between useful leaks and complete nonsense.',
    ],
    links: [
      { label: 'Thread: “GridOS is watching private drafts”', url: 'yellowthread.forum/thread/gridos-watch' },
      { label: 'Thread: “Ghost traffic near old civic nodes”', url: 'yellowthread.forum/thread/ghost-traffic' },
      { label: 'Visit Pulse News', url: 'pulse.news' },
    ],
  },

  'yellowthread.forum/thread/gridos-watch': {
    site: 'YellowThread Forum',
    title: 'Thread: “GridOS is watching private drafts”',
    subtitle: '42 replies // 6 removed // 1 account banned',
    theme: 'forum',
    body: [
      'OP: “I had a draft complaint open in a private editor. Next morning my credit score changed.”',
      'Reply #12: “Trust & Safety reads more than they admit. Check the old archive mirrors before they vanish.”',
      'Reply #31: “Look at ghostlily.blog. She kept receipts before going quiet.”',
    ],
    links: [
      { label: 'Return to Forum', url: 'yellowthread.forum' },
      { label: 'Open Ghostlily blog', url: 'ghostlily.blog' },
    ],
  },

  'yellowthread.forum/thread/ghost-traffic': {
    site: 'YellowThread Forum',
    title: 'Thread: “Ghost traffic near old civic nodes”',
    subtitle: '13 replies // low trust // archived',
    theme: 'forum',
    body: [
      'Users reported crawler signatures moving through public pages that were not linked anywhere.',
      'One poster claims hidden URLs still exist if typed exactly.',
      'A deleted reply referenced: civic.archive/flowering',
    ],
    links: [
      { label: 'Return to Forum', url: 'yellowthread.forum' },
      { label: 'Try civic.archive/flowering', url: 'civic.archive/flowering' },
    ],
  },

  'ghostlily.blog': {
    site: 'ghostlily.blog',
    title: 'ghostlily // notes from the soft edge',
    subtitle: 'some things are still worth writing down',
    theme: 'blog',
    body: [
      'If you are reading this on a normal public route, then the mirrors still work.',
      'GridOS does not merely host the network. It edits memory inside it.',
      'If pages disappear, compare timestamps. If timestamps agree too perfectly, the page was rewritten.',
    ],
    links: [
      { label: 'Entry: ROOT BLOOM', url: 'ghostlily.blog/root-bloom' },
      { label: 'Entry: missing public records', url: 'ghostlily.blog/missing-records' },
      { label: 'Open YellowThread', url: 'yellowthread.forum' },
    ],
  },

  'ghostlily.blog/root-bloom': {
    site: 'ghostlily.blog',
    title: 'ROOT BLOOM',
    subtitle: 'not an outage, not a bug',
    theme: 'blog',
    body: [
      'ROOT BLOOM is what happens when too many hidden watchers spawn inside the same civic layer.',
      'GridOS calls it correction. Users experience it as confusion, debt, broken identity, and silence.',
      'If the bloom reaches archive depth, the past becomes editable.',
    ],
    links: [
      { label: 'Back to Blog', url: 'ghostlily.blog' },
      { label: 'Read missing public records', url: 'ghostlily.blog/missing-records' },
    ],
  },

  'ghostlily.blog/missing-records': {
    site: 'ghostlily.blog',
    title: 'missing public records',
    subtitle: 'there was a city here once',
    theme: 'blog',
    body: [
      'I found references to a municipal archive that should not exist anymore.',
      'The public links were removed, but one of the old forum replies still mentions a path.',
      'If civic.archive/flowering loads for you, do not trust the first page you see.',
    ],
    links: [
      { label: 'Back to Blog', url: 'ghostlily.blog' },
      { label: 'Open civic.archive/flowering', url: 'civic.archive/flowering' },
    ],
  },

  'civic.archive/flowering': {
    site: 'Civic Archive Mirror',
    title: 'Municipal Archive // Flowering District',
    subtitle: 'mirror integrity: partial',
    theme: 'hidden',
    body: [
      'Archive fragment recovered. District census incomplete. Infrastructure ownership field overwritten.',
      'Pre-GridOS municipal records indicate public routing systems were once independently governed.',
      'A final note remains in the metadata: “they bought the roads, then the names, then the memory of both.”',
    ],
    links: [
      { label: 'Return to Ghostlily blog', url: 'ghostlily.blog/missing-records' },
      { label: 'Corporate response', url: 'gridos.corp/trust' },
    ],
  },
}

const THEME_STYLES = {
  corp: {
    header: '#00e5ff',
    badgeBg: 'rgba(0,229,255,0.12)',
    badgeBorder: 'rgba(0,229,255,0.35)',
  },
  news: {
    header: '#ffd166',
    badgeBg: 'rgba(255,209,102,0.12)',
    badgeBorder: 'rgba(255,209,102,0.35)',
  },
  forum: {
    header: '#7bd389',
    badgeBg: 'rgba(123,211,137,0.12)',
    badgeBorder: 'rgba(123,211,137,0.35)',
  },
  blog: {
    header: '#d6a2ff',
    badgeBg: 'rgba(214,162,255,0.12)',
    badgeBorder: 'rgba(214,162,255,0.35)',
  },
  hidden: {
    header: '#ff6b6b',
    badgeBg: 'rgba(255,107,107,0.12)',
    badgeBorder: 'rgba(255,107,107,0.35)',
  },
}

const DEFAULT_URL = 'gridos.corp'

export default function GridBrowser() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL)
  const [input, setInput] = useState(DEFAULT_URL)
  const [history, setHistory] = useState<string[]>([DEFAULT_URL])
  const [historyIndex, setHistoryIndex] = useState(0)

  const page = PAGES[currentUrl] ?? null

  const theme = useMemo(() => {
    if (!page) return THEME_STYLES.corp
    return THEME_STYLES[page.theme ?? 'corp']
  }, [page])

  function goTo(url: string) {
    const normalized = url.trim().toLowerCase()
    if (!normalized) return

    setCurrentUrl(normalized)
    setInput(normalized)

    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      next.push(normalized)
      return next
    })
    setHistoryIndex(prev => prev + 1)
  }

  function goBack() {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    const nextUrl = history[nextIndex]
    setHistoryIndex(nextIndex)
    setCurrentUrl(nextUrl)
    setInput(nextUrl)
  }

  function goForward() {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    const nextUrl = history[nextIndex]
    setHistoryIndex(nextIndex)
    setCurrentUrl(nextUrl)
    setInput(nextUrl)
  }

  function goHome() {
    goTo(DEFAULT_URL)
  }

  function submitAddressBar(e: React.FormEvent) {
    e.preventDefault()
    goTo(input)
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#090b12',
        color: '#c8c8d8',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid #222634',
          background: '#0f1320',
        }}
      >
        <button onClick={goBack} style={navBtn(historyIndex > 0)}>←</button>
        <button onClick={goForward} style={navBtn(historyIndex < history.length - 1)}>→</button>
        <button onClick={goHome} style={navBtn(true)}>⌂</button>

        <form onSubmit={submitAddressBar} style={{ flex: 1 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              width: '100%',
              background: '#0a0d16',
              color: '#d8deea',
              border: '1px solid #283042',
              borderRadius: 6,
              padding: '9px 12px',
              outline: 'none',
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </form>
      </div>

      <div
        style={{
          padding: 18,
          overflow: 'auto',
          height: '100%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 220px)',
        }}
      >
        {!page ? (
          <div style={missingPageStyle}>
            <div style={{ fontSize: 28, color: '#ff6b6b', marginBottom: 8 }}>404</div>
            <div style={{ fontSize: 18, marginBottom: 6 }}>Page not found</div>
            <div style={{ color: '#8892a6', marginBottom: 14 }}>
              No public route exists for <code>{currentUrl}</code>
            </div>
            <button onClick={goHome} style={linkButton('#00e5ff')}>Return to GridOS home</button>
          </div>
        ) : (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 999,
                border: `1px solid ${theme.badgeBorder}`,
                background: theme.badgeBg,
                color: theme.header,
                fontSize: 12,
                marginBottom: 14,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {page.site}
            </div>

            <h1
              style={{
                fontSize: 30,
                lineHeight: 1.1,
                marginBottom: 8,
                color: '#eef3ff',
              }}
            >
              {page.title}
            </h1>

            {page.subtitle && (
              <p
                style={{
                  fontSize: 15,
                  color: '#96a1b5',
                  marginBottom: 22,
                  maxWidth: 680,
                }}
              >
                {page.subtitle}
              </p>
            )}

            <div
              style={{
                display: 'grid',
                gap: 14,
                marginBottom: 24,
              }}
            >
              {page.body.map((paragraph, i) => (
                <div
                  key={i}
                  style={{
                    background: '#0d111a',
                    border: '1px solid #202636',
                    borderRadius: 10,
                    padding: 14,
                    color: '#cfd6e4',
                    lineHeight: 1.6,
                    fontSize: 14,
                  }}
                >
                  {paragraph}
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: '1px solid #232938',
                paddingTop: 18,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: theme.header,
                  marginBottom: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Linked pages
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {page.links.map((link) => (
                  <button
                    key={link.url}
                    onClick={() => goTo(link.url)}
                    style={linkButton(theme.header)}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function navBtn(enabled: boolean): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid #283042',
    background: enabled ? '#121827' : '#0d121d',
    color: enabled ? '#d7e0ef' : '#566074',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 14,
  }
}

function linkButton(color: string): React.CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${color}44`,
    background: `${color}12`,
    color,
    cursor: 'pointer',
    fontSize: 13,
  }
}

const missingPageStyle: React.CSSProperties = {
  height: '100%',
  minHeight: 260,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  background: '#0d111a',
  border: '1px solid #202636',
  borderRadius: 12,
  padding: 24,
}