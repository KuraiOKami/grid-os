import { useMemo, useState } from 'react'
import { addJob } from '@/store/jobStore'
import { useRepStore } from '@/store/reputationStore'

// ── types ────────────────────────────────────────────────────────────────
type LinkItem = { label: string; url: string }
type JobOffer = { title: string; corp: string; pay: string }

type AccessGate =
  | { type: 'compliance'; min: number }
  | { type: 'shadow';     min: number }
  | { type: 'unlocked';   key: string }

type PageData = {
  site: string
  title: string
  subtitle?: string
  theme?: 'corp' | 'news' | 'forum' | 'blog' | 'hidden' | 'void'
  body: string[]
  links: LinkItem[]
  job?: JobOffer
  gate?: AccessGate
  gateHint?: string
  unlocks?: string
  repEffect?: { compliance?: number; shadow?: number }
}

// ── page registry ────────────────────────────────────────────────────────
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
      { label: 'Trust & Safety',     url: 'gridos.corp/trust' },
      { label: 'Careers',            url: 'gridos.corp/careers' },
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
      { label: 'Return to Home',          url: 'gridos.corp' },
      { label: 'Read Trust & Safety',     url: 'gridos.corp/trust' },
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
      { label: 'Compliance Queue', url: 'gridos.corp/compliance' },
      { label: 'Return to Home',   url: 'gridos.corp' },
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
      { label: 'Internal Portal', url: 'gridos.corp/internal' },
      { label: 'Return to Home',  url: 'gridos.corp' },
    ],
    job: { title: 'Compliance Queue Auditor', corp: 'GridOS', pay: '₳ 600 / session' },
    repEffect: { compliance: +3, shadow: -2 },
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
      { label: 'Local outages spread',             url: 'pulse.news/outages' },
      { label: 'Open Ghostlily blog',              url: 'ghostlily.blog' },
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
      { label: 'Back to Pulse',      url: 'pulse.news' },
      { label: 'Open Civic Archive', url: 'civic.archive/flowering' },
    ],
    repEffect: { shadow: +1, compliance: -1 },
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
      { label: 'Entry: ROOT BLOOM',             url: 'ghostlily.blog/root-bloom' },
      { label: 'Entry: missing public records', url: 'ghostlily.blog/missing-records' },
      { label: 'Open YellowThread',             url: 'yellowthread.forum' },
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
      { label: 'Back to Blog',                url: 'ghostlily.blog' },
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
      { label: 'Back to Blog',                url: 'ghostlily.blog' },
      { label: 'Open civic.archive/flowering', url: 'civic.archive/flowering' },
    ],
    job: { title: 'Archive Integrity Check', corp: 'Unknown client', pay: '₳ 500 flat' },
    repEffect: { shadow: +1, compliance: -1 },
  },
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
      { label: 'Return to Ghostlily blog',    url: 'ghostlily.blog/missing-records' },
      { label: 'Corporate response',          url: 'gridos.corp/trust' },
      { label: 'Deeper archive (restricted)', url: 'civic.archive/rootbloom-timeline' },
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
      { label: 'Back to Flowering', url: 'civic.archive/flowering' },
      { label: 'Protected records', url: 'civic.archive/protected' },
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
      "lena.arc's note: \"None of them left voluntarily. I knew three of them.\"",
      'Attached: the original census fragment, before overwrite. The memory is intact here.',
    ],
    links: [
      { label: 'ROOT BLOOM Timeline', url: 'civic.archive/rootbloom-timeline' },
      { label: 'Return to Flowering', url: 'civic.archive/flowering' },
    ],
    job: { title: 'Distribute Protected Records', corp: 'Archivist Guild', pay: '₳ 2,000 — critical risk' },
    repEffect: { shadow: +3, compliance: -3 },
  },
  'voidbay.net': {
    site: 'VoidBay',
    title: 'VoidBay // Grey Market Exchange',
    subtitle: 'anonymous. unlogged. no loyalty scoring.',
    theme: 'void',
    gate: { type: 'shadow', min: 30 },
    gateHint: 'VoidBay does not accept new visitors without a referral. Establish yourself on the underground first.',
    body: [
      'Tools, credentials, data fragments, scripts, and contraband — all priced by supply and risk.',
      'All transactions use ₳ (credits). No identity attached.',
      'The site has been 404 on GridOS routing tables since 2029. It is still here.',
    ],
    links: [
      { label: 'Browse listings',  url: 'voidbay.net/listings' },
      { label: 'Anonymous drops',  url: 'voidbay.net/anon-drops' },
    ],
    repEffect: { shadow: +1, compliance: -2 },
  },
  'voidbay.net/listings': {
    site: 'VoidBay',
    title: 'Current Listings',
    subtitle: 'updated every cycle. prices fluctuate.',
    theme: 'void',
    gate: { type: 'shadow', min: 30 },
    gateHint: 'Listings are visible to established underground contacts only.',
    body: [
      '[ ₳ 340 ] Spoofed GridOS citizen token — single-use. Bypasses one compliance check.',
      '[ ₳ 800 ] Archivist mirror key — grants read access to one protected civic.archive path.',
      '[ ₳ 1,500 ] Compliance analyst credential pack — appears as Trusted on gridos.corp/internal.',
      '[ ₳ 2,200 ] ROOT BLOOM suppressor script — delays one personal flag by 72 hours.',
    ],
    links: [
      { label: 'VoidBay Home',     url: 'voidbay.net' },
      { label: 'Anonymous drops',  url: 'voidbay.net/anon-drops' },
    ],
    job: { title: 'Source Suppressor Script Components', corp: 'Anonymous', pay: '₳ 1,100 / run' },
    repEffect: { shadow: +1, compliance: -2 },
  },
  'voidbay.net/anon-drops': {
    site: 'VoidBay',
    title: 'Anonymous Drops',
    subtitle: 'dead drops. one-time reads.',
    theme: 'void',
    gate: { type: 'shadow', min: 40 },
    gateHint: 'Anonymous drops are only visible to known underground operators.',
    body: [
      'DROP #441: "GridOS internal memo re: ROOT BLOOM reclassification. Expires in 2 cycles."',
      'DROP #442: "Partial list of Watch analysts currently active. 14 handles."',
      'DROP #443: "New civic archive mirror address. Not civic.archive. Different domain entirely."',
    ],
    links: [
      { label: 'VoidBay Listings', url: 'voidbay.net/listings' },
      { label: 'VoidBay Home',     url: 'voidbay.net' },
    ],
    repEffect: { shadow: +2, compliance: -3 },
  },
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
      { label: 'Return to start', url: 'gridos.corp' },
    ],
    repEffect: { shadow: -5, compliance: -5 },
  },
}

const DEFAULT_URL = 'gridos.corp'

// ── component ─────────────────────────────────────────────────────────────────
export default function GridBrowser() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_URL)
  const [input,      setInput]      = useState(DEFAULT_URL)
  const [history,    setHistory]    = useState<string[]>([DEFAULT_URL])
  const [histIndex,  setHistIndex]  = useState(0)
  const [toast,      setToast]      = useState<string | null>(null)
  const [unlocks,    setUnlocks]    = useState<Set<string>>(new Set())

  const compliance = useRepStore(s => s.compliance)
  const shadow     = useRepStore(s => s.shadow)
  const applyEvent = useRepStore(s => s.applyEvent)

  const page = PAGES[currentUrl] ?? null

  const gateBlocked = useMemo(() => {
    if (!page?.gate) return false
    const g = page.gate
    if (g.type === 'compliance') return compliance < g.min
    if (g.type === 'shadow')     return shadow < g.min
    if (g.type === 'unlocked')   return !unlocks.has(g.key)
    return false
  }, [page, compliance, shadow, unlocks])

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
    const blocked = g && (
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

  // bg colour driven by theme
  const themeBg: Record<string, string> = {
    corp:   '#08090f',
    news:   '#0a0b0e',
    forum:  '#090c0a',
    blog:   '#0a0810',
    hidden: '#0b0a0a',
    void:   '#060608',
  }
  const pageBg = page ? (themeBg[page.theme ?? 'corp'] ?? '#090b12') : '#090b12'

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      background: pageBg, color:'#c8c8d8',
      fontFamily:'Inter, system-ui, sans-serif', position:'relative',
      transition:'background 0.3s ease' }}>

      {/* Chrome */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px',
        borderBottom:'1px solid #1e2230', background:'#0d1020', flexShrink:0 }}>
        <button onClick={goBack}    style={navBtn(histIndex > 0)}>←</button>
        <button onClick={goForward} style={navBtn(histIndex < history.length - 1)}>→</button>
        <button onClick={() => goTo(DEFAULT_URL)} style={navBtn(true)}>⌂</button>
        <form onSubmit={e => { e.preventDefault(); goTo(input) }} style={{ flex:1 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            spellCheck={false}
            style={{ width:'100%', background:'#090d18', color:'#d8deea',
              border:'1px solid #242b3d', borderRadius:6, padding:'8px 12px',
              outline:'none', fontSize:13,
              fontFamily:"'JetBrains Mono', monospace" }} />
        </form>
      </div>

      {/* Page */}
      <div style={{ flex:1, overflow:'auto' }}>
        {!page
          ? <MissingPage currentUrl={currentUrl} onHome={() => goTo(DEFAULT_URL)} />
          : gateBlocked
            ? <GatedPage hint={page.gateHint} gate={page.gate!}
                compliance={compliance} shadow={shadow}
                onHome={() => goTo(DEFAULT_URL)} />
            : <PageView page={page} onNavigate={goTo} />
        }
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'absolute', bottom:16, left:'50%',
          transform:'translateX(-50%)',
          background:'#0d111a', border:'1px solid #7bd38966', color:'#7bd389',
          padding:'10px 18px', borderRadius:8, fontSize:12,
          fontFamily:"'JetBrains Mono', monospace", whiteSpace:'nowrap',
          boxShadow:'0 4px 20px #00000088', pointerEvents:'none' }}>
          ❆ {toast}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE VIEW — routes to the correct layout by theme
// ─────────────────────────────────────────────────────────────────────────────
function PageView({ page, onNavigate }:
  { page: PageData; onNavigate: (url: string) => void }) {
  switch (page.theme) {
    case 'news':   return <NewsLayout   page={page} onNavigate={onNavigate} />
    case 'forum':  return <ForumLayout  page={page} onNavigate={onNavigate} />
    case 'blog':   return <BlogLayout   page={page} onNavigate={onNavigate} />
    case 'hidden': return <ArchiveLayout page={page} onNavigate={onNavigate} />
    case 'void':   return <VoidLayout   page={page} onNavigate={onNavigate} />
    default:       return <CorpLayout   page={page} onNavigate={onNavigate} />
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CORP LAYOUT — clean enterprise site (gridos.corp)
// ─────────────────────────────────────────────────────────────────────────────
function CorpLayout({ page, onNavigate }: { page:PageData; onNavigate:(u:string)=>void }) {
  const internal = page.site.includes('INTERNAL')
  const accent   = '#00e5ff'

  return (
    <div style={{ minHeight:'100%', background: internal ? '#080c10' : '#08090f' }}>
      {/* Top nav bar */}
      <div style={{ background: internal ? '#0a1018' : '#0c1016',
        borderBottom:`1px solid ${accent}22`, padding:'0 0' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 28px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          height:52 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:6,
              background: `linear-gradient(135deg, ${accent}, #0088cc)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:'bold', color:'#000', flexShrink:0 }}>G</div>
            <span style={{ fontSize:14, fontWeight:600, color:'#eef3ff',
              letterSpacing:'0.04em' }}>GridOS</span>
            {internal && (
              <span style={{ fontSize:10, color: accent, border:`1px solid ${accent}55`,
                borderRadius:4, padding:'2px 7px', letterSpacing:'0.08em',
                fontFamily:"'JetBrains Mono',monospace" }}>INTERNAL</span>
            )}
          </div>
          <div style={{ display:'flex', gap:20, fontSize:12, color:'#8899aa' }}>
            {page.links.slice(0,3).map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ background:'none', border:'none', color:'#8899aa',
                  cursor:'pointer', fontSize:12, padding:0,
                  transition:'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = accent)}
                onMouseLeave={e => (e.currentTarget.style.color = '#8899aa')}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: internal
          ? 'linear-gradient(180deg,#0a1018 0%,#080c10 100%)'
          : `linear-gradient(180deg,#0c1420 0%,#08090f 100%)`,
        borderBottom:`1px solid #1a2232`, padding:'52px 28px 44px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ fontSize:11, color:accent, letterSpacing:'0.14em',
            fontFamily:"'JetBrains Mono',monospace", marginBottom:14,
            textTransform:'uppercase' }}>{page.site}</div>
          <h1 style={{ fontSize:32, fontWeight:700, color:'#eef3ff',
            lineHeight:1.15, marginBottom:12, maxWidth:640 }}>{page.title}</h1>
          {page.subtitle && (
            <p style={{ fontSize:15, color:'#7a8faa', lineHeight:1.6, maxWidth:580,
              marginBottom:0 }}>{page.subtitle}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'36px 28px' }}>
        {/* Rep pill */}
        {page.repEffect && <RepBadge effect={page.repEffect} />}

        {/* Paragraphs as content cards */}
        <div style={{ display:'grid', gap:2, marginBottom:36 }}>
          {page.body.map((para, i) => (
            <div key={i} style={{
              padding:'18px 22px',
              background: i === 0 ? '#0e1520' : '#0b1018',
              borderLeft:`3px solid ${i === 0 ? accent : '#1e2a38'}`,
              borderRadius: i === 0 ? '8px 8px 0 0' : i === page.body.length-1 ? '0 0 8px 8px' : '0',
              fontSize:14, color:'#b8c8d8', lineHeight:1.7 }}>
              {para}
            </div>
          ))}
        </div>

        {/* Job banner */}
        {page.job && <JobBanner job={page.job} accent={accent} />}

        {/* Nav links */}
        <div style={{ marginTop:32, paddingTop:24,
          borderTop:'1px solid #1a2232' }}>
          <div style={{ fontSize:11, letterSpacing:'0.1em', color:'#4a5568',
            marginBottom:14, textTransform:'uppercase' }}>Pages</div>
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8 }}>
            {page.links.map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ padding:'11px 14px', background:'#0e1520',
                  border:'1px solid #1e2a38', borderRadius:8,
                  color:'#7aabcc', fontSize:12, cursor:'pointer',
                  textAlign:'left', fontFamily:'inherit',
                  transition:'all 0.15s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = accent+'55'
                  e.currentTarget.style.color = accent
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1e2a38'
                  e.currentTarget.style.color = '#7aabcc'
                }}>
                {l.label} →
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWS LAYOUT — feels like an online newspaper (pulse.news)
// ─────────────────────────────────────────────────────────────────────────────
function NewsLayout({ page, onNavigate }: { page:PageData; onNavigate:(u:string)=>void }) {
  const accent  = '#ffd166'
  const isHome  = !page.title.includes('//')
  // fake timestamp
  const times   = ['2 hrs ago','4 hrs ago','Yesterday','6 hrs ago','1 day ago']

  return (
    <div style={{ minHeight:'100%', background:'#0a0b0e', color:'#c8c8d8' }}>
      {/* Masthead */}
      <div style={{ background:'#0d0f14', borderBottom:`1px solid #1e2028`,
        padding:'0 28px' }}>
        <div style={{ maxWidth:880, margin:'0 auto', display:'flex',
          alignItems:'center', justifyContent:'space-between', height:56 }}>
          <div>
            <span style={{ fontSize:22, fontWeight:800, color:'#f0f0f0',
              letterSpacing:'-0.02em' }}>PULSE</span>
            <span style={{ fontSize:22, fontWeight:300, color:accent,
              marginLeft:4 }}>//</span>
          </div>
          <div style={{ fontSize:11, color:'#4a5060',
            fontFamily:"'JetBrains Mono',monospace" }}>
            SIGNAL · MARKETS · WEATHER · COMPLIANCE
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div style={{ background:'#0b0c10', borderBottom:'1px solid #16181e',
        padding:'0 28px' }}>
        <div style={{ maxWidth:880, margin:'0 auto', display:'flex',
          gap:24, height:38, alignItems:'center' }}>
          {['TOP STORIES','MARKETS','TECH','OUTAGES','OPINION'].map((cat, i) => (
            <span key={cat} style={{ fontSize:11, letterSpacing:'0.08em',
              color: i===0 ? accent : '#4a5060',
              borderBottom: i===0 ? `2px solid ${accent}` : '2px solid transparent',
              paddingBottom:2, cursor:'default' }}>{cat}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:880, margin:'0 auto', padding:'28px' }}>
        {page.repEffect && <RepBadge effect={page.repEffect} />}

        {/* Article header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, color:accent,
            fontFamily:"'JetBrains Mono',monospace",
            letterSpacing:'0.1em', marginBottom:10 }}>TOP STORY</div>
          <h1 style={{ fontSize:30, fontWeight:800, color:'#eef3ff',
            lineHeight:1.2, marginBottom:10, letterSpacing:'-0.01em' }}>
            {page.title}
          </h1>
          {page.subtitle && (
            <p style={{ fontSize:16, color:'#8898a8', lineHeight:1.5,
              marginBottom:14, borderLeft:`3px solid ${accent}`,
              paddingLeft:12, fontStyle:'italic' }}>
              {page.subtitle}
            </p>
          )}
          <div style={{ fontSize:12, color:'#4a5060',
            fontFamily:"'JetBrains Mono',monospace" }}>
            {times[0]} · Pulse Staff · {page.site}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop:`1px solid #1e2028`, marginBottom:28 }} />

        {/* Body as article paragraphs */}
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {page.body.map((para, i) => (
            <p key={i} style={{ fontSize:15, color: i===0 ? '#ccd8e4' : '#9aaabb',
              lineHeight:1.8, marginBottom:20, maxWidth:640 }}>
              {i === 0 && (
                <span style={{ float:'left', fontSize:52, fontWeight:800,
                  color:accent, lineHeight:0.85, marginRight:8,
                  marginTop:6, fontFamily:'Georgia,serif' }}>
                  {para[0]}
                </span>
              )}
              {i === 0 ? para.slice(1) : para}
            </p>
          ))}
        </div>

        {page.job && <JobBanner job={page.job} accent={accent} />}

        {/* Related articles */}
        <div style={{ marginTop:36, paddingTop:24,
          borderTop:'1px solid #1e2028' }}>
          <div style={{ fontSize:12, letterSpacing:'0.1em', color:'#4a5060',
            marginBottom:16 }}>RELATED STORIES</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {page.links.map((l, i) => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ display:'flex', alignItems:'center', gap:12,
                  padding:'12px 16px', background:'#0d0f14',
                  border:'1px solid #1a1e28', borderRadius:8,
                  cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                  transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = accent+'44'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1e28'}>
                <span style={{ fontSize:11, color:accent,
                  fontFamily:"'JetBrains Mono',monospace",
                  flexShrink:0 }}>{String(i+1).padStart(2,'0')}</span>
                <span style={{ fontSize:13, color:'#aabbc8' }}>{l.label}</span>
                <span style={{ marginLeft:'auto', fontSize:11,
                  color:'#3a4050' }}>{times[i] ?? '3 days ago'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORUM LAYOUT — feels like a real message board (yellowthread.forum)
// ─────────────────────────────────────────────────────────────────────────────
function ForumLayout({ page, onNavigate }: { page:PageData; onNavigate:(u:string)=>void }) {
  const accent   = '#7bd389'
  const isThread = page.title.toLowerCase().includes('thread')

  // Simulate post metadata
  const handles = ['relay_ghost','n0de-watcher','mara.sol','anon_proxy77','civic_mirror','lena.arc','greyhat_k']
  const randomHandle = (seed: number) => handles[seed % handles.length]

  return (
    <div style={{ minHeight:'100%', background:'#090c0a', color:'#c0ccc0' }}>
      {/* Forum header */}
      <div style={{ background:'#0c100c', borderBottom:'1px solid #1a2418',
        padding:'0 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex',
          alignItems:'center', justifyContent:'space-between', height:50 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:16, fontWeight:700, color:accent,
              fontFamily:"'JetBrains Mono',monospace" }}>YellowThread</span>
            <span style={{ fontSize:11, color:'#3a4a3a',
              fontFamily:"'JetBrains Mono',monospace" }}>// public index</span>
          </div>
          <div style={{ fontSize:11, color:'#3a4a3a',
            fontFamily:"'JetBrains Mono',monospace" }}>
            {Math.floor(Math.random()*900+200)} online · unmonitored*
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ background:'#0a0e0a', borderBottom:'1px solid #141a14',
        padding:'8px 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', fontSize:11,
          color:'#3a4a3a', fontFamily:"'JetBrains Mono',monospace" }}>
          <span style={{ color:accent, cursor:'pointer' }}
            onClick={() => onNavigate('yellowthread.forum')}>index</span>
          {' / '}
          <span style={{ color:'#6a7a68' }}>{page.site}</span>
          {isThread && <span style={{ color:'#4a5a48' }}>{' / thread'}</span>}
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'24px' }}>
        {/* Thread title */}
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:20, fontWeight:700, color:'#d8e8d0',
            lineHeight:1.3, marginBottom:6 }}>{page.title}</h1>
          {page.subtitle && (
            <div style={{ fontSize:12, color:'#4a5a48',
              fontFamily:"'JetBrains Mono',monospace" }}>{page.subtitle}</div>
          )}
        </div>

        {page.repEffect && <RepBadge effect={page.repEffect} />}

        {/* Posts */}
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {page.body.map((para, i) => (
            <div key={i} style={{ display:'flex', gap:12,
              padding:'14px 16px',
              background: i % 2 === 0 ? '#0c110c' : '#0a0e0a',
              borderRadius: i===0?'8px 8px 0 0':i===page.body.length-1?'0 0 8px 8px':'0',
              border:'1px solid #141e14',
              borderTop: i > 0 ? 'none' : '1px solid #141e14' }}>
              {/* Avatar */}
              <div style={{ flexShrink:0, display:'flex',
                flexDirection:'column', alignItems:'center', gap:4, width:56 }}>
                <div style={{ width:32, height:32, borderRadius:'50%',
                  background:`hsl(${(i*77)%360},30%,18%)`,
                  border:`1px solid hsl(${(i*77)%360},40%,28%)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, color:`hsl(${(i*77)%360},60%,60%)` }}>
                  {randomHandle(i)[0].toUpperCase()}
                </div>
                <span style={{ fontSize:9, color:'#3a4a3a',
                  fontFamily:"'JetBrains Mono',monospace",
                  textAlign:'center', wordBreak:'break-all' }}>
                  {randomHandle(i)}
                </span>
              </div>
              {/* Content */}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'#3a4a3a',
                  fontFamily:"'JetBrains Mono',monospace",
                  marginBottom:6 }}>#{i+1} · just now</div>
                <div style={{ fontSize:13, color:'#b0c0b0',
                  lineHeight:1.65 }}>{para}</div>
              </div>
            </div>
          ))}
        </div>

        {page.job && <JobBanner job={page.job} accent={accent} />}

        {/* Nav */}
        <div style={{ marginTop:28, paddingTop:20,
          borderTop:'1px solid #141e14' }}>
          <div style={{ fontSize:10, color:'#3a4a3a', letterSpacing:'0.1em',
            marginBottom:12 }}>LINKED THREADS / PAGES</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {page.links.map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ padding:'10px 14px', background:'#0c110c',
                  border:'1px solid #1a2418', borderRadius:6,
                  color:'#6a9a78', fontSize:12, cursor:'pointer',
                  textAlign:'left', fontFamily:'inherit',
                  transition:'all 0.15s', display:'flex',
                  alignItems:'center', gap:8 }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = accent+'66'
                  e.currentTarget.style.color = accent
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1a2418'
                  e.currentTarget.style.color = '#6a9a78'
                }}>
                <span style={{ color:'#3a5038',
                  fontFamily:"'JetBrains Mono',monospace" }}>›</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOG LAYOUT — personal / intimate writing (ghostlily.blog)
// ─────────────────────────────────────────────────────────────────────────────
function BlogLayout({ page, onNavigate }: { page:PageData; onNavigate:(u:string)=>void }) {
  const accent = '#d6a2ff'

  return (
    <div style={{ minHeight:'100%', background:'#0a0810', color:'#c8b8dc' }}>
      {/* Header */}
      <div style={{ borderBottom:'1px solid #1e1428', padding:'0 32px' }}>
        <div style={{ maxWidth:700, margin:'0 auto', display:'flex',
          alignItems:'center', justifyContent:'space-between', height:52 }}>
          <span style={{ fontSize:15, color:accent,
            fontFamily:'Georgia,serif', fontStyle:'italic' }}>ghostlily</span>
          <span style={{ fontSize:11, color:'#5a4a6a',
            fontFamily:"'JetBrains Mono',monospace" }}>notes from the soft edge</span>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'44px 32px' }}>
        {page.repEffect && <RepBadge effect={page.repEffect} />}

        {/* Post header */}
        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:28, fontWeight:700, color:'#e8d8f8',
            lineHeight:1.2, marginBottom:12,
            fontFamily:'Georgia,serif' }}>{page.title}</h1>
          {page.subtitle && (
            <p style={{ fontSize:14, color:'#7a6888', fontStyle:'italic',
              marginBottom:16, lineHeight:1.6 }}>{page.subtitle}</p>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:24, height:24, borderRadius:'50%',
              background:'linear-gradient(135deg,#d6a2ff44,#7050a044)',
              border:'1px solid #5a3a7844' }} />
            <span style={{ fontSize:12, color:'#5a4a6a',
              fontFamily:"'JetBrains Mono',monospace" }}>ghostlily · personal</span>
          </div>
        </div>

        {/* Rule */}
        <div style={{ borderTop:`1px solid ${accent}22`, marginBottom:36 }} />

        {/* Body as prose */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {page.body.map((para, i) => (
            <p key={i} style={{
              fontSize: i===0 ? 16 : 15,
              color: i===0 ? '#c8b8dc' : '#9a8aac',
              lineHeight:1.85,
              fontFamily: 'Georgia,serif',
              borderLeft: i===0 ? `2px solid ${accent}66` : 'none',
              paddingLeft: i===0 ? 16 : 0,
              margin:0 }}>
              {para}
            </p>
          ))}
        </div>

        {page.job && <JobBanner job={page.job} accent={accent} />}

        {/* Links as reading suggestions */}
        <div style={{ marginTop:48, paddingTop:28,
          borderTop:`1px solid ${accent}22` }}>
          <div style={{ fontSize:11, color:'#5a4a6a', letterSpacing:'0.1em',
            marginBottom:16, textTransform:'uppercase' }}>Read also</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {page.links.map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ display:'flex', alignItems:'center', gap:10,
                  padding:'10px 0', background:'none', border:'none',
                  borderBottom:`1px solid ${accent}18`,
                  cursor:'pointer', textAlign:'left', fontFamily:'Georgia,serif',
                  transition:'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.paddingLeft = '8px')}
                onMouseLeave={e => (e.currentTarget.style.paddingLeft = '0')}>
                <span style={{ fontSize:12, color:accent, flexShrink:0 }}>↗</span>
                <span style={{ fontSize:13, color:'#9a7ab8',
                  fontStyle:'italic' }}>{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVE LAYOUT — degraded civic / recovered mirror (civic.archive)
// ─────────────────────────────────────────────────────────────────────────────
function ArchiveLayout({ page, onNavigate }: { page:PageData; onNavigate:(u:string)=>void }) {
  const accent = '#ff8f6b'

  return (
    <div style={{ minHeight:'100%', background:'#0b0a0a', color:'#c8b8a8' }}>
      {/* Degraded header bar */}
      <div style={{ background:'#100e0c', borderBottom:`1px solid ${accent}22`,
        padding:'0 24px' }}>
        <div style={{ maxWidth:820, margin:'0 auto', display:'flex',
          alignItems:'center', justifyContent:'space-between', height:48 }}>
          <span style={{ fontSize:13, color:`${accent}88`,
            fontFamily:"'JetBrains Mono',monospace",
            letterSpacing:'0.1em' }}>CIVIC.ARCHIVE</span>
          <span style={{ fontSize:10, color:'#4a3a2a',
            fontFamily:"'JetBrains Mono',monospace" }}>mirror v2 · integrity: PARTIAL</span>
        </div>
      </div>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'32px 24px' }}>
        {/* Warning banner */}
        <div style={{ background:`${accent}08`,
          border:`1px solid ${accent}33`, borderRadius:8,
          padding:'12px 16px', marginBottom:28,
          fontFamily:"'JetBrains Mono',monospace",
          fontSize:11, color:`${accent}99`, lineHeight:1.7 }}>
          ⚠ MIRROR WARNING: This document was recovered from a distributed archive node.
          Some fields may be incomplete, overwritten, or intentionally redacted.
          Cross-reference with other sources before acting on this information.
        </div>

        {page.repEffect && <RepBadge effect={page.repEffect} />}

        {/* Document header */}
        <div style={{ marginBottom:28, borderLeft:`3px solid ${accent}66`,
          paddingLeft:16 }}>
          <div style={{ fontSize:10, color:`${accent}66`, letterSpacing:'0.12em',
            fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>
            RECOVERED DOCUMENT · {page.site.toUpperCase()}
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#e8d8c8',
            lineHeight:1.25, marginBottom:8,
            fontFamily:"'JetBrains Mono',monospace" }}>{page.title}</h1>
          {page.subtitle && (
            <div style={{ fontSize:12, color:'#6a5848',
              fontFamily:"'JetBrains Mono',monospace" }}>
              {page.subtitle}
            </div>
          )}
        </div>

        {/* Body as document records */}
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {page.body.map((para, i) => (
            <div key={i} style={{
              padding:'14px 18px',
              background: '#0e0c0a',
              borderLeft:`2px solid ${i===0 ? accent+'88' : '#2a2018'}`,
              borderBottom: i < page.body.length-1 ? '1px dashed #1e1810' : 'none',
              fontSize:13, color: i===0 ? '#c8b8a8' : '#8a7868',
              lineHeight:1.7,
              fontFamily:"'JetBrains Mono',monospace" }}>
              <span style={{ color:'#4a3828', marginRight:10 }}>
                [{String(i).padStart(2,'0')}]
              </span>
              {para}
            </div>
          ))}
        </div>

        {page.job && <JobBanner job={page.job} accent={accent} />}

        {/* Nav */}
        <div style={{ marginTop:32, paddingTop:20,
          borderTop:`1px dashed ${accent}22` }}>
          <div style={{ fontSize:10, color:'#4a3828', letterSpacing:'0.1em',
            fontFamily:"'JetBrains Mono',monospace",
            marginBottom:12 }}>CROSS-REFERENCES</div>
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
            {page.links.map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ padding:'10px 12px',
                  background:'#100e0c', border:`1px solid ${accent}22`,
                  borderRadius:6, color:`${accent}88`, fontSize:11,
                  cursor:'pointer', textAlign:'left',
                  fontFamily:"'JetBrains Mono',monospace",
                  transition:'all 0.15s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = accent+'66'
                  e.currentTarget.style.color = accent
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = accent+'22'
                  e.currentTarget.style.color = `${accent}88`
                }}>
                ↗ {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VOID LAYOUT — dark web / underground market (voidbay.net, void.null)
// ─────────────────────────────────────────────────────────────────────────────
function VoidLayout({ page, onNavigate }: { page:PageData; onNavigate:(u:string)=>void }) {
  const accent   = '#c084fc'
  const isNull   = page.site.includes('void.null')

  return (
    <div style={{ minHeight:'100%',
      background: isNull ? '#050506' : '#060608', color:'#b8a8c8' }}>

      {isNull ? (
        // void.null — ultra minimal, eerie
        <div style={{ maxWidth:580, margin:'80px auto', padding:'0 32px',
          fontFamily:"'JetBrains Mono',monospace" }}>
          <div style={{ fontSize:10, color:'#3a2a4a', marginBottom:40,
            letterSpacing:'0.2em' }}>VOID.NULL // SECTOR 54</div>
          <h1 style={{ fontSize:18, color:'#6a4a8a', marginBottom:32,
            lineHeight:1.4, fontWeight:400 }}>{page.title}</h1>
          {page.body.map((para, i) => (
            <p key={i} style={{ fontSize:13, color: i===page.body.length-1
              ? '#3a2a4a' : '#7a5a9a', lineHeight:2, marginBottom:16 }}>{para}</p>
          ))}
          <div style={{ marginTop:48 }}>
            {page.links.map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ display:'block', background:'none', border:'none',
                  color:'#4a3a5a', fontSize:11, cursor:'pointer',
                  fontFamily:'inherit', padding:'4px 0',
                  transition:'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = accent)}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a3a5a')}>
                // {l.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // VoidBay — dark market UI
        <div style={{ minHeight:'100%' }}>
          {/* Header */}
          <div style={{ background:'#08070c',
            borderBottom:`1px solid ${accent}22`, padding:'0 24px' }}>
            <div style={{ maxWidth:840, margin:'0 auto', display:'flex',
              alignItems:'center', justifyContent:'space-between', height:50 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16, fontWeight:700, color:accent,
                  fontFamily:"'JetBrains Mono',monospace",
                  letterSpacing:'-0.02em' }}>VOIDBAY</span>
                <span style={{ fontSize:10, color:'#3a2a4a',
                  fontFamily:"'JetBrains Mono',monospace" }}>
                  // grey market exchange
                </span>
              </div>
              <div style={{ fontSize:10, color:'#3a2a4a',
                fontFamily:"'JetBrains Mono',monospace" }}>
                UNLOGGED · ANONYMOUS · ₳ ONLY
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{ background:'#07060b',
            borderBottom:`1px solid ${accent}18`, padding:'0 24px' }}>
            <div style={{ maxWidth:840, margin:'0 auto',
              display:'flex', gap:0, height:36, alignItems:'flex-end' }}>
              {['LISTINGS','DROPS','ABOUT'].map((t,i) => (
                <span key={t} style={{ fontSize:10, letterSpacing:'0.1em',
                  color: i===0 ? accent : '#4a3a5a',
                  borderBottom: i===0 ? `2px solid ${accent}` : '2px solid transparent',
                  padding:'0 14px 8px', cursor:'default' }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ maxWidth:840, margin:'0 auto', padding:'28px 24px' }}>
            {page.repEffect && <RepBadge effect={page.repEffect} />}

            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:18, fontWeight:600, color:'#d0b8e8',
                fontFamily:"'JetBrains Mono',monospace",
                marginBottom:4 }}>{page.title}</h1>
              {page.subtitle && (
                <div style={{ fontSize:11, color:'#4a3a5a',
                  fontFamily:"'JetBrains Mono',monospace" }}>{page.subtitle}</div>
              )}
            </div>

            {/* Listings */}
            <div style={{ display:'flex', flexDirection:'column', gap:8,
              marginBottom:28 }}>
              {page.body.map((item, i) => (
                <div key={i} style={{ padding:'14px 16px',
                  background:'#0a080e',
                  border:`1px solid ${accent}${i===0?'44':'22'}`,
                  borderRadius:8 }}>
                  <div style={{ fontSize:12, color:'#b090d0',
                    fontFamily:"'JetBrains Mono',monospace",
                    lineHeight:1.65 }}>{item}</div>
                </div>
              ))}
            </div>

            {page.job && <JobBanner job={page.job} accent={accent} />}

            {/* Nav */}
            <div style={{ paddingTop:20, borderTop:`1px solid ${accent}18` }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {page.links.map(l => (
                  <button key={l.url} onClick={() => onNavigate(l.url)}
                    style={{ padding:'10px 14px',
                      background:`${accent}0a`,
                      border:`1px solid ${accent}33`, borderRadius:6,
                      color:`${accent}88`, fontSize:11, cursor:'pointer',
                      fontFamily:"'JetBrains Mono',monospace",
                      transition:'all 0.15s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = accent+'77'
                      e.currentTarget.style.color = accent
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = accent+'33'
                      e.currentTarget.style.color = `${accent}88`
                    }}>
                    {l.label} ↗
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function JobBanner({ job, accent }: { job:JobOffer; accent:string }) {
  return (
    <div style={{ margin:'24px 0', padding:'14px 18px',
      background:`${accent}0a`, border:`1px solid ${accent}44`,
      borderRadius:8, display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
      <div>
        <div style={{ fontSize:10, color:accent, letterSpacing:'0.1em',
          fontFamily:"'JetBrains Mono',monospace",
          marginBottom:4 }}>CONTRACT AVAILABLE</div>
        <div style={{ fontSize:13, color:'#eef3ff' }}>{job.title}</div>
        <div style={{ fontSize:11, color:'#8899aa', marginTop:2 }}>{job.corp}</div>
      </div>
      <div style={{ fontSize:15, fontWeight:600, color:accent,
        fontFamily:"'JetBrains Mono',monospace",
        whiteSpace:'nowrap' }}>{job.pay}</div>
    </div>
  )
}

function RepBadge({ effect }: { effect: NonNullable<PageData['repEffect']> }) {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:16,
      fontFamily:"'JetBrains Mono',monospace" }}>
      {effect.compliance !== undefined && (
        <span style={{ fontSize:10, letterSpacing:'0.08em',
          color: effect.compliance >= 0 ? '#00e5ff' : '#ff4466',
          border: `1px solid ${effect.compliance>=0?'#00e5ff44':'#ff446644'}`,
          borderRadius:999, padding:'3px 8px' }}>
          GRID {effect.compliance > 0 ? '+' : ''}{effect.compliance}
        </span>
      )}
      {effect.shadow !== undefined && (
        <span style={{ fontSize:10, letterSpacing:'0.08em',
          color: effect.shadow >= 0 ? '#d6a2ff' : '#ff4466',
          border: `1px solid ${effect.shadow>=0?'#d6a2ff44':'#ff446644'}`,
          borderRadius:999, padding:'3px 8px' }}>
          SHADOW {effect.shadow > 0 ? '+' : ''}{effect.shadow}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GATED / MISSING
// ─────────────────────────────────────────────────────────────────────────────
function GatedPage({ hint, gate, compliance, shadow, onHome }: {
  hint?: string; gate: AccessGate;
  compliance: number; shadow: number;
  onHome: () => void
}) {
  const isUnlock = gate.type === 'unlocked'
  const color    = isUnlock ? '#6b6b80' : '#ff6b6b'
  return (
    <div style={{ maxWidth:600, margin:'60px auto', padding:'0 24px' }}>
      <div style={{ background:'#0d0f14', border:'1px solid #202636',
        borderRadius:12, padding:'32px' }}>
        <div style={{ fontSize:32, fontWeight:800, color,
          fontFamily:"'JetBrains Mono',monospace",
          marginBottom:12 }}>{isUnlock ? '// ACCESS DENIED' : '403'}</div>
        <div style={{ fontSize:16, color:'#c8c8d8', marginBottom:8 }}>Restricted access</div>
        <p style={{ color:'#8892a6', lineHeight:1.7, fontSize:14,
          marginBottom:20 }}>
          {hint ?? 'You do not have permission to view this page.'}
        </p>
        {gate.type === 'compliance' && (
          <div style={{ fontSize:12, color:'#6b6b80',
            fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
            Your GRID: <span style={{ color:'#00e5ff' }}>{compliance}</span>
            {' '}/ required: <span style={{ color:'#ff6b6b' }}>{gate.min}</span>
          </div>
        )}
        {gate.type === 'shadow' && (
          <div style={{ fontSize:12, color:'#6b6b80',
            fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
            Your SHADOW: <span style={{ color:'#d6a2ff' }}>{shadow}</span>
            {' '}/ required: <span style={{ color:'#ff6b6b' }}>{gate.min}</span>
          </div>
        )}
        <button onClick={onHome}
          style={{ padding:'10px 16px', background:'#161c28',
            border:'1px solid #2a3448', borderRadius:8,
            color:'#8892a6', fontSize:12, cursor:'pointer',
            fontFamily:'inherit' }}>
          ← Return to GridOS home
        </button>
      </div>
    </div>
  )
}

function MissingPage({ currentUrl, onHome }: { currentUrl:string; onHome:()=>void }) {
  return (
    <div style={{ maxWidth:600, margin:'60px auto', padding:'0 24px' }}>
      <div style={{ background:'#0d0f14', border:'1px solid #202636',
        borderRadius:12, padding:'32px' }}>
        <div style={{ fontSize:32, fontWeight:800, color:'#ff6b6b',
          fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>404</div>
        <div style={{ fontSize:16, color:'#c8c8d8', marginBottom:8 }}>Page not found</div>
        <p style={{ color:'#8892a6', marginBottom:20, fontSize:14 }}>
          No public route exists for <code style={{ color:'#c084fc' }}>{currentUrl}</code>
        </p>
        <button onClick={onHome}
          style={{ padding:'10px 16px', background:'#161c28',
            border:'1px solid #2a3448', borderRadius:8,
            color:'#8892a6', fontSize:12, cursor:'pointer',
            fontFamily:'inherit' }}>
          ← Return to GridOS home
        </button>
      </div>
    </div>
  )
}

function navBtn(enabled: boolean): React.CSSProperties {
  return {
    width:32, height:32, borderRadius:6,
    border:'1px solid #242b3d',
    background: enabled ? '#121827' : '#0d121d',
    color: enabled ? '#d7e0ef' : '#566074',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize:14,
  }
}

export {}
