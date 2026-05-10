import { useEffect, useMemo, useState } from 'react'
import { addJob } from '@/store/jobStore'
import { useRepStore } from '@/store/reputationStore'
import { useUnlockStore } from '@/store/unlockStore'
import { useSite } from '@/hooks/useSite'
import { KNOWN_DOMAINS, isValidGridUrl } from '@/lib/gridTargets'
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

// ── page registry (local fallback) ───────────────────────────────────────
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
      { label: 'Browse listings', url: 'voidbay.net/listings' },
      { label: 'Anonymous drops', url: 'voidbay.net/anon-drops' },
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
      { label: 'VoidBay Home',    url: 'voidbay.net' },
      { label: 'Anonymous drops', url: 'voidbay.net/anon-drops' },
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
      { label: 'Sector 7 maintenance extended',       url: 'gridnetnews.com/sector7-maintenance' },
      { label: 'GridMart expands same-day delivery',   url: 'gridnetnews.com/gridmart-expansion' },
      { label: 'Commune suspect arrested',             url: 'gridnetnews.com/commune-arrest' },
      { label: 'Record Q1 profits',                   url: 'gridnetnews.com/q1-profits' },
      { label: 'Archivist employee reported missing',  url: 'gridnetnews.com/archivist-missing' },
      { label: 'GridSocial: 500 million accounts',    url: 'gridnetnews.com/gridsocial-500m' },
      { label: 'Splice forum taken offline',          url: 'gridnetnews.com/splice-dmca' },
      { label: 'Northern campus power irregularities', url: 'gridnetnews.com/northern-campus-power' },
      { label: 'GridOS 9.4 update rolls out',         url: 'gridnetnews.com/gridos-update-9-4' },
    ],
    repEffect: { compliance: +1 },
  },
  'gridsocial.net': {
    site: 'GridSocial', title: "GridSocial // What's on the Grid",
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
      "Writing about noodles because it's the one thing that stays the same wherever I go.",
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
      "Projects: GridOS helpdesk ticketing integration (2054), node sanitation automation scripts (2056), internal patch scheduler (2057).",
      "I'm not looking for new opportunities. This site is mostly for my own record-keeping.",
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
      { label: 'Your cart',     url: 'gridmart.shop/cart' },
      { label: 'Order history', url: 'gridmart.shop/orders' },
    ],
    repEffect: { compliance: +1 },
  },
  '__not_found__': {
    site: 'GridOS Network',
    title: 'Domain Not Found',
    subtitle: 'This address is not registered on the Grid.',
    theme: 'corp',
    body: ['The domain you entered does not exist or has been removed from GridOS routing tables.'],
    links: [{ label: 'Go to GridOS Home', url: 'gridos.corp' }],
  },
}

// ── OPS panel (inline scan engine) ───────────────────────────────────────
const _OPS_FIREWALL_GRADES = ['A+', 'A', 'B', 'C', 'D', 'F', 'NONE', 'UNKNOWN']
const _OPS_NODE_OWNERS     = ['GRIDOS CORP', 'UNREGISTERED', 'PROXY-RELAY', 'CITIZEN NODE', 'DARK RELAY', 'GHOST NODE', 'GOV SECTOR 4', 'PRIVATE CORP']
const _OPS_PORT_SETS       = ['80, 443, 8080', '22, 80, 443', '80, 443, 3306, 8443', '443 only', '21, 22, 80, 443, 8080, 9000', 'NONE VISIBLE']
const _OPS_BEHAVIORS       = ['Logging all inbound', 'Rate-limiting suspicious IPs', 'Honeypot active on port 9001', 'Ghost traffic detected (14%)', 'No anomalies detected', 'Deep packet inspection enabled', 'Compliance beacon transmitting', 'Behavior profiling: ACTIVE']

type OpsScanResult = { label: string; value: string; status: 'clean' | 'warn' | 'critical' | 'unknown' }

function _opsSeedRng(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  return () => { h ^= h << 13; h ^= h >> 7; h ^= h << 17; return (h >>> 0) / 0xFFFFFFFF }
}

function _opsGenerateScan(target: string): OpsScanResult[] {
  const rng = _opsSeedRng(target || 'null')
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]
  const fw = pick(_OPS_FIREWALL_GRADES)
  const fwStatus: OpsScanResult['status'] = ['A+', 'A'].includes(fw) ? 'clean' : ['B', 'C'].includes(fw) ? 'warn' : 'critical'
  const ip = `${Math.floor(rng()*223)+1}.${Math.floor(rng()*254)+1}.${Math.floor(rng()*254)+1}.${Math.floor(rng()*254)+1}`
  return [
    { label: 'RESOLVED IP',     value: ip,                                                              status: 'unknown' },
    { label: 'NODE OWNER',      value: pick(_OPS_NODE_OWNERS),                                          status: rng() > 0.5 ? 'warn' : 'clean' },
    { label: 'FIREWALL GRADE',  value: fw,                                                              status: fwStatus },
    { label: 'OPEN PORTS',      value: pick(_OPS_PORT_SETS),                                            status: rng() > 0.6 ? 'warn' : 'clean' },
    { label: 'GRID COMPLIANCE', value: rng() > 0.5 ? 'COMPLIANT' : 'NON-COMPLIANT',                    status: rng() > 0.5 ? 'clean' : 'critical' },
    { label: 'BEHAVIOR FLAGS',  value: pick(_OPS_BEHAVIORS),                                            status: rng() > 0.7 ? 'warn' : 'clean' },
    { label: 'GHOST TRAFFIC',   value: `${Math.floor(rng() * 40)}%`,                                   status: rng() > 0.6 ? 'critical' : 'clean' },
    { label: 'LAST PING',       value: `${Math.floor(rng() * 800) + 12}ms`,                            status: 'unknown' },
  ]
}

function OpsScanRow({ row, reveal }: { row: OpsScanResult; reveal: boolean }) {
  const dot = { clean: 'bg-green-500', warn: 'bg-yellow-500', critical: 'bg-red-500', unknown: 'bg-zinc-500' }[row.status]
  return (
    <div className={`flex items-start gap-2 py-1.5 border-b border-green-950/40 last:border-0 transition-all duration-300 ${reveal ? 'opacity-100' : 'opacity-0 translate-y-1'}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot} shrink-0 mt-1.5`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-green-700/50 uppercase tracking-widest leading-none mb-0.5">{row.label}</div>
        <div className={`text-xs font-mono leading-tight ${row.status === 'critical' ? 'text-red-400' : row.status === 'warn' ? 'text-yellow-400' : 'text-green-300'}`}>
          {row.value}
        </div>
      </div>
    </div>
  )
}

function OPSPanel({ targetUrl, onClose }: { targetUrl: string; onClose: () => void }) {
  const [scanResults, setScanResults]   = useState<OpsScanResult[]>([])
  const [scanning,    setScanning]      = useState(false)
  const [scanDone,    setScanDone]      = useState(false)
  const [revealedRows, setRevealedRows] = useState<boolean[]>([])

  async function runScan() {
    if (scanning) return
    setScanning(true); setScanDone(false); setScanResults([]); setRevealedRows([])
    const results = _opsGenerateScan(targetUrl)
    setScanResults(results)
    for (let i = 0; i < results.length; i++) {
      await new Promise(r => setTimeout(r, 220 + Math.random() * 180))
      setRevealedRows(prev => { const n = [...prev]; n[i] = true; return n })
    }
    setScanDone(true); setScanning(false)
  }

  useEffect(() => {
    setScanResults([]); setScanDone(false); setRevealedRows([])
    runScan()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUrl])

  return (
    <div className="absolute top-0 right-0 h-full w-72 z-50 bg-zinc-950 border-l border-green-900/40 shadow-2xl flex flex-col font-mono text-xs select-none">
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        <span className="text-xs font-black text-red-400 tracking-widest">OPS</span>
        <span className="text-zinc-700">|</span>
        <span className="text-xs text-zinc-500 truncate flex-1">{targetUrl}</span>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors text-base leading-none px-1 shrink-0">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {scanning && (
          <div className="flex items-center gap-2 text-xs text-green-700 py-1">
            <span className="animate-pulse">◉</span>
            <span className="animate-pulse">Scanning {targetUrl}…</span>
          </div>
        )}
        {scanResults.length > 0 && (
          <div className="border border-green-950/40 rounded bg-green-950/5 px-3 py-1">
            {scanResults.map((row, i) => (
              <OpsScanRow key={i} row={row} reveal={!!revealedRows[i]} />
            ))}
          </div>
        )}
        {scanDone && (
          <button
            onClick={runScan}
            className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-green-600 hover:border-green-900 transition-colors"
          >
            ↺ RE-SCAN
          </button>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
        <span className="text-xs text-zinc-700">OPS // unregistered</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-xs text-red-900">DARK</span>
        </div>
      </div>
    </div>
  )
}

// ── theme config ──────────────────────────────────────────────────────────
type ThemeConfig = {
  bg: string
  text: string
  accent: string
  muted: string
  border: string
  tag: string
  headerBg: string
  headerBorder: string
  divider: string
  layout: 'corp' | 'news' | 'blog' | 'archive' | 'void' | 'forum'
}

const THEME_STYLES: Record<SiteTheme, ThemeConfig> = {
  corp: {
    bg: 'bg-slate-50', text: 'text-slate-800', accent: 'text-blue-700', muted: 'text-slate-500',
    border: 'border-slate-200', tag: 'bg-blue-50 text-blue-700',
    headerBg: 'bg-white', headerBorder: 'border-slate-200',
    divider: 'border-slate-100',
    layout: 'corp',
  },
  news: {
    bg: 'bg-neutral-50', text: 'text-neutral-900', accent: 'text-orange-600', muted: 'text-neutral-500',
    border: 'border-neutral-200', tag: 'bg-orange-50 text-orange-700',
    headerBg: 'bg-neutral-900', headerBorder: 'border-neutral-800',
    divider: 'border-neutral-200',
    layout: 'news',
  },
  forum: {
    bg: 'bg-neutral-100', text: 'text-neutral-800', accent: 'text-yellow-700', muted: 'text-neutral-500',
    border: 'border-neutral-200', tag: 'bg-yellow-100 text-yellow-800',
    headerBg: 'bg-yellow-500', headerBorder: 'border-yellow-600',
    divider: 'border-neutral-200',
    layout: 'forum',
  },
  blog: {
    bg: 'bg-stone-50', text: 'text-stone-800', accent: 'text-emerald-700', muted: 'text-stone-500',
    border: 'border-stone-200', tag: 'bg-emerald-50 text-emerald-700',
    headerBg: 'bg-stone-50', headerBorder: 'border-stone-200',
    divider: 'border-stone-200',
    layout: 'blog',
  },
  hidden: {
    bg: 'bg-zinc-950', text: 'text-zinc-300', accent: 'text-cyan-400', muted: 'text-zinc-600',
    border: 'border-cyan-900/30', tag: 'bg-cyan-950 text-cyan-300',
    headerBg: 'bg-zinc-900', headerBorder: 'border-cyan-900/40',
    divider: 'border-cyan-900/20',
    layout: 'archive',
  },
  void: {
    bg: 'bg-black', text: 'text-red-200', accent: 'text-red-400', muted: 'text-red-900',
    border: 'border-red-900/40', tag: 'bg-red-950 text-red-300',
    headerBg: 'bg-zinc-950', headerBorder: 'border-red-900/50',
    divider: 'border-red-900/30',
    layout: 'void',
  },
  personal: {
    bg: 'bg-slate-50', text: 'text-slate-800', accent: 'text-violet-700', muted: 'text-slate-500',
    border: 'border-slate-200', tag: 'bg-violet-50 text-violet-700',
    headerBg: 'bg-white', headerBorder: 'border-slate-200',
    divider: 'border-slate-100',
    layout: 'blog',
  },
}

// ── layout props type ─────────────────────────────────────────────────────
type LayoutProps = {
  page: PageData
  t: ThemeConfig
  url: string
  navigate: (target: string) => void
  gateBlocked: boolean
  isLive: boolean
  forumPosts: SiteContentRow[]
}

// ── shared sub-components ─────────────────────────────────────────────────

function ForumPost({ row, t }: { row: SiteContentRow; t: ThemeConfig }) {
  if (row.post_removed) {
    return (
      <div className="border border-neutral-200 rounded-lg px-4 py-3 bg-neutral-50">
        <p className="text-xs italic text-neutral-400 select-none">{row.post_body}</p>
      </div>
    )
  }
  const handle = row.post_handle ?? row.post_author ?? 'anon'
  const seed = handle.charCodeAt(0) % 6
  const avatarColors = [
    'bg-amber-200 text-amber-900',
    'bg-sky-200 text-sky-900',
    'bg-rose-200 text-rose-900',
    'bg-violet-200 text-violet-900',
    'bg-teal-200 text-teal-900',
    'bg-orange-200 text-orange-900',
  ]
  const initials = handle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??'
  return (
    <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3 space-y-2 hover:border-neutral-300 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${avatarColors[seed]}`}>
          <span className="text-xs font-bold leading-none">{initials}</span>
        </div>
        <span className="text-xs font-semibold text-neutral-700">{handle}</span>
        {row.post_replies != null && row.post_replies > 0 && (
          <span className="ml-auto text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">{row.post_replies} replies</span>
        )}
      </div>
      <p className="text-xs text-neutral-600 leading-relaxed pl-8">{row.post_body}</p>
    </div>
  )
}

function ContractCard({ job, url, t }: { job: JobOffer; url: string; t: ThemeConfig }) {
  return (
    <div className={`border ${t.border} rounded-lg px-4 py-3 space-y-1.5 bg-white/60`}>
      <div className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Available Contract</div>
      <div className="text-sm font-semibold text-neutral-800">{job.title}</div>
      <div className="text-xs text-neutral-500">{job.corp} · {job.pay}</div>
      <button
        onClick={() => addJob({ id: url, title: job.title, corp: job.corp, pay: job.pay })}
        className="mt-1 text-xs px-3 py-1 rounded border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors font-medium"
      >
        Accept Contract
      </button>
    </div>
  )
}

function VoidContractCard({ job, url }: { job: JobOffer; url: string }) {
  return (
    <div className="border border-red-900/40 rounded px-3 py-2 space-y-1 font-mono">
      <div className="text-xs text-red-900/60 uppercase tracking-wider">// contract</div>
      <div className="text-xs font-semibold text-red-300">{job.title}</div>
      <div className="text-xs text-red-900/70">{job.corp} · {job.pay}</div>
      <button
        onClick={() => addJob({ id: url, title: job.title, corp: job.corp, pay: job.pay })}
        className="mt-1 text-xs px-2 py-0.5 rounded border border-red-900/40 text-red-500/70 hover:text-red-300 transition-colors"
      >
        accept
      </button>
    </div>
  )
}

// ── LAYOUT: CORP ──────────────────────────────────────────────────────────
// Polished enterprise site. White top nav, blue gradient hero, numbered body cards.
function LayoutCorp({ page, t, url, navigate, gateBlocked, isLive, forumPosts }: LayoutProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-white text-slate-800 font-sans text-sm flex flex-col">

      {/* Top nav */}
      <nav className="bg-white border-b border-slate-200 px-4 flex items-center shrink-0" style={{ height: '44px' }}>
        <div className="flex items-center gap-2 mr-6">
          <div className="w-6 h-6 rounded bg-blue-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black leading-none">G</span>
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-tight whitespace-nowrap">{page.site}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-1 overflow-hidden">
          {page.links.slice(0, 4).map((lnk, i) => (
            <button key={i} onClick={() => navigate(lnk.url)}
              className="text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded hover:bg-slate-100 transition-colors whitespace-nowrap truncate max-w-[130px]">
              {lnk.label}
            </button>
          ))}
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 shrink-0 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs text-green-700 font-medium">Live</span>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 px-6 py-8 text-white shrink-0">
        <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
          <span className="text-xs text-blue-200 uppercase tracking-wider font-medium">Official Communication</span>
        </div>
        <h1 className="text-xl font-extrabold text-white leading-tight">{page.title}</h1>
        {page.subtitle && <p className="text-sm text-blue-200 mt-1.5 max-w-sm leading-relaxed">{page.subtitle}</p>}
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5 flex-1 bg-slate-50">
        {gateBlocked ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3 items-start">
            <span className="text-red-400 text-lg shrink-0">⛔</span>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-0.5">Access Restricted</p>
              <p className="text-xs text-red-500 leading-relaxed">{page.gateHint ?? 'You do not have the required clearance level.'}</p>
            </div>
          </div>
        ) : (
          <>
            {page.body.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {page.body.map((line, i) => (
                  <div key={i} className="px-5 py-4 flex gap-4 items-start">
                    <span className="text-xs font-mono text-slate-300 shrink-0 mt-0.5 tabular-nums select-none w-5 text-right">{i + 1}</span>
                    <p className="text-sm text-slate-600 leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            )}

            {page.job && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-2.5">
                <span className="inline-block text-xs bg-blue-700 text-white px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">Open Role</span>
                <p className="text-sm font-bold text-blue-900">{page.job.title}</p>
                <p className="text-xs text-blue-600">{page.job.corp} · {page.job.pay}</p>
                <button onClick={() => addJob({ id: url, title: page.job!.title, corp: page.job!.corp, pay: page.job!.pay })}
                  className="text-xs bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white px-4 py-1.5 rounded-lg transition-colors font-semibold">
                  Apply Now →
                </button>
              </div>
            )}

            {page.links.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2.5">Quick Links</p>
                <div className="space-y-1.5">
                  {page.links.map((lnk, i) => (
                    <button key={i} onClick={() => navigate(lnk.url)}
                      className="w-full flex items-center gap-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg px-4 py-2.5 text-left transition-all group">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-sm text-slate-700 group-hover:text-blue-700 transition-colors flex-1 truncate">{lnk.label}</span>
                      <span className="text-slate-300 group-hover:text-blue-400 text-lg leading-none">›</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-slate-200 bg-white shrink-0">
        <p className="text-xs text-slate-400">© GridOS Corp. All activity monitored under the Unified Access Compact.</p>
      </div>
    </div>
  )
}

// ── LAYOUT: NEWS ──────────────────────────────────────────────────────────
// Newspaper / wire service. Near-black masthead, byline strip, pull-quote, article layout.
function LayoutNews({ page, t, url, navigate, gateBlocked, isLive, forumPosts }: LayoutProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-white text-neutral-900 font-sans text-sm flex flex-col">

      {/* Masthead */}
      <div className="bg-neutral-950 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-amber-500 rounded-sm flex items-center justify-center shrink-0">
            <span className="text-neutral-950 text-xs font-black leading-none">P</span>
          </div>
          <span className="text-xs font-black text-white tracking-widest uppercase">{page.site}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide">
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />Live
            </span>
          )}
          <span className="text-xs text-neutral-500 font-mono tabular-nums">07 MAY 2026</span>
        </div>
      </div>

      {/* Headline */}
      <div className="bg-white border-b-2 border-neutral-950 px-5 pt-4 pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">Markets</span>
          <span className="text-xs text-neutral-400">· 07 May 2026</span>
        </div>
        <h1 className="text-xl font-black text-neutral-950 leading-tight tracking-tight">{page.title}</h1>
        {page.subtitle && (
          <p className="mt-2 text-sm text-neutral-500 italic border-l-4 border-amber-400 pl-3 leading-snug">{page.subtitle}</p>
        )}
      </div>

      {/* Byline */}
      <div className="px-5 py-2 bg-neutral-100 border-b border-neutral-200 shrink-0 flex items-center gap-3">
        <p className="text-xs text-neutral-500">By <span className="font-semibold text-neutral-700">{page.site} Staff</span></p>
        <span className="text-neutral-300">·</span>
        <p className="text-xs text-neutral-400">Automated wire feed</p>
      </div>

      {/* Article */}
      <div className="px-5 py-5 space-y-5 flex-1">
        {gateBlocked ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
            <span className="text-amber-500 text-base shrink-0">🔒</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Subscriber Content</p>
              <p className="text-xs text-amber-600 mt-0.5">{page.gateHint ?? 'This article requires a verified subscriber account.'}</p>
            </div>
          </div>
        ) : (
          <>
            {page.body.length > 0 && (
              <div>
                {page.body.map((line, i) => (
                  i === 1 && page.body.length > 2 ? (
                    <blockquote key={i} className="my-4 border-l-4 border-amber-500 pl-4 pr-3 py-2.5 bg-amber-50 rounded-r-lg">
                      <p className="text-sm text-neutral-700 italic font-medium leading-relaxed">{line}</p>
                    </blockquote>
                  ) : (
                    <p key={i} className="text-sm text-neutral-700 leading-relaxed py-2.5 border-b border-neutral-100 last:border-0">{line}</p>
                  )
                ))}
              </div>
            )}

            {page.job && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Sponsored · Job Listing</p>
                <p className="text-sm font-semibold text-neutral-800">{page.job.title}</p>
                <p className="text-xs text-neutral-500">{page.job.corp} · {page.job.pay}</p>
                <button onClick={() => addJob({ id: url, title: page.job!.title, corp: page.job!.corp, pay: page.job!.pay })}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded font-semibold transition-colors">
                  Learn More
                </button>
              </div>
            )}

            {page.links.length > 0 && (
              <div className="border-t-2 border-neutral-950 pt-4">
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-3">More Coverage</p>
                <div>
                  {page.links.map((lnk, i) => (
                    <button key={i} onClick={() => navigate(lnk.url)}
                      className="w-full text-left flex items-center gap-2 py-2.5 border-b border-neutral-100 last:border-0 group">
                      <span className="text-amber-500 shrink-0 text-base leading-none">›</span>
                      <span className="text-sm text-neutral-800 group-hover:text-amber-600 font-medium transition-colors">{lnk.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── LAYOUT: BLOG ──────────────────────────────────────────────────────────
// Personal blog. Warm stone palette, author avatar, word count, intimate editorial feel.
function LayoutBlog({ page, t, url, navigate, gateBlocked, isLive, forumPosts }: LayoutProps) {
  const author = page.site.replace(/\.(blog|dev|net|com)$/, '')
  const wordCount = page.body.reduce((n, l) => n + l.split(' ').length, 0)

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 text-stone-800 font-sans text-sm flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{author[0]?.toUpperCase()}</span>
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-stone-800">{page.site}</p>
            <p className="text-xs text-stone-400">personal blog</p>
          </div>
        </div>
        {isLive && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-stone-400">live</span>
          </div>
        )}
      </div>

      {/* Post header */}
      <div className="bg-white px-6 pt-6 pb-5 border-b border-stone-200 shrink-0">
        <h1 className="text-lg font-bold text-stone-900 leading-snug">{page.title}</h1>
        {page.subtitle && <p className="text-sm text-stone-400 italic mt-1.5">{page.subtitle}</p>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-3 text-xs text-stone-400">
          <span className="font-medium text-stone-600">{author}</span>
          <span>·</span>
          <span>07 May 2026</span>
          {wordCount > 0 && <><span>·</span><span>{wordCount} words</span></>}
        </div>
        <div className="w-10 h-0.5 bg-stone-800 mt-4" />
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-5 flex-1">
        {gateBlocked ? (
          <div className="bg-stone-100 border border-stone-300 rounded-lg p-4 flex gap-3 items-start">
            <span className="text-stone-400 shrink-0">🔒</span>
            <div>
              <p className="text-sm font-semibold text-stone-700">Private Entry</p>
              <p className="text-xs text-stone-500 mt-0.5">{page.gateHint ?? 'This post is not publicly accessible.'}</p>
            </div>
          </div>
        ) : (
          <>
            {page.body.length > 0 && (
              <div className="space-y-4 max-w-prose">
                {page.body.map((line, i) => (
                  <p key={i} className="text-sm text-stone-700 leading-loose">{line}</p>
                ))}
              </div>
            )}

            {page.job && (
              <div className="border border-dashed border-stone-400 rounded-lg px-4 py-4 space-y-2 bg-stone-100/50">
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium">// dropped here</p>
                <p className="text-sm font-semibold text-stone-800">{page.job.title}</p>
                <p className="text-xs text-stone-500">{page.job.corp} · {page.job.pay}</p>
                <button onClick={() => addJob({ id: url, title: page.job!.title, corp: page.job!.corp, pay: page.job!.pay })}
                  className="text-xs border border-stone-400 text-stone-600 hover:bg-stone-200 px-3 py-1 rounded transition-colors">
                  Accept
                </button>
              </div>
            )}

            {page.links.length > 0 && (
              <div className="pt-5 border-t border-stone-200 space-y-2.5">
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-3">— See Also —</p>
                {page.links.map((lnk, i) => (
                  <button key={i} onClick={() => navigate(lnk.url)}
                    className="flex items-center gap-2 text-xs text-stone-600 hover:text-stone-900 transition-colors group">
                    <span className="text-stone-400 group-hover:text-stone-600 shrink-0">↳</span>
                    <span className="underline underline-offset-2 decoration-stone-300 group-hover:decoration-stone-600">{lnk.label}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── LAYOUT: ARCHIVE ───────────────────────────────────────────────────────
// Civic document dump. Dark mono, record IDs, dashed borders, cyan-on-zinc.
function LayoutArchive({ page, t, url, navigate, gateBlocked, isLive, forumPosts }: LayoutProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-300 font-mono text-xs flex flex-col">

      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-900/30 bg-zinc-900 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-cyan-800/50 rounded-sm flex items-center justify-center shrink-0">
              <span className="text-cyan-700 text-xs leading-none font-bold">▣</span>
            </div>
            <span className="text-cyan-700/70 uppercase tracking-widest text-xs">{page.site}</span>
          </div>
          {isLive && (
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-cyan-700/60 text-xs">mirror live</span>
            </div>
          )}
        </div>
        <h1 className="text-sm font-semibold text-cyan-300 leading-snug">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-zinc-500 italic mt-0.5">{page.subtitle}</p>}
        <div className="mt-2 pt-1.5 border-t border-cyan-900/20 flex items-center gap-3">
          <span className="text-xs text-cyan-900/60 uppercase tracking-widest">CLASSIFIED ARCHIVE</span>
          <span className="text-cyan-900/40">·</span>
          <span className="text-xs text-cyan-900/60 uppercase tracking-widest">MIRROR 441-C</span>
          <span className="text-cyan-900/40">·</span>
          <span className="text-xs text-cyan-900/60 uppercase tracking-widest">READ ONLY</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-5 flex-1">
        {gateBlocked ? (
          <div className="border border-red-900/50 rounded px-3 py-2.5 bg-red-950/20">
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">⛔ CLEARANCE REQUIRED</p>
            <p className="text-xs text-zinc-500 mt-1">{page.gateHint ?? 'Insufficient access level for this node.'}</p>
          </div>
        ) : (
          <>
            {page.body.length > 0 && (
              <div className="border border-dashed border-cyan-900/40 rounded overflow-hidden divide-y divide-cyan-900/20">
                {page.body.map((line, i) => (
                  <div key={i} className="px-3 py-2.5 flex gap-3 items-start hover:bg-cyan-950/20 transition-colors">
                    <span className="text-xs text-cyan-900/50 uppercase tracking-widest shrink-0 mt-0.5 tabular-nums select-none">
                      REC-{String(i + 1).padStart(3, '0')}
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">{line}</p>
                  </div>
                ))}
              </div>
            )}

            {page.job && (
              <div className="border border-dashed border-cyan-900/40 rounded px-3 py-2.5 space-y-1.5">
                <div className="text-xs text-cyan-800/60 uppercase tracking-wider">// contract available</div>
                <div className="text-xs font-semibold text-cyan-300">{page.job.title}</div>
                <div className="text-xs text-zinc-500">{page.job.corp} · {page.job.pay}</div>
                <button onClick={() => addJob({ id: url, title: page.job!.title, corp: page.job!.corp, pay: page.job!.pay })}
                  className="mt-0.5 text-xs px-2 py-0.5 rounded border border-cyan-900/40 text-cyan-600 hover:text-cyan-300 transition-colors">
                  accept contract
                </button>
              </div>
            )}

            {page.links.length > 0 && (
              <div>
                <div className="text-xs text-cyan-900/60 uppercase tracking-widest mb-2">CROSS-REFERENCES</div>
                <div className="border border-dashed border-cyan-900/40 rounded overflow-hidden divide-y divide-cyan-900/20">
                  {page.links.map((lnk, i) => (
                    <button key={i} onClick={() => navigate(lnk.url)}
                      className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-cyan-950/30 transition-colors">
                      <span className="text-xs text-cyan-900/60 tabular-nums shrink-0 select-none">[{String(i + 1).padStart(2, '0')}]</span>
                      <span className="text-xs text-cyan-400 hover:text-cyan-200 transition-colors">{lnk.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── LAYOUT: VOID ──────────────────────────────────────────────────────────
// Dark-net grey market terminal. Pure black, red, hostile sparse mono.
function LayoutVoid({ page, t, url, navigate, gateBlocked, isLive, forumPosts }: LayoutProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-black text-red-200 font-mono text-xs flex flex-col">

      {/* Header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-red-900/30 bg-zinc-950 shrink-0">
        <div className="text-xs text-red-900/60 uppercase tracking-widest mb-2 animate-pulse">
          !! UNREGISTERED NODE !! GRID ROUTING DISABLED !!
        </div>
        <h1 className="text-sm font-bold text-red-300 leading-snug">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-red-900/50 mt-0.5">{page.subtitle}</p>}
        <div className="mt-2 pt-1.5 border-t border-red-900/20 flex items-center gap-2">
          <span className="text-xs text-red-900/40 uppercase tracking-widest">{page.site}</span>
          {isLive && (
            <>
              <span className="text-red-900/30">·</span>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-700 animate-pulse" />
                <span className="text-xs text-red-900/50">active</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-4 flex-1">
        {gateBlocked ? (
          <div className="border border-red-900/40 px-3 py-2.5 rounded">
            <p className="text-xs text-red-500 font-bold uppercase tracking-wider">⛔ ACCESS DENIED</p>
            <p className="text-xs text-red-900/60 mt-1">{page.gateHint ?? 'You lack the required standing.'}</p>
          </div>
        ) : (
          <>
            {page.body.length > 0 && (
              <div className="bg-red-950/10 border border-red-900/20 rounded px-3 py-2.5 space-y-2">
                {page.body.map((line, i) => (
                  <p key={i} className="text-xs text-red-200/70 leading-relaxed">
                    <span className="text-red-900/50 mr-1.5 select-none">&gt;</span>{line}
                  </p>
                ))}
              </div>
            )}

            {page.job && <VoidContractCard job={page.job} url={url} />}

            {page.links.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-red-900/40 uppercase tracking-widest select-none">-- NAV --</div>
                {page.links.map((lnk, i) => (
                  <button key={i} onClick={() => navigate(lnk.url)}
                    className="block text-left text-xs text-red-600/70 hover:text-red-300 transition-colors">
                    <span className="text-red-900/50 mr-1.5 select-none">[{i}]</span>{lnk.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── LAYOUT: FORUM ─────────────────────────────────────────────────────────
// Community board. Yellow top bar, upvote header, colour-coded avatar reply cards.
function LayoutForum({ page, t, url, navigate, gateBlocked, isLive, forumPosts }: LayoutProps) {
  const replyCount = forumPosts.length > 0 ? forumPosts.length : page.body.length

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-100 text-neutral-800 font-sans text-sm flex flex-col">

      {/* Header */}
      <div className="bg-yellow-500 border-b border-yellow-600 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-900/20 rounded flex items-center justify-center shrink-0">
            <span className="text-yellow-900 text-xs font-black leading-none">Y</span>
          </div>
          <span className="text-xs font-black text-yellow-950 tracking-widest uppercase">{page.site}</span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-900/40" />
            <span className="text-xs text-yellow-900/60">live</span>
          </div>
        )}
      </div>

      {/* Thread header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 shrink-0">
        <h1 className="text-sm font-bold text-neutral-900 leading-snug">{page.title}</h1>
        {page.subtitle && <p className="text-xs text-neutral-500 mt-0.5 italic">{page.subtitle}</p>}
        <p className="text-xs text-neutral-400 mt-1">{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</p>
      </div>

      {/* Body / Posts */}
      <div className="px-4 py-4 space-y-3 flex-1">
        {gateBlocked ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 items-start">
            <span className="text-yellow-500 shrink-0">🔒</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Members Only</p>
              <p className="text-xs text-yellow-600 mt-0.5">{page.gateHint ?? 'This thread requires membership.'}</p>
            </div>
          </div>
        ) : (
          <>
            {forumPosts.length > 0
              ? forumPosts.map((row, i) => <ForumPost key={i} row={row} t={t} />)
              : page.body.map((line, i) => (
                  <div key={i} className="bg-white rounded-lg border border-neutral-200 px-4 py-3">
                    <p className="text-xs text-neutral-600 leading-relaxed">{line}</p>
                  </div>
                ))
            }

            {page.job && <ContractCard job={page.job} url={url} t={t} />}

            {page.links.length > 0 && (
              <div className="pt-3 border-t border-neutral-200 space-y-1.5">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-2">Related Threads</p>
                {page.links.map((lnk, i) => (
                  <button key={i} onClick={() => navigate(lnk.url)}
                    className="flex items-center gap-2 text-xs text-yellow-700 hover:text-yellow-900 transition-colors">
                    <span className="text-yellow-500 shrink-0">›</span>
                    <span className="underline underline-offset-2">{lnk.label}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────
export default function GridBrowser() {
  const [url, setUrl]           = useState('gridos.corp')
  const [inputUrl, setInputUrl] = useState('gridos.corp')
  const [opsOpen, setOpsOpen]   = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { compliance, shadow, applyEvent } = useRepStore()
  const installed = useUnlockStore(s => s.installed)

  const { data: liveData, isLive } = useSite(url)

  const page = useMemo<PageData>(() => {
    if (liveData) return siteRowToPageData(liveData)
    return PAGES[url] ?? {
      site: url,
      title: '404 — Page Not Found',
      subtitle: 'This address returned no content.',
      body: ['The route you requested does not exist or has been removed from the Grid.'],
      links: [{ label: 'Return to GridOS home', url: 'gridos.corp' }],
    }
  }, [url, liveData])

  const forumPosts = useMemo<SiteContentRow[]>(() => {
    if (!liveData?.content) return []
    return liveData.content
      .filter(c => c.kind === 'post')
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [liveData])

  const t = THEME_STYLES[page.theme ?? 'corp']

  const gateBlocked = useMemo(() => {
    if (!page.gate) return false
    if (page.gate.type === 'compliance') return compliance < page.gate.min
    if (page.gate.type === 'shadow')     return shadow < page.gate.min
    if (page.gate.type === 'unlocked')   return true // always blocked unless key provided
    return false
  }, [page.gate, compliance, shadow])

  function navigate(target: string) {
    if (!isValidGridUrl(target)) {
      setUrl('__not_found__')
      setInputUrl(target)
      return
    }
    setUrl(target)
    setInputUrl(target)
  }

  useEffect(() => {
    if (!gateBlocked && page.repEffect) {
      applyEvent({
        compliance: page.repEffect.compliance,
        shadow:     page.repEffect.shadow,
      })
    }
  }, [url])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Address bar */}
      <div className="relative flex items-center gap-2 px-3 py-2 bg-neutral-200 border-b border-neutral-300 shrink-0">
        <button onClick={() => navigate('gridos.corp')} className="text-neutral-500 hover:text-neutral-800 transition-colors text-base leading-none px-0.5">⌂</button>
        <form onSubmit={e => { e.preventDefault(); navigate(inputUrl.trim()) }} className="flex-1 flex">
          <input
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            className="flex-1 text-xs bg-white border border-neutral-300 rounded px-2.5 py-1 font-mono text-neutral-700 focus:outline-none focus:border-neutral-500"
            spellCheck={false}
          />
        </form>
        {isLive && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-neutral-500">live</span>
          </div>
        )}

        {/* Hamburger menu */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className={`flex flex-col justify-center gap-[3px] w-7 h-7 rounded transition-colors shrink-0 items-center ${menuOpen ? 'bg-neutral-300' : 'hover:bg-neutral-300'}`}
          title="Browser menu"
        >
          <span className="w-4 h-px bg-neutral-600 block" />
          <span className="w-4 h-px bg-neutral-600 block" />
          <span className="w-4 h-px bg-neutral-600 block" />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute top-full right-0 z-50 w-56 bg-white border border-neutral-300 shadow-lg rounded-b-md text-xs overflow-hidden">
              <div className="px-3 py-2 border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-50">
                Extensions
              </div>
              <div className="p-2">
                {installed.includes('ops') ? (
                  <button
                    onClick={() => { setOpsOpen(o => !o); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded hover:bg-neutral-100 transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span className="font-mono font-bold text-zinc-800 text-xs">OPS</span>
                    <span className="text-neutral-400 text-xs ml-1 flex-1">Penetration Suite</span>
                    {opsOpen && <span className="text-green-600 text-xs font-mono shrink-0">● on</span>}
                  </button>
                ) : (
                  <div className="px-2 py-4 text-center text-neutral-400">No extensions installed.</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Page content + OPS overlay */}
      <div className="relative flex-1 overflow-hidden flex flex-col">
        {t.layout === 'corp'    && <LayoutCorp    page={page} t={t} url={url} navigate={navigate} gateBlocked={gateBlocked} isLive={isLive} forumPosts={forumPosts} />}
        {t.layout === 'news'    && <LayoutNews    page={page} t={t} url={url} navigate={navigate} gateBlocked={gateBlocked} isLive={isLive} forumPosts={forumPosts} />}
        {t.layout === 'blog'    && <LayoutBlog    page={page} t={t} url={url} navigate={navigate} gateBlocked={gateBlocked} isLive={isLive} forumPosts={forumPosts} />}
        {t.layout === 'archive' && <LayoutArchive page={page} t={t} url={url} navigate={navigate} gateBlocked={gateBlocked} isLive={isLive} forumPosts={forumPosts} />}
        {t.layout === 'void'    && <LayoutVoid    page={page} t={t} url={url} navigate={navigate} gateBlocked={gateBlocked} isLive={isLive} forumPosts={forumPosts} />}
        {t.layout === 'forum'   && <LayoutForum   page={page} t={t} url={url} navigate={navigate} gateBlocked={gateBlocked} isLive={isLive} forumPosts={forumPosts} />}
        {opsOpen && <OPSPanel targetUrl={url} onClose={() => setOpsOpen(false)} />}
      </div>
    </div>
  )
}
