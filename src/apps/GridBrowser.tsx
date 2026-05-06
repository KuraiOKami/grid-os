import { useMemo, useState } from 'react'
import { addJob } from '@/store/jobStore'
import { useRepStore } from '@/store/reputationStore'

// ── types ────────────────────────────────────────────────────────────────
type LinkItem = { label: string; url: string }
type JobOffer = { title: string; corp: string; pay: string }

type AccessGate =
  | { type: 'compliance'; min: number }   // requires compliance >= min
  | { type: 'shadow';     min: number }   // requires shadow >= min
  | { type: 'unlocked';   key: string }   // requires a named unlock flag

type PageData = {
  site: string
  title: string
  subtitle?: string
  theme?: 'corp' | 'news' | 'forum' | 'blog' | 'hidden' | 'void'
  body: string[]
  links: LinkItem[]
  job?: JobOffer
  gate?: AccessGate                       // if set, access is gated
  gateHint?: string                       // shown on the 403 page instead of generic msg
  unlocks?: string                        // visiting this page sets this unlock flag
  repEffect?: { compliance?: number; shadow?: number } // visiting costs / earns rep
}

// ── page registry ───────────────────────────────────────────────────────────────
const PAGES: Record<string, PageData> = {

  // ─ GridOS Corporate ────────────────────────────────────────────────────────
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
      { label: 'Investor Relations',  url: 'gridos.corp/investors' },
      { label: 'Trust & Safety',      url: 'gridos.corp/trust' },
      { label: 'Careers',             url: 'gridos.corp/careers' },
    ],
    repEffect: { compliance: +1 },
  },

  'gridos.corp/investors': {
    site: 'GridOS Corporate',
    title: 'Investor Relations',
    subtitle: 'Quarterly confidence through total systems ownership.',
    theme: 'corp',
    body: [
      'GridOS posted record growth in public infrastructure, identity tooling, and behavioral compliance analytics.',
      "Shareholder memo: vertical integration remains the company's strongest strategic moat.",
      'Analysts note concern over rising "ghost traffic" within unmanaged public nodes.',
    ],
    links: [
      { label: 'Return to Home',           url: 'gridos.corp' },
      { label: 'Read Trust & Safety',      url: 'gridos.corp/trust' },
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
      { label: 'Corporate Home',    url: 'gridos.corp' },
      { label: 'Open Forum Thread', url: 'yellowthread.forum/thread/gridos-watch' },
    ],
    repEffect: { compliance: +1 },
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
      { label: 'Return to Home',      url: 'gridos.corp' },
      { label: 'Read Ghostlily blog', url: 'ghostlily.blog' },
    ],
    job: { title: 'Junior Behavioral Auditor', corp: 'GridOS', pay: '₳ 420 / task' },
    repEffect: { compliance: +1 },
  },

  'gridos.corp/internal': {
    site: 'GridOS Corporate — INTERNAL',
    title: 'Internal Systems Portal',
    subtitle: 'Restricted. Verified employees and auditors only.',
    theme: 'corp',
    gate: { type: 'compliance', min: 65 },
    gateHint: 'Your compliance score is too low. GridOS internal pages require a Trusted rating.',
    body: [
      'Active compliance review queues: 1,204 open cases. Backlog escalation authorized.',
      'Internal memo 441-C: ROOT BLOOM events are to be logged as "routine service decay" in all public-facing reports.',
      'Note: analyst access logs are retained for 180 days. All queries are attributed.',
    ],
    links: [
      { label: 'Compliance Queue',    url: 'gridos.corp/compliance' },
      { label: 'Return to Home',      url: 'gridos.corp' },
    ],
    repEffect: { compliance: +2, shadow: -1 },
  },

  'gridos.corp/compliance': {
    site: 'GridOS Corporate — INTERNAL',
    title: 'Compliance Audit Queue',
    subtitle: 'Active cases. Do not share externally.',
    theme: 'corp',
    gate: { type: 'compliance', min: 65 },
    gateHint: 'Compliance queue access requires Trusted status.',
    body: [
      'Queue depth: 1,204 cases. Average review time: 8.2 minutes. Escalation rate: 34%.',
      'Top flagged domains this cycle: civic.archive/*, ghostlily.blog, yellowthread.forum/thread/*',
      'Note: analysts who consistently close cases with "No Threat" are flagged for quality review.',
    ],
    links: [
      { label: 'Internal Portal',     url: 'gridos.corp/internal' },
      { label: 'Return to Home',      url: 'gridos.corp' },
    ],
    job: { title: 'Compliance Queue Auditor', corp: 'GridOS', pay: '₳ 600 / session' },
    repEffect: { compliance: +3, shadow: -2 },
  },

  // ─ Pulse News ─────────────────────────────────────────────────────────────────
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
      { label: 'Local outages spread',              url: 'pulse.news/outages' },
      { label: 'Open Ghostlily blog',               url: 'ghostlily.blog' },
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
      'Unverified chatter suggests internal sabotage is being misreported as "routine service decay."',
    ],
    links: [
      { label: 'Back to Pulse',     url: 'pulse.news' },
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
      'GridOS issued a short statement calling the incidents "non-systemic."',
      'A leaked screenshot appears to reference an internal term: ROOT BLOOM.',
    ],
    links: [
      { label: 'Back to Pulse',       url: 'pulse.news' },
      { label: 'What is ROOT BLOOM?', url: 'ghostlily.blog/root-bloom' },
    ],
  },

  'pulse.news/dissent': {
    site: 'Pulse News',
    title: 'The Dissent Report',
    subtitle: 'Archived. No longer updated. Last post: 14 months ago.',
    theme: 'news',
    body: [
      'The author of this column went quiet after their identity score was recalculated.',
      'Their final entry argued that the network had become its own state.',
      'Three linked sources in that article are now 404. One redirects to gridos.corp/trust.',
    ],
    links: [
      { label: 'Back to Pulse',       url: 'pulse.news' },
      { label: 'Open Civic Archive',  url: 'civic.archive/flowering' },
    ],
    repEffect: { shadow: +1, compliance: -1 },
  },

  // ─ YellowThread ────────────────────────────────────────────────────────────────
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
      { label: 'Thread: "GridOS is watching private drafts"',  url: 'yellowthread.forum/thread/gridos-watch' },
      { label: 'Thread: "Ghost traffic near old civic nodes"', url: 'yellowthread.forum/thread/ghost-traffic' },
      { label: 'Freelance board',                             url: 'yellowthread.forum/jobs' },
      { label: 'Visit Pulse News',                            url: 'pulse.news' },
    ],
    repEffect: { shadow: +1, compliance: -1 },
  },

  'yellowthread.forum/thread/gridos-watch': {
    site: 'YellowThread Forum',
    title: 'Thread: "GridOS is watching private drafts"',
    subtitle: '42 replies // 6 removed // 1 account banned',
    theme: 'forum',
    body: [
      'OP: "I had a draft complaint open in a private editor. Next morning my credit score changed."',
      'Reply #12: "Trust & Safety reads more than they admit. Check the old archive mirrors before they vanish."',
      'Reply #31: "Look at ghostlily.blog. She kept receipts before going quiet."',
    ],
    links: [
      { label: 'Return to Forum',     url: 'yellowthread.forum' },
      { label: 'Open Ghostlily blog', url: 'ghostlily.blog' },
    ],
    repEffect: { shadow: +1, compliance: -1 },
  },

  'yellowthread.forum/thread/ghost-traffic': {
    site: 'YellowThread Forum',
    title: 'Thread: "Ghost traffic near old civic nodes"',
    subtitle: '13 replies // low trust // archived',
    theme: 'forum',
    body: [
      'Users reported crawler signatures moving through public pages that were not linked anywhere.',
      'One poster claims hidden URLs still exist if typed exactly.',
      'A deleted reply referenced: civic.archive/flowering',
    ],
    links: [
      { label: 'Return to Forum',             url: 'yellowthread.forum' },
      { label: 'Try civic.archive/flowering', url: 'civic.archive/flowering' },
    ],
    repEffect: { shadow: +1 },
  },

  'yellowthread.forum/jobs': {
    site: 'YellowThread Forum',
    title: 'Freelance Board',
    subtitle: 'Anonymous contracts. No loyalty scoring.',
    theme: 'forum',
    body: [
      '[ OPEN ] Data scrape — pull public node logs before the next GridOS sweep. ₳ 310 / run.',
      '[ OPEN ] Mirror audit — verify archive integrity on three civic mirrors. ₳ 500 flat.',
      '[ OPEN ] Signal trace — locate source of ghost crawler pings in sector 4. ₳ 750. Danger pay included.',
    ],
    links: [
      { label: 'Return to Forum', url: 'yellowthread.forum' },
    ],
    job: { title: 'Signal Trace — Sector 4', corp: 'Anonymous', pay: '₳ 750 / run' },
    repEffect: { shadow: +1, compliance: -1 },
  },

  // ─ Ghostlily Blog ────────────────────────────────────────────────────────────────
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
      { label: 'Entry: ROOT BLOOM',            url: 'ghostlily.blog/root-bloom' },
      { label: 'Entry: missing public records', url: 'ghostlily.blog/missing-records' },
      { label: 'Open YellowThread',            url: 'yellowthread.forum' },
    ],
    repEffect: { shadow: +1, compliance: -1 },
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
      { label: 'Back to Blog',               url: 'ghostlily.blog' },
      { label: 'Read missing public records', url: 'ghostlily.blog/missing-records' },
    ],
    repEffect: { shadow: +1, compliance: -1 },
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
      { label: 'Back to Blog',                 url: 'ghostlily.blog' },
      { label: 'Open civic.archive/flowering', url: 'civic.archive/flowering' },
    ],
    job: { title: 'Archive Integrity Check', corp: 'Unknown client', pay: '₳ 500 flat' },
    repEffect: { shadow: +1, compliance: -1 },
  },

  // ─ Civic Archive ──────────────────────────────────────────────────────────────────
  'civic.archive/flowering': {
    site: 'Civic Archive Mirror',
    title: 'Municipal Archive // Flowering District',
    subtitle: 'mirror integrity: partial',
    theme: 'hidden',
    body: [
      'Archive fragment recovered. District census incomplete. Infrastructure ownership field overwritten.',
      'Pre-GridOS municipal records indicate public routing systems were once independently governed.',
      'A final note remains in the metadata: "they bought the roads, then the names, then the memory of both."',
    ],
    links: [
      { label: 'Return to Ghostlily blog',     url: 'ghostlily.blog/missing-records' },
      { label: 'Corporate response',           url: 'gridos.corp/trust' },
      { label: 'Deeper archive (restricted)',  url: 'civic.archive/rootbloom-timeline' },
    ],
    job: { title: 'Recover Flowering District Census', corp: 'Ghostlily (anonymous)', pay: '₳ 1,200 — high risk' },
    repEffect: { shadow: +1, compliance: -1 },
  },

  'civic.archive/rootbloom-timeline': {
    site: 'Civic Archive Mirror',
    title: 'ROOT BLOOM // Incident Timeline',
    subtitle: 'recovered from distributed mirror — last synced 19 months ago',
    theme: 'hidden',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'This mirror requires a trusted underground contact to vouch for you. Raise your Shadow score.',
    body: [
      'Month 1: GridOS begins purchasing civic infrastructure providers across three districts.',
      'Month 4: Public archive write access quietly transferred to GridOS internal systems team.',
      'Month 7: First documented ROOT BLOOM event. 44 citizen profiles altered retroactively.',
      'Month 11: mara.sol begins distributing copies of this document. Courier network active.',
      'Month 14: Archive mirrors begin disappearing. This copy is one of six remaining.',
    ],
    links: [
      { label: 'Back to Flowering',    url: 'civic.archive/flowering' },
      { label: 'Protected records',    url: 'civic.archive/protected' },
    ],
    repEffect: { shadow: +2, compliance: -2 },
  },

  'civic.archive/protected': {
    site: 'Civic Archive Mirror',
    title: 'Protected Records // lena.arc collection',
    subtitle: 'access granted by a contact you chose to protect',
    theme: 'hidden',
    gate: { type: 'unlocked', key: 'lena_arc_protected' },
    gateHint: 'This page is not publicly indexed. Someone who trusts you would have to send you here.',
    body: [
      'The following 42 names were removed from public record between Month 7 and Month 14.',
      'All were marked as "voluntary departure" in GridOS public logs.',
      'lena.arc\'s note: "None of them left voluntarily. I knew three of them."',
      'Attached: the original census fragment, before overwrite. The memory is intact here.',
    ],
    links: [
      { label: 'ROOT BLOOM Timeline', url: 'civic.archive/rootbloom-timeline' },
      { label: 'Return to Flowering', url: 'civic.archive/flowering' },
    ],
    job: { title: 'Distribute Protected Records', corp: 'Archivist Guild', pay: '₳ 2,000 — critical risk' },
    repEffect: { shadow: +3, compliance: -3 },
  },

  // ─ VoidBay ───────────────────────────────────────────────────────────────────────
  'voidbay.net': {
    site: 'VoidBay',
    title: 'VoidBay // Grey Market Exchange',
    subtitle: 'anonymous. unlogged. no loyalty scoring.',
    theme: 'hidden',
    gate: { type: 'shadow', min: 30 },
    gateHint: 'VoidBay does not accept new visitors without a referral. Establish yourself on the underground first.',
    body: [
      'Tools, credentials, data fragments, scripts, and contraband — all priced by supply and risk.',
      'All transactions use ₳ (credits). No identity attached.',
      'The site has been 404 on GridOS routing tables since 2029. It is still here.',
    ],
    links: [
      { label: 'Browse listings',      url: 'voidbay.net/listings' },
      { label: 'Anonymous drops',      url: 'voidbay.net/anon-drops' },
    ],
    repEffect: { shadow: +1, compliance: -2 },
  },

  'voidbay.net/listings': {
    site: 'VoidBay',
    title: 'Current Listings',
    subtitle: 'updated every cycle. prices fluctuate.',
    theme: 'hidden',
    gate: { type: 'shadow', min: 30 },
    gateHint: 'Listings are visible to established underground contacts only.',
    body: [
      '[ ₳ 340 ] Spoofed GridOS citizen token — single-use. Bypasses one compliance check.',
      '[ ₳ 800 ] Archivist mirror key — grants read access to one protected civic.archive path.',
      '[ ₳ 1,500 ] Compliance analyst credential pack — appears as Trusted on gridos.corp/internal.',
      '[ ₳ 2,200 ] ROOT BLOOM suppressor script — delays one personal flag by 72 hours.',
    ],
    links: [
      { label: 'VoidBay Home',      url: 'voidbay.net' },
      { label: 'Anonymous drops',   url: 'voidbay.net/anon-drops' },
    ],
    job: { title: 'Source Suppressor Script Components', corp: 'Anonymous', pay: '₳ 1,100 / run' },
    repEffect: { shadow: +1, compliance: -2 },
  },

  'voidbay.net/anon-drops': {
    site: 'VoidBay',
    title: 'Anonymous Drops',
    subtitle: 'dead drops. one-time reads.',
    theme: 'hidden',
    gate: { type: 'shadow', min: 40 },
    gateHint: 'Anonymous drops are only visible to known underground operators.',
    body: [
      'DROP #441: "GridOS internal memo re: ROOT BLOOM reclassification. Expires in 2 cycles."',
      'DROP #442: "Partial list of Watch analysts currently active. 14 handles."',
      'DROP #443: "New civic archive mirror address. Not civic.archive. Different domain entirely."',
    ],
    links: [
      { label: 'VoidBay Listings',  url: 'voidbay.net/listings' },
      { label: 'VoidBay Home',      url: 'voidbay.net' },
    ],
    repEffect: { shadow: +2, compliance: -3 },
  },

  // ─ null.54 ───────────────────────────────────────────────────────────────────────
  'void.null/54': {
    site: 'void.null',
    title: '// we saw you',
    subtitle: 'you escalated a ghost',
    theme: 'void',
    gate: { type: 'unlocked', key: 'null54_escalated' },
    gateHint: 'This address does not exist on any public routing table.',
    body: [
      'null.54 was not a citizen.',
      'null.54 was a mirror of you — your browsing pattern, your decisions, your timing, fed back.',
      'The escalation you submitted closed a case that was already closed.',
      'We wanted to know if you would do it. Now we know.',
      '// end of file',
    ],
    links: [
      { label: 'Return to start',   url: 'gridos.corp' },
    ],
    repEffect: { shadow: -5, compliance: -5 },
  },
}

// ── theme map ──────────────────────────────────────────────────────────────────────
const THEME_STYLES = {
  corp:   { header: '#00e5ff', badgeBg: 'rgba(0,229,255,0.12)',   badgeBorder: 'rgba(0,229,255,0.35)' },
  news:   { header: '#ffd166', badgeBg: 'rgba(255,209,102,0.12)', badgeBorder: 'rgba(255,209,102,0.35)' },
  forum:  { header: '#7bd389', badgeBg: 'rgba(123,211,137,0.12)', badgeBorder: 'rgba(123,211,137,0.35)' },
  blog:   { header: '#d6a2ff', badgeBg: 'rgba(214,162,255,0.12)', badgeBorder: 'rgba(214,162,255,0.35)' },
  hidden: { header: '#ff6b6b', badgeBg: 'rgba(255,107,107,0.12)', badgeBorder: 'rgba(255,107,107,0.35)' },
  void:   { header: '#888899', badgeBg: 'rgba(136,136,153,0.08)', badgeBorder: 'rgba(136,136,153,0.25)' },
}

const DEFAULT_URL = 'gridos.corp'

// ── component ─────────────────────────────────────────────────────────────────────────
export default function GridBrowser() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL)
  const [input,      setInput]      = useState(DEFAULT_URL)
  const [history,    setHistory]    = useState<string[]>([DEFAULT_URL])
  const [histIndex,  setHistIndex]  = useState(0)
  const [toast,      setToast]      = useState<string | null>(null)
  const [unlocks,    setUnlocks]    = useState<Set<string>>(new Set())

  const compliance   = useRepStore(s => s.compliance)
  const shadow       = useRepStore(s => s.shadow)
  const applyEvent   = useRepStore(s => s.applyEvent)

  const page = PAGES[currentUrl] ?? null

  const gateBlocked = useMemo(() => {
    if (!page?.gate) return false
    const g = page.gate
    if (g.type === 'compliance') return compliance < g.min
    if (g.type === 'shadow')     return shadow < g.min
    if (g.type === 'unlocked')   return !unlocks.has(g.key)
    return false
  }, [page, compliance, shadow, unlocks])

  const theme = useMemo(() => {
    if (!page) return THEME_STYLES.corp
    return THEME_STYLES[page.theme ?? 'corp']
  }, [page])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function unlock(key: string) {
    setUnlocks(prev => new Set([...prev, key]))
  }

  function goTo(url: string) {
    const normalized = url.trim().toLowerCase()
    if (!normalized) return

    setCurrentUrl(normalized)
    setInput(normalized)
    setHistory(prev => { const n = prev.slice(0, histIndex + 1); n.push(normalized); return n })
    setHistIndex(i => i + 1)

    const target = PAGES[normalized]
    if (!target) return

    const g = target.gate
    const blocked =
      g && (
        (g.type === 'compliance' && compliance < g.min) ||
        (g.type === 'shadow'     && shadow < g.min)     ||
        (g.type === 'unlocked'   && !unlocks.has(g.key))
      )

    if (!blocked) {
      if (target.repEffect) applyEvent(target.repEffect)
      if (target.unlocks) unlock(target.unlocks)
      if (target.job) {
        addJob({ ...target.job, source: normalized })
        showToast(`New job posted to Job Board: "${target.job.title}"`)
      }
    }
  }

  function goBack() {
    if (histIndex <= 0) return
    const ni = histIndex - 1
    setHistIndex(ni); setCurrentUrl(history[ni]); setInput(history[ni])
  }

  function goForward() {
    if (histIndex >= history.length - 1) return
    const ni = histIndex + 1
    setHistIndex(ni); setCurrentUrl(history[ni]); setInput(history[ni])
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      background: '#090b12', color: '#c8c8d8', fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative' }}>

      {/* Chrome */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
        borderBottom: '1px solid #222634', background: '#0f1320', flexShrink: 0 }}>
        <button onClick={goBack}                  style={navBtn(histIndex > 0)}>←</button>
        <button onClick={goForward}               style={navBtn(histIndex < history.length - 1)}>→</button>
        <button onClick={() => goTo(DEFAULT_URL)} style={navBtn(true)}>⌂</button>

        <form onSubmit={e => { e.preventDefault(); goTo(input) }} style={{ flex: 1 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
            style={{ width: '100%', background: '#0a0d16', color: '#d8deea',
              border: '1px solid #283042', borderRadius: 6, padding: '9px 12px',
              outline: 'none', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </form>
      </div>

      {/* Page */}
      <div style={{ padding: 18, overflow: 'auto', flex: 1,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 220px)' }}>
        {!page
          ? <MissingPage currentUrl={currentUrl} onHome={() => goTo(DEFAULT_URL)} />
          : gateBlocked
            ? <GatedPage hint={page.gateHint} gate={page.gate!} compliance={compliance} shadow={shadow} onHome={() => goTo(DEFAULT_URL)} />
            : <PageView page={page} theme={theme} onNavigate={goTo} />
        }
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#0d111a', border: '1px solid #7bd38966', color: '#7bd389',
          padding: '10px 18px', borderRadius: 8, fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px #00000088', pointerEvents: 'none' }}>
          ❆ {toast}
        </div>
      )}
    </div>
  )
}

// ── PageView ───────────────────────────────────────────────────────────────────────────
function PageView({ page, theme, onNavigate }:
  { page: PageData; theme: typeof THEME_STYLES.corp; onNavigate: (url: string) => void }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 10px', borderRadius: 999,
        border: `1px solid ${theme.badgeBorder}`, background: theme.badgeBg,
        color: theme.header, fontSize: 12, marginBottom: 14,
        fontFamily: "'JetBrains Mono', monospace" }}>
        {page.site}
      </div>

      <h1 style={{ fontSize: 30, lineHeight: 1.1, marginBottom: 8, color: '#eef3ff' }}>
        {page.title}
      </h1>

      {page.subtitle && (
        <p style={{ fontSize: 15, color: '#96a1b5', marginBottom: 22, maxWidth: 680 }}>
          {page.subtitle}
        </p>
      )}

      <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
        {page.body.map((para, i) => (
          <div key={i} style={{ background: '#0d111a', border: '1px solid #202636',
            borderRadius: 10, padding: 14, color: '#cfd6e4', lineHeight: 1.6, fontSize: 14 }}>
            {para}
          </div>
        ))}
      </div>

      {page.job && (
        <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10,
          border: `1px solid ${theme.header}44`, background: `${theme.header}0d` }}>
          <span style={{ fontSize: 11, color: theme.header,
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
            ❆ JOB AVAILABLE — {page.job.title} · {page.job.corp} · {page.job.pay}
          </span>
        </div>
      )}

      {page.repEffect && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace" }}>
          {page.repEffect.compliance !== undefined && (
            <span style={{ color: page.repEffect.compliance >= 0 ? '#00e5ff' : '#ff3b5c' }}>
              GRID {page.repEffect.compliance > 0 ? '+' : ''}{page.repEffect.compliance}
            </span>
          )}
          {page.repEffect.shadow !== undefined && (
            <span style={{ color: page.repEffect.shadow >= 0 ? '#d6a2ff' : '#ff3b5c' }}>
              SHADOW {page.repEffect.shadow > 0 ? '+' : ''}{page.repEffect.shadow}
            </span>
          )}
        </div>
      )}

      <div style={{ borderTop: '1px solid #232938', paddingTop: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: theme.header, marginBottom: 10,
          fontFamily: "'JetBrains Mono', monospace" }}>
          Linked pages
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {page.links.map(link => (
            <button key={link.url} onClick={() => onNavigate(link.url)}
              style={linkBtn(theme.header)}>
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── GatedPage ──────────────────────────────────────────────────────────────────────────
function GatedPage({ hint, gate, compliance, shadow, onHome }:{
  hint?: string; gate: AccessGate; compliance: number; shadow: number; onHome: () => void
}) {
  const isUnlockGate = gate.type === 'unlocked'
  const statusColor  = isUnlockGate ? '#6b6b80' : '#ff6b6b'

  return (
    <div style={{ minHeight: 260, display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'center',
      background: '#0d111a', border: '1px solid #202636', borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 28, color: statusColor, marginBottom: 8, fontFamily: "'JetBrains Mono',monospace" }}>
        {isUnlockGate ? '// ACCESS DENIED' : '403'}
      </div>
      <div style={{ fontSize: 16, marginBottom: 8, color: '#c8c8d8' }}>Restricted access</div>
      <div style={{ color: '#8892a6', marginBottom: 18, maxWidth: 520, lineHeight: 1.6, fontSize: 14 }}>
        {hint ?? 'You do not have permission to view this page.'}
      </div>

      {gate.type === 'compliance' && (
        <div style={{ marginBottom: 16, fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
          color: '#6b6b80' }}>
          Your GRID score: <span style={{ color: '#00e5ff' }}>{compliance}</span>
          &nbsp;/ required: <span style={{ color: '#ff6b6b' }}>{gate.min}</span>
        </div>
      )}
      {gate.type === 'shadow' && (
        <div style={{ marginBottom: 16, fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
          color: '#6b6b80' }}>
          Your SHADOW score: <span style={{ color: '#d6a2ff' }}>{shadow}</span>
          &nbsp;/ required: <span style={{ color: '#ff6b6b' }}>{gate.min}</span>
        </div>
      )}

      <button onClick={onHome} style={linkBtn('#6b6b80')}>Return to GridOS home</button>
    </div>
  )
}

// ── MissingPage ────────────────────────────────────────────────────────────────────────────
function MissingPage({ currentUrl, onHome }: { currentUrl: string; onHome: () => void }) {
  return (
    <div style={{ minHeight: 260, display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'center',
      background: '#0d111a', border: '1px solid #202636', borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 28, color: '#ff6b6b', marginBottom: 8 }}>404</div>
      <div style={{ fontSize: 18, marginBottom: 6 }}>Page not found</div>
      <div style={{ color: '#8892a6', marginBottom: 14 }}>
        No public route exists for <code>{currentUrl}</code>
      </div>
      <button onClick={onHome} style={linkBtn('#00e5ff')}>Return to GridOS home</button>
    </div>
  )
}

// ── helpers ─────────────────────────────────────────────────────────────────────────────
function navBtn(enabled: boolean): React.CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 6,
    border: '1px solid #283042',
    background: enabled ? '#121827' : '#0d121d',
    color: enabled ? '#d7e0ef' : '#566074',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 14,
  }
}

function linkBtn(color: string): React.CSSProperties {
  return {
    padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${color}44`,
    background: `${color}12`,
    color, cursor: 'pointer', fontSize: 13,
  }
}

export {}
