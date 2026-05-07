import { useMemo, useState } from 'react'
import { addJob } from '@/store/jobStore'
import { useRepStore } from '@/store/reputationStore'
import { useSite } from '@/hooks/useSite'
import type { SiteRow, SiteContentRow, SiteTheme } from '@/lib/browserTypes'

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
  theme?: SiteTheme
  body: string[]
  links: LinkItem[]
  job?: JobOffer
  gate?: AccessGate
  gateHint?: string
  unlocks?: string
  repEffect?: { compliance?: number; shadow?: number }
}

// ── helpers: shape a SiteRow into PageData ───────────────────────────────
// This adapter lets the rest of the render logic stay identical whether the
// page came from Supabase or from the local PAGES fallback.
function siteRowToPageData(site: SiteRow): PageData {
  const content = site.content ?? []

  const bodyRows  = content.filter(c => c.kind === 'body').sort((a, b) => a.sort_order - b.sort_order)
  const linkRows  = content.filter(c => c.kind === 'link').sort((a, b) => a.sort_order - b.sort_order)
  const jobRow    = content.find(c => c.kind === 'job')

  let gate: AccessGate | undefined
  if (site.gate_type === 'compliance' && site.gate_min != null)
    gate = { type: 'compliance', min: site.gate_min }
  else if (site.gate_type === 'shadow' && site.gate_min != null)
    gate = { type: 'shadow', min: site.gate_min }
  else if (site.gate_type === 'unlocked' && site.gate_key)
    gate = { type: 'unlocked', key: site.gate_key }

  return {
    site:      site.site_name,
    title:     site.title,
    subtitle:  site.subtitle ?? undefined,
    theme:     site.theme,
    body:      bodyRows.map(r => r.body_text ?? ''),
    links:     linkRows.map(r => ({ label: r.link_label ?? '', url: r.link_url ?? '' })),
    job:       jobRow ? { title: jobRow.job_title!, corp: jobRow.job_corp!, pay: jobRow.job_pay! } : undefined,
    gate,
    gateHint:  site.gate_hint ?? undefined,
    repEffect: {
      compliance: site.rep_compliance || undefined,
      shadow:     site.rep_shadow     || undefined,
    },
  }
}

// ── page registry (local fallback for non-Supabase sites) ────────────────
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
      { label: 'Back to Blog',                 url: 'ghostlily.blog' },
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
  'gridnetnews.com': {
    site: 'GridNet News', title: 'GridNet News // Daily Record',
    subtitle: 'The official record of the Grid.',
    theme: 'news',
    body: [
      'GridOS compliance index reaches 94.2 — highest quarterly reading on record.',
      'Sector 7 maintenance window extended for a third consecutive week, citing subsystem dependencies.',
      'Former Gridcorp compliance employee reported missing. Federal case assigned.',
    ],
    links: [
      { label: 'Sector 7 maintenance extended',      url: 'gridnetnews.com/sector7-maintenance' },
      { label: 'GridMart expands same-day delivery',  url: 'gridnetnews.com/gridmart-expansion' },
      { label: 'Commune suspect arrested',            url: 'gridnetnews.com/commune-arrest' },
      { label: 'Record Q1 profits',                  url: 'gridnetnews.com/q1-profits' },
      { label: 'Archivist employee reported missing', url: 'gridnetnews.com/archivist-missing' },
      { label: 'GridSocial: 500 million accounts',   url: 'gridnetnews.com/gridsocial-500m' },
      { label: 'Splice forum taken offline',         url: 'gridnetnews.com/splice-dmca' },
      { label: 'Northern campus power irregularities',url: 'gridnetnews.com/northern-campus-power' },
      { label: 'GridOS 9.4 update rolls out',        url: 'gridnetnews.com/gridos-update-9-4' },
    ],
    repEffect: { compliance: +1 },
  },
  'gridsocial.net': {
    site: 'GridSocial', title: 'GridSocial // What\'s on the Grid',
    subtitle: '500 million connections. All activity reviewed for AUP compliance.',
    theme: 'corp',
    body: [
      'Your feed is personalised by the GridSocial algorithm. Post, share, and connect with verified accounts across the network.',
      'Notable accounts: @nexus_authority, @gridcorp_official, @pulse_news, @agent44_gc.',
      'Trending today: #Sector7, #ROOT_BLOOM, #GridOS94, #ComplianceIndex.',
    ],
    links: [
      { label: 'Profile: Elias Vorne (memorial)', url: 'gridsocial.net/profile/elias-vorne' },
      { label: 'Profile: Agent 44',               url: 'gridsocial.net/profile/agent44' },
      { label: 'Profile: Petra Kwan',             url: 'gridsocial.net/profile/petra-kwan' },
      { label: 'Profile: user_3g44x',             url: 'gridsocial.net/profile/mysterious-user' },
    ],
    repEffect: { compliance: +1 },
  },
  'noodlehut.blog': {
    site: 'noodlehut', title: 'noodlehut // notes on noodles',
    subtitle: 'seven posts. all noodles.',
    theme: 'blog',
    body: [
      'Writing about noodles because it\'s the one thing that stays the same wherever I go.',
      'Most recent: "The relay hub location closed. Their shoyu was the best in Sector 4. This is a loss."',
      'I am not affiliated with any grid provider. This blog is mine.',
    ],
    links: [
      { label: 'About this blog', url: 'noodlehut.blog/about' },
      { label: 'The cipher post', url: 'noodlehut.blog/cipher' },
    ],
  },
  'mtell.dev': {
    site: 'Marcus Tell', title: 'Marcus Tell // IT',
    subtitle: 'Eleven years at Gridcorp. I keep things running.',
    theme: 'blog',
    body: [
      'Projects: GridOS helpdesk ticketing integration (2054), node sanitation automation scripts (2056), internal patch scheduler (2057).',
      'I\'m not looking for new opportunities. This site is mostly for my own record-keeping.',
      'Last updated: 2056.',
    ],
    links: [{ label: 'Gridcorp Careers', url: 'gridos.corp/careers' }],
  },
  'gridmart.shop': {
    site: 'GridMart', title: 'GridMart // Frictionless Commerce',
    subtitle: 'All transactions logged. All deliveries tracked.',
    theme: 'corp',
    body: [
      'Categories: Home, Nutrition, Personal Tech, Infrastructure Supplements, Approved Media.',
      'Same-day delivery now available in 280 markets. Autonomous courier fleet active.',
      'All purchases require a GridOS account and are attributed to your identity profile.',
    ],
    links: [
      { label: 'Your cart',    url: 'gridmart.shop/cart' },
      { label: 'Order history', url: 'gridmart.shop/orders' },
    ],
    repEffect: { compliance: +1 },
  },
}

// ── theme colours ─────────────────────────────────────────────────────────
const THEME_STYLES: Record<SiteTheme, { bg: string; text: string; accent: string; border: string; tag: string }> = {
  corp:     { bg: 'bg-slate-950',  text: 'text-slate-100',  accent: 'text-blue-400',   border: 'border-blue-900/40',  tag: 'bg-blue-950 text-blue-300' },
  news:     { bg: 'bg-zinc-950',   text: 'text-zinc-100',   accent: 'text-amber-400',  border: 'border-amber-900/40', tag: 'bg-amber-950 text-amber-300' },
  forum:    { bg: 'bg-neutral-950',text: 'text-neutral-100',accent: 'text-yellow-400', border: 'border-yellow-900/30',tag: 'bg-yellow-950 text-yellow-300' },
  blog:     { bg: 'bg-stone-950',  text: 'text-stone-100',  accent: 'text-emerald-400',border: 'border-emerald-900/30',tag: 'bg-emerald-950 text-emerald-300' },
  hidden:   { bg: 'bg-zinc-950',   text: 'text-zinc-300',   accent: 'text-cyan-400',   border: 'border-cyan-900/30',  tag: 'bg-cyan-950 text-cyan-300' },
  void:     { bg: 'bg-black',      text: 'text-red-200',    accent: 'text-red-400',    border: 'border-red-900/40',   tag: 'bg-red-950 text-red-300' },
  personal: { bg: 'bg-slate-950',  text: 'text-slate-200',  accent: 'text-violet-400', border: 'border-violet-900/30',tag: 'bg-violet-950 text-violet-300' },
}

// ── forum post renderer ───────────────────────────────────────────────────
function ForumPost({ row, t }: { row: SiteContentRow; t: typeof THEME_STYLES[SiteTheme] }) {
  if (row.post_removed) {
    return (
      <div className={`px-3 py-2 rounded border ${t.border} opacity-40 italic text-xs`}>
        {row.post_body}
      </div>
    )
  }
  return (
    <div className={`px-3 py-2 rounded border ${t.border} space-y-1`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono ${t.accent}`}>{row.post_handle ?? row.post_author}</span>
        {row.post_replies != null && row.post_replies > 0 && (
          <span className="text-xs opacity-40">{row.post_replies} replies</span>
        )}
      </div>
      <p className="text-sm leading-relaxed opacity-90">{row.post_body}</p>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────
export default function GridBrowser() {
  const [url, setUrl]       = useState('gridos.corp')
  const [input, setInput]   = useState('gridos.corp')
  const { compliance, shadow, adjustRep } = useRepStore()
  const { unlocks }         = useRepStore() as any

  // ── Supabase lookup ─────────────────────────────────────────────────────
  // useSite returns 'not_found' for slugs that only live in PAGES.
  // In that case we fall back to the local registry seamlessly.
  const supaResult = useSite(url)

  // ── Resolve page data ───────────────────────────────────────────────────
  const page = useMemo<PageData | null>(() => {
    if (supaResult.status === 'ok') return siteRowToPageData(supaResult.site)
    if (supaResult.status === 'not_found' || supaResult.status === 'idle') {
      return PAGES[url] ?? null
    }
    // loading / error: return local fallback while waiting
    return PAGES[url] ?? null
  }, [supaResult, url])

  const isLoadingFromDB = supaResult.status === 'loading' && !PAGES[url]

  const t = THEME_STYLES[(page?.theme ?? 'corp')]

  // ── Access gate check ───────────────────────────────────────────────────
  const gateBlocked = useMemo(() => {
    if (!page?.gate) return false
    const g = page.gate
    if (g.type === 'compliance') return compliance < g.min
    if (g.type === 'shadow')     return shadow     < g.min
    if (g.type === 'unlocked')   return !(unlocks as Set<string>)?.has(g.key)
    return false
  }, [page, compliance, shadow, unlocks])

  // ── Navigate ─────────────────────────────────────────────────────────────
  function navigate(target: string) {
    const clean = target.trim().toLowerCase().replace(/^https?:\/\//, '')
    setUrl(clean)
    setInput(clean)
    // rep effect applied after gate check on render
  }

  // Apply rep effect once per navigation (for pages that pass gate)
  const lastRepUrl = useMemo(() => ({ current: '' }), [])
  if (page && !gateBlocked && url !== lastRepUrl.current) {
    lastRepUrl.current = url
    if (page.repEffect?.compliance) adjustRep('compliance', page.repEffect.compliance)
    if (page.repEffect?.shadow)     adjustRep('shadow',     page.repEffect.shadow)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col h-full ${t.bg} ${t.text} font-mono text-sm`}>

      {/* address bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/30">
        <span className={`text-xs ${t.accent} opacity-60 select-none`}>GRID://</span>
        <input
          className="flex-1 bg-transparent outline-none text-xs tracking-wide caret-current"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && navigate(input)}
          spellCheck={false}
        />
        <button
          onClick={() => navigate(input)}
          className={`text-xs px-2 py-0.5 rounded border ${t.border} hover:bg-white/5 transition-colors`}
        >
          GO
        </button>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* loading state */}
        {isLoadingFromDB && (
          <div className="opacity-40 text-xs animate-pulse">connecting to grid node…</div>
        )}

        {/* error state from Supabase (non-fatal, local fallback used) */}
        {supaResult.status === 'error' && (
          <div className="text-xs opacity-30 italic">⚠ remote sync degraded — serving cached data</div>
        )}

        {!page && !isLoadingFromDB && (
          <div className="space-y-1">
            <p className="text-red-400">404 — node not found</p>
            <p className="opacity-40 text-xs">{url} is not responding or does not exist.</p>
          </div>
        )}

        {page && (
          <>
            {/* header */}
            <div className="space-y-1">
              <div className={`text-xs opacity-40`}>{page.site}</div>
              <h1 className={`text-base font-bold ${t.accent}`}>{page.title}</h1>
              {page.subtitle && <p className="text-xs opacity-50 italic">{page.subtitle}</p>}
            </div>

            {/* live indicator — shown when site is served from Supabase */}
            {supaResult.status === 'ok' && (
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${t.accent.replace('text-', 'bg-')} animate-pulse`} />
                <span className="text-xs opacity-30">live</span>
              </div>
            )}

            {/* gate */}
            {gateBlocked ? (
              <div className={`border ${t.border} rounded px-3 py-3 space-y-1`}>
                <p className="text-xs text-red-400">⛔ ACCESS DENIED</p>
                <p className="text-xs opacity-60">{page.gateHint ?? 'You do not have the required access level for this node.'}</p>
              </div>
            ) : (
              <>
                {/* body paragraphs */}
                {page.body.length > 0 && (
                  <div className="space-y-2">
                    {page.body.map((line, i) => (
                      <p key={i} className="text-xs leading-relaxed opacity-80">{line}</p>
                    ))}
                  </div>
                )}

                {/* forum posts — rendered for Supabase forum sites */}
                {supaResult.status === 'ok' && (() => {
                  const posts = (supaResult.site.content ?? [])
                    .filter(c => c.kind === 'forum_post')
                    .sort((a, b) => a.sort_order - b.sort_order)
                  if (posts.length === 0) return null
                  return (
                    <div className="space-y-2">
                      <div className="text-xs opacity-30 uppercase tracking-widest">threads</div>
                      {posts.map(p => (
                        <ForumPost key={p.id} row={p} t={t} />
                      ))}
                    </div>
                  )
                })()}

                {/* job */}
                {page.job && (
                  <div className={`border ${t.border} rounded px-3 py-2 space-y-1`}>
                    <div className="text-xs opacity-40 uppercase tracking-wider">available contract</div>
                    <div className={`text-xs font-semibold ${t.accent}`}>{page.job.title}</div>
                    <div className="text-xs opacity-60">{page.job.corp} · {page.job.pay}</div>
                    <button
                      onClick={() => { addJob({ id: url, title: page.job!.title, corp: page.job!.corp, pay: page.job!.pay }) }}
                      className={`mt-1 text-xs px-2 py-0.5 rounded border ${t.border} hover:bg-white/5 transition-colors`}
                    >
                      Accept contract
                    </button>
                  </div>
                )}

                {/* nav links */}
                {page.links.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs opacity-30 uppercase tracking-widest">links</div>
                    {page.links.map((lnk, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(lnk.url)}
                        className={`block text-left text-xs ${t.accent} hover:underline opacity-80 hover:opacity-100 transition-opacity`}
                      >
                        → {lnk.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
