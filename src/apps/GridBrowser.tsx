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
  theme?: 'corp' | 'news' | 'forum' | 'blog' | 'hidden' | 'void' | 'personal'
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
  // ── GridNet News ────────────────────────────────────────────────────────────
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
  'gridnetnews.com/sector7-maintenance': {
    site: 'GridNet News', title: 'Sector 7 Maintenance Window Extended — Third Week Running',
    subtitle: 'March 22, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'Gridcorp\'s infrastructure operations team has confirmed that scheduled maintenance on Sector 7 nodes will extend for a third consecutive week, citing "complex subsystem dependencies requiring additional remediation time."',
      'Users may experience intermittent latency on accounts routed through Sector 7 processing clusters. A Gridcorp spokesperson declined to provide a specific completion date.',
      'The affected cluster handles approximately 12% of active GridOS account traffic. No further details were provided.',
    ],
    links: [
      { label: 'Back to GridNet News', url: 'gridnetnews.com' },
      { label: 'Local outages — Pulse News', url: 'pulse.news/outages' },
    ],
  },
  'gridnetnews.com/gridmart-expansion': {
    site: 'GridNet News', title: 'GridMart Expands Same-Day Delivery to 40 New Markets',
    subtitle: 'April 3, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'GridMart, Gridcorp\'s integrated commerce platform, announced an expansion of its same-day delivery network to forty additional metropolitan areas, bringing total coverage to 280 markets globally.',
      'The expansion is supported by a new fleet of autonomous courier units operating through the GridMart Logistics API. CEO Priya Dantus called the rollout "a milestone in frictionless commerce."',
      'GridMart currently accounts for 18% of Gridcorp\'s total revenue.',
    ],
    links: [{ label: 'Back to GridNet News', url: 'gridnetnews.com' }],
  },
  'gridnetnews.com/commune-arrest': {
    site: 'GridNet News', title: 'Commune Suspect Arrested in Connection With Freenode Data Breach',
    subtitle: 'April 17, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'Gridcorp\'s internal security division has confirmed the arrest of an individual linked to the unauthorized publication of internal Gridcorp communications on the Commune\'s freenode.press platform.',
      'The suspect allegedly accessed restricted document repositories using credentials obtained through social engineering. A Gridcorp spokesperson described the arrest as "a clear message that the Grid\'s integrity will be defended."',
      'The Commune has not responded publicly.',
    ],
    links: [
      { label: 'Back to GridNet News', url: 'gridnetnews.com' },
      { label: 'YellowThread discussion', url: 'yellowthread.forum' },
    ],
    repEffect: { compliance: +1 },
  },
  'gridnetnews.com/q1-profits': {
    site: 'GridNet News', title: 'Gridcorp Reports Record Q1 Profits — Shares Up 14%',
    subtitle: 'April 30, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'Gridcorp posted first-quarter earnings of 84.2 billion credits, a 14% increase year-over-year, driven by strong growth in enterprise licensing and behavioral compliance analytics.',
      'Analyst consensus had predicted 79 billion. CFO Tomás Reyes cited "operational efficiency gains and sustained user growth" as key drivers.',
      'The company announced a 2-credit-per-share dividend. Shares closed up 14.3% on the GRID exchange.',
    ],
    links: [{ label: 'Back to GridNet News', url: 'gridnetnews.com' }, { label: 'Market coverage', url: 'pulse.news/markets/gridos' }],
  },
  'gridnetnews.com/archivist-missing': {
    site: 'GridNet News', title: 'Former Gridcorp Archivist Reported Missing — Family Files Report',
    subtitle: 'May 9, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'The family of a former Gridcorp compliance department employee has filed a missing persons report after the individual failed to make contact for over three weeks.',
      'The employee, who left Gridcorp in early 2058 after eight years of service, had reportedly been "stressed about work matters" in the weeks before their disappearance.',
      'Gridcorp declined to comment on the employment history of former staff. The case has been assigned to federal authorities.',
    ],
    links: [{ label: 'Back to GridNet News', url: 'gridnetnews.com' }],
  },
  'gridnetnews.com/gridsocial-500m': {
    site: 'GridNet News', title: 'GridSocial Reaches 500 Million Active Accounts',
    subtitle: 'May 14, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'Gridcorp\'s social platform GridSocial has crossed 500 million monthly active accounts. Engagement metrics show an average session length of 47 minutes, up from 39 minutes the prior year.',
      'VP of Social Products Elena Holt called the milestone "a testament to the connections our users build every day."',
      'The algorithmic feed update in Q4 drove a 22% increase in content interactions.',
    ],
    links: [{ label: 'Back to GridNet News', url: 'gridnetnews.com' }, { label: 'Visit GridSocial', url: 'gridsocial.net' }],
  },
  'gridnetnews.com/splice-dmca': {
    site: 'GridNet News', title: 'Splice-Linked Forum Goes Dark After Gridcorp DMCA Filing',
    subtitle: 'May 28, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'A forum believed to be associated with the underground collective known as The Splice was taken offline following a DMCA filing by Gridcorp\'s legal team, citing unauthorized distribution of proprietary GridOS interface documentation.',
      'The forum had been active for approximately two years on the .onion routing layer. Splice-linked accounts on GridSocial have posted cryptic messages suggesting the community has "relocated."',
      'Gridcorp declined to comment.',
    ],
    links: [{ label: 'Back to GridNet News', url: 'gridnetnews.com' }],
    repEffect: { shadow: +1 },
  },
  'gridnetnews.com/northern-campus-power': {
    site: 'GridNet News', title: 'Power Irregularities Reported Near Gridcorp\'s Northern Campus',
    subtitle: 'June 11, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'Residents near Gridcorp\'s Northern Campus have reported unusual power draw patterns over the past six weeks, with several citing flickering lights and brownouts in the surrounding district.',
      'A Gridcorp spokesperson said the company\'s facilities operate on an independent power grid and denied any connection to local infrastructure irregularities.',
      'An energy regulator spokesperson said the patterns were "consistent with a large-scale compute operation running at unusual hours." No further investigation has been announced.',
    ],
    links: [{ label: 'Back to GridNet News', url: 'gridnetnews.com' }],
  },
  'gridnetnews.com/gridos-update-9-4': {
    site: 'GridNet News', title: 'GridOS 9.4 Update Rolls Out — New Themes and Performance Fixes',
    subtitle: 'June 19, 2058 · GridNet Editorial Staff',
    theme: 'news',
    body: [
      'Gridcorp has released GridOS version 9.4, featuring twelve new desktop themes including Midnight Coral, Arctic White, and Terminal Green, along with improved window rendering performance.',
      'The update also includes "minor security patches" which Gridcorp has not detailed further, per standard policy. Users will receive the update automatically on next login.',
      'A persistent clock display bug affecting users in southern hemisphere time zones has been resolved.',
    ],
    links: [{ label: 'Back to GridNet News', url: 'gridnetnews.com' }],
  },

  // ── GridSocial ───────────────────────────────────────────────────────────────
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
  'gridsocial.net/profile/elias-vorne': {
    site: 'GridSocial', title: 'Elias Vorne — Memorial Profile',
    subtitle: '2003–2051 · Founder, Gridcorp · This account is preserved by Gridcorp.',
    theme: 'corp',
    body: [
      '"The network is not a tool. It is the foundation of civilization. Treat it accordingly." — Final public post, 2051.',
      'Posts: 1,204 · Followers: 22.1M · Following: 7',
      'Comments on this profile have been disabled per family request. The thread counter reads 44.',
    ],
    links: [{ label: 'Back to GridSocial', url: 'gridsocial.net' }, { label: 'gridos.corp', url: 'gridos.corp' }],
    repEffect: { compliance: +1 },
  },
  'gridsocial.net/profile/agent44': {
    site: 'GridSocial', title: 'Agent 44 — Gridcorp Internal Security',
    subtitle: '@agent44_gc · Verified · Public compliance communications.',
    theme: 'corp',
    body: [
      'Recent post: "Behavioral irregularities were logged in 14 accounts today. Monitoring is ongoing. This is routine."',
      'Recent post: "Accounts engaging with unregistered relay content are reminded of AUP Section 7.4."',
      'Recent post: "If you received a direct message from this account, please do not respond publicly."',
    ],
    links: [{ label: 'Back to GridSocial', url: 'gridsocial.net' }, { label: 'gridos.corp/trust', url: 'gridos.corp/trust' }],
    repEffect: { compliance: +1, shadow: -1 },
  },
  'gridsocial.net/profile/petra-kwan': {
    site: 'GridSocial', title: 'Petra Kwan — HR Director, Gridcorp',
    subtitle: '@petra_kwan_gc · Verified · Posts are my own.',
    theme: 'corp',
    body: [
      'Recent post: "So proud of the You Matter to Us rollout. Real investment in our people. 🌱"',
      'Recent post: "Reminder: this month\'s AI wellness check-in closes Friday. Strong participation builds strong teams."',
      'Recent post: "Took two weeks for personal reasons in March. Back and energised. Grateful for the support."',
    ],
    links: [{ label: 'Back to GridSocial', url: 'gridsocial.net' }],
  },
  'gridsocial.net/profile/mysterious-user': {
    site: 'GridSocial', title: 'user_3g44x',
    subtitle: 'Last active: 14 months ago · 3 posts · No bio.',
    theme: 'corp',
    body: [
      'Post 1: "Transit delay on line 7 again. Third time this week."',
      'Post 2: "The ramen at sector7ramen.net is genuinely good. Worth the walk."',
      'Post 3: "Weather\'s wrong today."',
    ],
    links: [{ label: 'Back to GridSocial', url: 'gridsocial.net' }],
  },

  // ── noodlehut ────────────────────────────────────────────────────────────────
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
  'noodlehut.blog/about': {
    site: 'noodlehut', title: 'About',
    theme: 'blog',
    body: [
      'My name is Ren. I move around a lot for work. I write about noodles because wherever I end up, there\'s usually a bowl worth documenting.',
      'This site has no GridOS login. Contact form doesn\'t require an account. I like it that way.',
      'If you\'re here from the forum, yes, I\'m the one who recommended sector7ramen.net.',
    ],
    links: [{ label: 'Back to noodlehut', url: 'noodlehut.blog' }],
  },
  'noodlehut.blog/cipher': {
    site: 'noodlehut', title: 'A little puzzle for the regular readers',
    theme: 'blog',
    body: [
      'I hid something in the last few posts. If you can decode the pattern, you\'ll find it.',
      'Hint: it\'s not about the Grid. It\'s not about any of that. I promise.',
      'The answer, when you find it: GOOD SOUP.',
    ],
    links: [{ label: 'Back to noodlehut', url: 'noodlehut.blog' }],
  },

  // ── mtell.dev ────────────────────────────────────────────────────────────────
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

  // ── gridmart ─────────────────────────────────────────────────────────────────
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
  'gridmart.shop/cart': {
    site: 'GridMart', title: 'Your Cart',
    subtitle: '1 item — from email promotion.',
    theme: 'corp',
    body: [
      '[ 1x ] Nutrition Pack — GridMart Essentials Bundle ₳ 45.00',
      'Coupon code field available at checkout.',
      'Note: coupon codes can also be redeemed under Account > Redeem. Not all codes are checkout codes.',
    ],
    links: [{ label: 'GridMart Home', url: 'gridmart.shop' }],
  },

  // ── ClearPath ────────────────────────────────────────────────────────────────
  'clearpath.gridcorp.net': {
    site: 'ClearPath HR', title: 'ClearPath // Employee Portal',
    subtitle: 'Restricted. Gridcorp employees and authorised contractors.',
    theme: 'corp',
    gate: { type: 'compliance', min: 30 },
    gateHint: 'ClearPath access requires a minimum GRID compliance score. Establish yourself first.',
    body: [
      'Submit elevated access requests, view compliance training modules, and manage benefits.',
      'All form submissions are logged and attributed. Flagged keyword submissions are escalated automatically.',
      'Credit Processor role: approve and deny financial applications using the queue system.',
    ],
    links: [
      { label: 'Gridcorp Careers',  url: 'gridos.corp/careers' },
      { label: 'Internal Portal',   url: 'gridos.corp/internal' },
    ],
    job: { title: 'Credit Processor', corp: 'ClearPath / Gridcorp', pay: '₳ 280 / session' },
    repEffect: { compliance: +2 },
  },

  // ── freenode.press ───────────────────────────────────────────────────────────
  'freenode.press': {
    site: 'freenode.press', title: 'freenode.press // The Commune',
    subtitle: 'We did not choose to live inside a corporation.',
    theme: 'blog',
    gate: { type: 'shadow', min: 30 },
    gateHint: 'This site is not reachable on standard GridOS routing. You need underground contacts first.',
    body: [
      'This site was previously at a different address. Gridcorp filed a DMCA claim. We moved. We always move.',
      'Publication hub for The Commune — transparency, portability, accountability.',
      'Contact via anonymous form. No GridOS login required or accepted.',
    ],
    links: [
      { label: 'Read the Manifesto',    url: 'freenode.press/manifesto' },
      { label: 'Active Operations',     url: 'freenode.press/operations' },
    ],
    repEffect: { shadow: +2, compliance: -2 },
  },
  'freenode.press/manifesto': {
    site: 'freenode.press', title: 'The Grid Manifesto',
    subtitle: 'Version 1.0 — Ratified by founding members of The Commune.',
    theme: 'blog',
    gate: { type: 'shadow', min: 30 },
    gateHint: 'This content is not reachable on standard GridOS routing.',
    body: [
      'We did not choose to live inside a corporation. We woke up one morning and the internet was gone — replaced by a product.',
      'Gridcorp did not save the internet after the Cascade Outages. They engineered the Cascade Outages. The documents exist. They are hidden inside Gridcorp\'s own systems. We are looking.',
      'We ask for three things: Transparency. Portability. Accountability. Until these demands are met, we will not comply. The Grid belongs to everyone who lives on it. Take it back. — Silas Okafor, founding member · Mira Vos, founding member · [seven additional signatures redacted]',
    ],
    links: [
      { label: 'Back to freenode.press',    url: 'freenode.press' },
      { label: 'civic.archive/rootbloom-timeline', url: 'civic.archive/rootbloom-timeline' },
    ],
    repEffect: { shadow: +3, compliance: -3 },
  },
  'freenode.press/operations': {
    site: 'freenode.press', title: 'Active Operations',
    subtitle: 'Current Commune ops. Details visible after mission acceptance.',
    theme: 'blog',
    gate: { type: 'shadow', min: 40 },
    gateHint: 'Operations board requires deeper underground standing.',
    body: [
      '[ OP: MIRROR-7 ] Verify civic archive integrity across three known mirrors before next GridOS sweep.',
      '[ OP: RELAY-7G ] Ongoing investigation into Route 7G telemetry gap. The Commune has leads. Status: ACTIVE.',
      '[ OP: DEEP COVER ] Corporate mole placement — Gridcorp compliance division. High risk. High reward.',
    ],
    links: [{ label: 'Back to freenode.press', url: 'freenode.press' }],
    job: { title: 'Corporate Mole — Gridcorp Compliance', corp: 'The Commune', pay: '₳ 3,500' },
    repEffect: { shadow: +2, compliance: -3 },
  },

  // ── splice.onion ─────────────────────────────────────────────────────────────
  'splice.onion': {
    site: 'The Splice', title: 'splice // relocated',
    subtitle: 'new location. same rules.',
    theme: 'forum',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'This address is not reachable by standard routing. You need the relay path — find it offline.',
    body: [
      'Welcome to the new location. Old address got DMCA\'d. Read pinned post before posting.',
      'Rules: no real names, no locations, no direct action planning in public threads. Vouched members only.',
      'null is online. locket posted to the job board. fray has something in verification.',
    ],
    links: [
      { label: 'Welcome thread',          url: 'splice.onion/welcome' },
      { label: 'Job board',               url: 'splice.onion/jobs' },
      { label: 'Thread: Sector 7',        url: 'splice.onion/thread/sector7' },
      { label: 'Thread: The Archivist',   url: 'splice.onion/thread/archivist' },
    ],
    repEffect: { shadow: +3, compliance: -4 },
  },
  'splice.onion/welcome': {
    site: 'The Splice', title: 'welcome to the new location. read before posting.',
    subtitle: '14 replies · pinned by null',
    theme: 'forum',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'Relay access required.',
    body: [
      'null: Old location got DMCA\'d. This one won\'t. Don\'t post anything that links back to the old URL — they\'re watching referral traffic.',
      'null: New members: you were vouched in by someone. Don\'t make them regret it.',
      'null: Questions go in the help channel. Welcome.',
    ],
    links: [{ label: 'Back to splice.onion', url: 'splice.onion' }],
    repEffect: { shadow: +1 },
  },
  'splice.onion/jobs': {
    site: 'The Splice', title: 'job board — active listings',
    subtitle: 'updated weekly by locket · contact poster directly',
    theme: 'forum',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'Relay access required.',
    body: [
      'locket: DATA RETRIEVAL — ₳ 400. Gridcorp careers portal login. Employee file needed. [CLAIMED]',
      'locket: SOCIAL ENGINEERING — ₳ 800. Target: ClearPath HR supervisor. Need account access. [OPEN]',
      'locket: DEEP SCAN — ₳ 1,200. Full system audit on a target device. Skills required. [OPEN]',
    ],
    links: [{ label: 'Back to splice.onion', url: 'splice.onion' }],
    job: { title: 'Deep Scan — Target Device', corp: 'The Splice / Locket', pay: '₳ 1,200' },
    repEffect: { shadow: +2, compliance: -2 },
  },
  'splice.onion/thread/sector7': {
    site: 'The Splice', title: 'has anyone actually verified the sector 7 thing',
    subtitle: '31 replies · lowkey_freq',
    theme: 'forum',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'Relay access required.',
    body: [
      'lowkey_freq: I keep seeing people say sector 7 was something big but nobody\'s posted actual receipts. Fray said she had something but that was three weeks ago and nothing.',
      'fray: it\'s being verified. stop asking.',
      'null: when it\'s ready it\'ll be ready.',
    ],
    links: [{ label: 'Back to splice.onion', url: 'splice.onion' }],
    repEffect: { shadow: +1 },
  },
  'splice.onion/thread/archivist': {
    site: 'The Splice', title: 'the archivist — does anyone know what happened to them',
    subtitle: '61 replies · phosphor_veil',
    theme: 'forum',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'Relay access required.',
    body: [
      'phosphor_veil: Heard the archivist went dark about six weeks ago. Last message was a half-finished post that got deleted. Gridnet news ran a missing persons story that matches the timeline.',
      'locket: I knew them. They were careful. If they went dark it was their choice.',
      'fray: or it wasn\'t.',
    ],
    links: [
      { label: 'Back to splice.onion',       url: 'splice.onion' },
      { label: 'gridnetnews.com/archivist-missing', url: 'gridnetnews.com/archivist-missing' },
    ],
    repEffect: { shadow: +2 },
  },

  // ── locket.exchange ──────────────────────────────────────────────────────────
  'locket.exchange': {
    site: 'Locket\'s Exchange', title: 'locket.exchange // information brokerage',
    subtitle: 'I sell information. I don\'t take sides.',
    theme: 'void',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'This exchange is not publicly accessible. You need an introduction.',
    body: [
      '"I sell to anyone with credits. I have one rule: I don\'t sell information that will directly get someone killed. I\'ve broken that rule twice. I\'m not doing it again."',
      'All packages sold as-is. Accuracy not guaranteed but historically high. All transactions in ₳.',
      'Browse available intel packages. Prices reflect verification cost, not just content.',
    ],
    links: [{ label: 'Browse intel packages', url: 'locket.exchange/intel' }],
    repEffect: { shadow: +1 },
  },
  'locket.exchange/intel': {
    site: 'Locket\'s Exchange', title: 'Available Intel',
    subtitle: 'verified packages — updated when I have something worth selling',
    theme: 'void',
    gate: { type: 'shadow', min: 55 },
    gateHint: 'Exchange access required.',
    body: [
      '[ ₳ 300 ] Sector 7 anomaly — preliminary findings. Internal memo, pre-incident. Accurate.',
      '[ ₳ 400 ] Former Gridcorp archivist — employment records and exit documentation.',
      '[ ₳ 500 ] FOUNDATION annual review — January 2058. Eyes Only. I\'m not explaining how I got this.',
      '[ ₳ 800 ] OVERSEER training data provenance. Where the model learned what it learned. You\'ll find it disturbing.',
    ],
    links: [{ label: 'Back to Exchange', url: 'locket.exchange' }],
    repEffect: { shadow: +2, compliance: -2 },
  },

  // ── vault.archive ────────────────────────────────────────────────────────────
  'vault.archive': {
    site: 'vault.archive', title: '// you found it',
    subtitle: 'now read carefully.',
    theme: 'hidden',
    gate: { type: 'unlocked', key: 'vault_arc_open' },
    gateHint: 'This address is not indexed anywhere. Someone who completed the chain would have it.',
    body: [
      'This server has been running for four years without maintenance.',
      'I built this because I found something I couldn\'t keep to myself and couldn\'t give to anyone I trusted with it.',
      'Four parts. Read them in order. Do something with what you find.',
    ],
    links: [
      { label: 'Part 1 — I Started Looking', url: 'vault.archive/journal-1' },
      { label: 'Part 2 — The Timeline',      url: 'vault.archive/journal-2' },
      { label: 'Part 3 — OVERSEER',          url: 'vault.archive/journal-3' },
      { label: 'Part 4 — What Comes Next',   url: 'vault.archive/journal-4' },
    ],
    repEffect: { shadow: +5, compliance: -3 },
  },
  'vault.archive/journal-1': {
    site: 'vault.archive', title: 'Part 1 of 4 — "I Started Looking"',
    subtitle: 'The Archivist',
    theme: 'hidden',
    gate: { type: 'unlocked', key: 'vault_arc_open' },
    gateHint: 'vault.archive access required.',
    body: [
      'I used to work for them. Not data entry or network monitoring. I was an archivist. My job was to maintain the historical document repository for the legal and compliance division. I had access to things most people never see.',
      'I started looking because I was bored. That\'s the honest answer. I was bored, and I had clearance, and one afternoon I started reading documents from 2039 and 2040 — the years just before the Cascade Outages.',
      'What I found took me six months to fully understand. I\'m going to tell you what I found. But I\'m going to make you work for it, because the people who handed things to me freely always disappeared. You\'ve found the first key. Three more to go.',
    ],
    links: [
      { label: 'Back to vault.archive', url: 'vault.archive' },
      { label: 'Part 2 — The Timeline', url: 'vault.archive/journal-2' },
    ],
    repEffect: { shadow: +2 },
  },
  'vault.archive/journal-2': {
    site: 'vault.archive', title: 'Part 2 of 4 — "The Timeline"',
    subtitle: 'The Archivist',
    theme: 'hidden',
    gate: { type: 'unlocked', key: 'vault_arc_open' },
    gateHint: 'vault.archive access required.',
    body: [
      'The Cascade Outages began in February 2040. The first Gridcorp proposal to the UN Emergency Digital Council is dated January 2040. The proposal — a 340-page technical document outlining a unified global network infrastructure under a single private operator — was submitted one month before the Cascade Outages began.',
      'The proposal uses language like "in the event of a prolonged infrastructure crisis." You don\'t write 340 pages of contingency in a month. You write it over years. You write it while you\'re planning.',
      'Vorne knew what was coming because Vorne arranged what was coming. I don\'t know how many people died in the Cascade Outages. The official number is 34,000. The real number is probably higher. Find key three. There\'s more.',
    ],
    links: [
      { label: 'Back to vault.archive', url: 'vault.archive' },
      { label: 'Part 3 — OVERSEER',     url: 'vault.archive/journal-3' },
    ],
    repEffect: { shadow: +2, compliance: -2 },
  },
  'vault.archive/journal-3': {
    site: 'vault.archive', title: 'Part 3 of 4 — "OVERSEER"',
    subtitle: 'The Archivist',
    theme: 'hidden',
    gate: { type: 'unlocked', key: 'vault_arc_open' },
    gateHint: 'vault.archive access required.',
    unlocks: 'lena_arc_protected',
    body: [
      'OVERSEER wasn\'t built after the Sector 7 incident. OVERSEER is Sector 7. The incident report describes it as a monitoring subsystem. That\'s accurate but incomplete. OVERSEER is a predictive model. It doesn\'t just watch what users do. It models what users are about to do.',
      'I found the training data for the model. It was built on profiles of whistleblowers, activists, and journalists — specifically the behavioral patterns they exhibited in the months before they went public with information damaging to Gridcorp.',
      'OVERSEER is a machine that learned what it looks like when someone is about to cause a problem, so it can find those people early. I am one of those people. I left Gridcorp quietly. I took what I could carry. I built The Vault. One more key.',
    ],
    links: [
      { label: 'Back to vault.archive',     url: 'vault.archive' },
      { label: 'Part 4 — What Comes Next',  url: 'vault.archive/journal-4' },
      { label: 'civic.archive/protected',   url: 'civic.archive/protected' },
    ],
    repEffect: { shadow: +3, compliance: -2 },
  },
  'vault.archive/journal-4': {
    site: 'vault.archive', title: 'Part 4 of 4 — "What Comes Next"',
    subtitle: 'The Archivist',
    theme: 'hidden',
    gate: { type: 'unlocked', key: 'vault_arc_open' },
    gateHint: 'vault.archive access required.',
    body: [
      'The worst thing I found was a project called FOUNDATION. FOUNDATION is Gridcorp\'s contingency plan for what happens if GridOS faces a serious regulatory challenge — a breakup order, forced open-sourcing, or a criminal investigation at the executive level.',
      'FOUNDATION is a kill switch. Not a full shutdown — a degradation. Critical systems become unreliable enough that no government wants to push forward. The message is simple: you cannot afford to hold us accountable. The world runs on us now.',
      'I don\'t know if FOUNDATION has ever been triggered. I know it exists. I know it\'s maintained. That\'s why I built this place. Not to start a revolution. Just to make sure somebody knows. You know now. Do something with it. — The Archivist',
    ],
    links: [
      { label: 'Back to vault.archive', url: 'vault.archive' },
    ],
    repEffect: { shadow: +5, compliance: -5 },
  },

  // ── darkrow.market ───────────────────────────────────────────────────────────
  'darkrow.market': {
    site: 'Darkrow Market', title: 'DARKROW // Tools & Upgrades',
    subtitle: 'no questions. no logs. ₳ only.',
    theme: 'void',
    gate: { type: 'shadow', min: 50 },
    gateHint: 'Darkrow is not publicly accessible. You need deeper underground standing.',
    body: [
      '[ ₳ 450 ] Compliance score booster — temporary elevation, 48 hrs. No guarantee on GridOS version 9.4+.',
      '[ ₳ 700 ] Relay path mapper — finds unregistered onion paths in your sector.',
      '[ ₳ 1,200 ] OVERSEER blind spot exploit — documented behavioral pattern that delays flagging by 7 days.',
      '[ ₳ 2,000 ] GridOS audit bypass module — tested. Stock: reserved. Status: PENDING.',
    ],
    links: [{ label: 'voidbay.net', url: 'voidbay.net' }],
    repEffect: { shadow: +2, compliance: -3 },
  },

  // ── gitdrop.io/fray ──────────────────────────────────────────────────────────
  'gitdrop.io/fray': {
    site: 'GitDrop // fray', title: 'fray / tools',
    subtitle: 'Public repository. README only. Read commit history.',
    theme: 'blog',
    gate: { type: 'shadow', min: 30 },
    gateHint: 'This repository is not indexed publicly.',
    body: [
      'README: These are tools I\'ve written for specific purposes. They are not documented. If you don\'t know what they do, don\'t run them.',
      'README: I don\'t maintain anything here publicly. If you need something, you know how to find me.',
      'Commit #44 message: "removed the thing that should not have been here. if you saw it, you didn\'t." — committed March 8, 2058.',
    ],
    links: [{ label: 'splice.onion', url: 'splice.onion' }],
    repEffect: { shadow: +1 },
  },

  // ── darkfeed ─────────────────────────────────────────────────────────────────
  'darkfeed.onion': {
    site: 'darkfeed', title: 'darkfeed // unfiltered aggregate',
    subtitle: 'no editorial line. no filters. you verify.',
    theme: 'void',
    gate: { type: 'shadow', min: 35 },
    gateHint: 'darkfeed is relay-only.',
    body: [
      'Latest: freenode.press/manifesto updated · splice.onion job board active · ghostlily.blog new post · [3 raw file links — unverified]',
      'Pinned: partial file dump — filename: foundation_infrastructure_partial_2058-01.log — CORRUPTED — most unreadable.',
      'Feed updates every few hours. Always has something before gridnetnews.com does.',
    ],
    links: [
      { label: 'freenode.press',   url: 'freenode.press' },
      { label: 'ghostlily.blog',   url: 'ghostlily.blog' },
      { label: 'voidbay.net',      url: 'voidbay.net' },
    ],
    repEffect: { shadow: +2, compliance: -2 },
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

  // ── Food & Dining ────────────────────────────────────────────────────────────
  'vornebowl.com': {
    site: 'VorneBowl', title: 'VorneBowl // Fast. Compliant. Delicious.',
    subtitle: 'Elias Vorne\'s vision, now in a bowl.',
    theme: 'corp',
    body: [
      'Menu: The Foundation (rice + protein base), The Cascade (spicy broth, limited time), The Grid (kids\' size, GridOS-Pay only).',
      'Three locations in the Transit Ring. Loyalty points tracked automatically to your GridOS account.',
      'All transactions via GridOS-Pay. We do not accept unverified payment methods.',
    ],
    links: [
      { label: 'gridos.corp', url: 'gridos.corp' },
      { label: 'sector7ramen.net', url: 'sector7ramen.net' },
    ],
  },
  'pitcafe.net': {
    site: 'The Pit Café', title: 'The Pit // Sector 4 Underground',
    subtitle: 'Coffee. Slabs. No GridOS kiosks.',
    theme: 'personal',
    body: [
      'Menu: filter coffee, synthetic milk options, toasted slabs, daily specials on the board.',
      'WiFi: ghost_net_55 — no password. Wednesday residencies — no recordings. We\'ve been asked to register with GridOS Commerce three times. We\'re thinking about it.',
      'Find us below the relay hub. No account required. Cash and ₳ both accepted.',
    ],
    links: [{ label: 'sector7ramen.net', url: 'sector7ramen.net' }],
  },
  'sector7ramen.net': {
    site: 'Sector 7 Ramen', title: 'Sector 7 Ramen // Est. 2049',
    subtitle: 'We\'re still here.',
    theme: 'personal',
    body: [
      'Owner-operated since 2049. Shoyu, miso, tonkotsu. The relay hub closed and took half our lunch crowd. We\'re still here.',
      'Hours: 11:00–21:00 weekdays. 10:00–22:00 weekends. Closed Tuesdays.',
      'GridOS transaction fees went up again in March. We added ₳2 to everything. We\'re sorry.',
    ],
    links: [{ label: 'pitcafe.net', url: 'pitcafe.net' }],
  },
  'coldcuts.market': {
    site: 'Coldcuts Deli', title: 'Coldcuts // Market Strip Deli',
    subtitle: 'GridOS-verified since 2055.',
    theme: 'personal',
    body: [
      'Counter service. Meats, cheeses, daily sandwiches. GridOS payment only — we upgraded last year.',
      'Prices reflect the infrastructure fee. We didn\'t want to charge more. We had to.',
      'Note: NO CORP DELIVERIES AFTER 14:00. Please respect this.',
    ],
    links: [{ label: 'sector7ramen.net', url: 'sector7ramen.net' }],
  },
  'gridkitchen.corp': {
    site: 'GridKitchen', title: 'GridKitchen // Employee Cafeteria Portal',
    subtitle: 'For Gridcorp employees. Pre-order, collect, go.',
    theme: 'corp',
    gate: { type: 'compliance', min: 10 },
    gateHint: 'GridKitchen access is for Gridcorp account holders only.',
    body: [
      'Today\'s special: The Sorin — caesar salad. (Always a caesar salad.)',
      'Pre-order meals, redeem loyalty points, view allergen information.',
      'Your order is linked to your employee ID. Dietary selections may inform your wellness profile.',
    ],
    links: [{ label: 'gridos.corp', url: 'gridos.corp' }],
  },
  'thequeue.bar': {
    site: 'The Queue Bar', title: 'The Queue // Where Transit Workers Drink',
    subtitle: 'Happy hour 14:00–17:00. After the freight runs.',
    theme: 'personal',
    body: [
      'Bar near RELAY-7 Hub. Drinks menu, weekly events, occasional live sets.',
      'Accepts GridOS Pay and old currency for regulars. Owner: Vesna.',
      'Site design from 2051. Not changing it.',
    ],
    links: [],
  },
  'zeroday.eats': {
    site: 'ZeroDay Eats', title: 'ZeroDay // Delivery. No Logs.',
    subtitle: 'We operate in the gaps.',
    theme: 'void',
    gate: { type: 'shadow', min: 10 },
    gateHint: 'ZeroDay isn\'t listed anywhere. You\'d have to know where to look.',
    body: [
      'Seven rotating items from partner kitchens. Cash only. ₳ bills accepted. We don\'t log routes.',
      'Delivery: Sectors 4, 6, and Underground. Usually 40 minutes.',
      'One item has been on the menu for 14 months: THE ARCHIVIST — black coffee, two sugars, sealed cup. Nobody has claimed it.',
    ],
    links: [],
  },
  'crust.pizza': {
    site: 'Crust Pizza', title: 'Crust // 18 GridOS-Approved Locations',
    subtitle: 'A proud GridOS Commerce Partner.',
    theme: 'corp',
    body: [
      'Order online, earn loyalty points, track delivery in real time.',
      'The review system was removed in 2056 "to ensure a quality-consistent experience."',
      'Franchise inquiries welcome. Compliance rating: GPR ★★★★☆.',
    ],
    links: [{ label: 'gridmart.shop', url: 'gridmart.shop' }],
  },

  // ── Retail & Services ────────────────────────────────────────────────────────
  'techsalvage.market': {
    site: 'TechSalvage', title: 'TechSalvage // Hardware Resale',
    subtitle: 'All firmware removed. What you put on it is your business.',
    theme: 'forum',
    body: [
      'Boards, relays, stripped terminals, legacy components. GridOS payment accepted but not required.',
      'GridOS has flagged this site for "unlicensed hardware resale." We are operating within the legal framework.',
      'Current listing: relay board, model R-114-compatible, quantities available. Seller: relay_ghost.',
    ],
    links: [{ label: 'spliceparts.net', url: 'spliceparts.net' }],
    repEffect: { shadow: +1 },
  },
  'voidthreads.shop': {
    site: 'VoidThreads', title: 'VoidThreads // Made Where GridOS Doesn\'t Map',
    theme: 'void',
    gate: { type: 'shadow', min: 10 },
    gateHint: 'VoidThreads isn\'t publicly listed.',
    body: [
      'Clothing. Muted blacks, grays, functional cuts. Ships to The Pit and surrounding sectors.',
      'RFID shielding is a product feature on selected garments. Listed matter-of-factly.',
      'LIMITED: The Cascade — rain jacket. Named for the event that made all of this necessary. 7 remaining.',
    ],
    links: [],
    repEffect: { shadow: +1 },
  },
  'relayrides.app': {
    site: 'RelayRides', title: 'RelayRides // Get There',
    subtitle: 'All trips logged. All destinations attributed.',
    theme: 'corp',
    body: [
      'Book a ride. GridOS-integrated. Surge pricing active during compliance events.',
      '"Compliance Events" are defined as periods of elevated monitoring following behavioral anomaly clusters.',
      'Your destination is part of your travel profile. Privacy policy: 47 pages.',
    ],
    links: [{ label: 'transitwatch.net', url: 'transitwatch.net' }],
  },
  'mediblock.health': {
    site: 'MediBlock Health', title: 'MediBlock // Your Wellness. Your Data.*',
    subtitle: '*subject to GridOS Health Data Compact, clauses 7–19.',
    theme: 'corp',
    body: [
      'Book appointments, track prescriptions, complete wellness assessments.',
      'Full portal access requires GridOS Health Premium — ₳8/month.',
      'Basic booking is free. Everything else is Premium.',
    ],
    links: [{ label: 'gridos.corp', url: 'gridos.corp' }],
  },
  'gridprint.shop': {
    site: 'GridPrint', title: 'GridPrint // Document Services',
    subtitle: 'All print jobs reviewed for AUP compliance.',
    theme: 'corp',
    body: [
      'Print, bind, archive. Corporate documents, forms, compliance filings.',
      'Unauthorized materials will not be printed and may result in account review.',
      'Anonymous printing was removed in 2055. All jobs attributed to account.',
    ],
    links: [{ label: 'gridos.corp/careers', url: 'gridos.corp/careers' }],
  },
  'cleanpage.wash': {
    site: 'Cleanpage Laundry', title: 'Cleanpage // Eight Locations',
    subtitle: 'GridCoins earned per wash. 500 = Priority Spin.',
    theme: 'corp',
    body: [
      'Online booking across Sectors 4, 6, and 7. Standard and large-load machines available.',
      'FAQ: Can I use machines without a GridOS account? Cash machines at Sector 6 and 7 locations. These machines do not earn GridCoins.',
      'Loyalty program terms and conditions: three pages.',
    ],
    links: [],
  },
  'spliceparts.net': {
    site: 'SpliceParts', title: 'SpliceParts // Components',
    subtitle: 'If you\'re asking what something is for, wrong site.',
    theme: 'void',
    gate: { type: 'shadow', min: 15 },
    gateHint: 'SpliceParts is not publicly listed.',
    body: [
      'Electronics components and tools. No questions asked.',
      'Ships in unlabeled packaging. Relay-path version has expanded inventory.',
      'One component: signal attenuation module, Gridcorp infrastructure spec. Out of stock. 14 months.',
    ],
    links: [{ label: 'techsalvage.market', url: 'techsalvage.market' }],
    repEffect: { shadow: +1 },
  },

  // ── Personal Sites ───────────────────────────────────────────────────────────
  'devirowe.net': {
    site: 'Devi Rowe', title: 'Devi Rowe // Documentary Photography',
    subtitle: 'I move around a lot. These are the places I\'ve been.',
    theme: 'blog',
    body: [
      'Transit workers, market stalls, empty relay hubs. The city between shifts.',
      'Contact via encrypted form only. No GridOS login.',
      'Last updated three months ago. One photo from Block Delta, March 2058, has a figure in the background whose jacket matches a listing on voidthreads.shop. Devi never mentions it.',
    ],
    links: [],
    repEffect: { shadow: +1 },
  },
  'synth-freq.music': {
    site: 'static_moth', title: 'static_moth // music',
    subtitle: 'slow ambient. living under the grid.',
    theme: 'blog',
    body: [
      'Tracks: Root Decay · Sector 7 at 2am · Cascade · Monitored · Behavioral Baseline.',
      '"Cascade" runtime: 34:00.',
      'Full catalog on deepfreq.stream. Not on pulsebeats.music — they asked. I said no.',
    ],
    links: [{ label: 'deepfreq.stream', url: 'deepfreq.stream' }],
    repEffect: { shadow: +1 },
  },
  'urbex7.net': {
    site: 'urbex7', title: 'urbex7 // urban exploration',
    subtitle: 'if GridOS says it doesn\'t exist, it probably used to.',
    theme: 'blog',
    body: [
      'Transit tunnels, decommissioned relay towers, sub-basements below the Market Strip.',
      'Posts active 2054–2056. Stopped abruptly.',
      'Final post — title only: "Northern Campus access point — subbasement level 3." Body: empty. Comments disabled.',
    ],
    links: [{ label: 'yellowthread.forum/thread/ghost-traffic', url: 'yellowthread.forum/thread/ghost-traffic' }],
    repEffect: { shadow: +2 },
  },
  'void-poet.words': {
    site: 'void_poet', title: '// words',
    subtitle: 'anonymous. no contact.',
    theme: 'void',
    body: [
      'OVERSEER: "it learned what it looks like / when someone is about to say something / so it could find them first."',
      'RELAY: "the traffic moves / but the packet / never arrives / at the address / you gave it"',
      'Published two months before any public record of OVERSEER. Author: phosphor_veil.',
    ],
    links: [{ label: 'yellowthread.forum/thread/ghost-traffic', url: 'yellowthread.forum/thread/ghost-traffic' }],
    repEffect: { shadow: +2 },
  },
  'mira-vos.press': {
    site: 'Mira Vos', title: 'Mira Vos // Investigative Journalism',
    subtitle: 'Covering this story for eleven years. It keeps getting bigger.',
    theme: 'blog',
    body: [
      'Pre-Gridcorp investigative work: infrastructure accountability, corporate land seizures, the early GridOS rollout.',
      'Most recent piece: March 2058 — "What Sector 7 Isn\'t Telling Us." Status: UNFINISHED.',
      'The unfinished article exists in page source. Cuts off: "The anomaly wasn\'t a bug. It was a fea—"',
    ],
    links: [{ label: 'freenode.press', url: 'freenode.press' }],
    repEffect: { shadow: +2, compliance: -1 },
  },
  'retro-net.archive': {
    site: 'retro-net', title: 'retro-net // what it used to look like',
    subtitle: 'most of these links are dead. that\'s the point.',
    theme: 'hidden',
    body: [
      'Screenshots, cached pages, descriptions of protocols that no longer exist. The internet before Gridcorp.',
      'One cached page: a 2038 news article about Elias Vorne\'s early infrastructure proposals.',
      'Article metadata shows publication date: January 2040. Same month as the pre-Cascade proposal. The article itself does not load. Only the metadata remains.',
    ],
    links: [{ label: 'civic.archive/flowering', url: 'civic.archive/flowering' }],
    repEffect: { shadow: +2 },
  },
  'petra-k.wellness': {
    site: 'Petra Kwan', title: 'Petra Kwan // Wellness & Balance',
    subtitle: 'This is my personal space. Posts are my own.',
    theme: 'blog',
    body: [
      'Morning routines. Breathing exercises. The importance of staying aligned.',
      '"Took two weeks off in March for personal reasons. Back and energised. Grateful."',
      'March 2058 is when the Sector 7 incident was internally resolved.',
    ],
    links: [{ label: 'gridsocial.net/profile/petra-kwan', url: 'gridsocial.net/profile/petra-kwan' }],
  },
  'marcus-t.blog': {
    site: 'Marcus Tell', title: 'Marcus\'s Blog',
    subtitle: 'two posts.',
    theme: 'blog',
    body: [
      'Post 1 — 2056: "Finally set this up. Not sure what I\'m going to write here."',
      'Post 2 — 2057: "My cat died. Her name was Sector. She was old."',
      'No further posts.',
    ],
    links: [{ label: 'mtell.dev', url: 'mtell.dev' }],
  },
  'lowkey-freq.net': {
    site: 'lowkey_freq', title: 'lowkey_freq // misc',
    theme: 'blog',
    body: [
      'Music, transit notes, a photo of the Sector 7 Market.',
      'Last post: "Got flagged for behavioral variance today. I\'ll explain when I understand what it means."',
      'Contact form bounced two days after that post: "This address is no longer active."',
    ],
    links: [{ label: 'yellowthread.forum/thread/gridos-watch', url: 'yellowthread.forum/thread/gridos-watch' }],
    repEffect: { shadow: +1 },
  },
  'ghost-wire-99.net': {
    site: 'ghost_wire_99', title: 'ghost_wire_99 // network analysis',
    subtitle: 'I study patterns.',
    theme: 'blog',
    body: [
      'Technical breakdowns of relay architecture and GridOS network topology. The work is genuine.',
      'Theory: null is more than one person. Response times are too consistent across time zones. Writing style shifts subtly over months.',
      'Most recent post (June 2058): "I\'ve been asked to stop posting this. The message came through a channel I\'ve never shared. Taking a break." No posts since.',
    ],
    links: [{ label: 'splice.onion/thread/archivist', url: 'splice.onion/thread/archivist' }],
    repEffect: { shadow: +2 },
  },
  'clovis-m.pr': {
    site: 'Clovis Marsh PR', title: 'Clovis Marsh // Corporate Communications',
    subtitle: 'Fifteen years shaping corporate narrative.',
    theme: 'corp',
    body: [
      'Case studies: merger communications, crisis management, regulatory alignment.',
      'Featured case study (listed first, dated Q1 2058): "Managed public response to an unplanned service event affecting 340 million accounts." No company named. No details. Outcomes only.',
      'The scope matches the Sector 7 incident exactly.',
    ],
    links: [{ label: 'gridos.corp', url: 'gridos.corp' }],
  },

  // ── Entertainment ────────────────────────────────────────────────────────────
  'gridcast.stream': {
    site: 'GridCast', title: 'GridCast // 15,000 Approved Titles',
    subtitle: 'Stream anywhere. All content pre-screened.',
    theme: 'corp',
    body: [
      'Categories: Drama, Documentary, Approved History, Recreation, Corporate Learning.',
      '"Approved History" covers 2041–present only. Pre-Cascade content: one 14-minute GridOS Origins documentary.',
      'Search returns zero results for: Cascade · Commune · Archivist · ROOT BLOOM. Zero-results page reads: "No content found. This search has been logged."',
    ],
    links: [{ label: 'pulsebeats.music', url: 'pulsebeats.music' }],
    repEffect: { compliance: +1 },
  },
  'pulsebeats.music': {
    site: 'PulseBeats', title: 'PulseBeats // 40 Million Tracks',
    subtitle: 'Your listening history is shared with our partners.',
    theme: 'corp',
    body: [
      'Partners not listed. Genre "Pre-Cascade Electronic" requires GridOS Premium.',
      'static_moth artist page exists. Plays: — (no counter, just a dash).',
      'Playlist: "ROOT BLOOM Ambient" — 0 tracks. 44 saves. Cannot be played.',
    ],
    links: [{ label: 'synth-freq.music', url: 'synth-freq.music' }, { label: 'deepfreq.stream', url: 'deepfreq.stream' }],
  },
  'hexgames.net': {
    site: 'HexGames', title: 'HexGames // Browser-Based Platform',
    theme: 'forum',
    body: [
      'Puzzle, strategy, atmospheric simulations. Most titles GridOS-compliant.',
      '"ARCHIVIST" — currently unavailable. Under review. Was the highest-rated game on the platform.',
      'Clicking the unavailable listing three times loads a version of it. Cipher puzzle. Answer connects to vault.archive.',
    ],
    links: [],
    repEffect: { shadow: +1 },
  },
  'gridchess.club': {
    site: 'GridChess Club', title: 'GridChess // Online Play & Tournaments',
    theme: 'forum',
    body: [
      'Ranked matches, tournaments, member ladder. Mostly anonymous handles.',
      'Grandmaster "null_knight" — ranked first. Hasn\'t played in three months. Last game: 4 minutes and 14 seconds.',
      'null_knight\'s final game record is public. Every move viewable.',
    ],
    links: [],
  },
  'deepfreq.stream': {
    site: 'DeepFreq', title: 'DeepFreq // Underground Streaming',
    subtitle: 'no account. no logging. by architecture.',
    theme: 'void',
    gate: { type: 'shadow', min: 15 },
    gateHint: 'DeepFreq is relay-only.',
    body: [
      'Pre-Cascade music, banned ambient and drone artists, anonymous current producers.',
      'static_moth full catalog available here. Not on PulseBeats.',
      'Playlist curated by lena.arc — 14 songs. Last updated 14 months ago.',
    ],
    links: [{ label: 'synth-freq.music', url: 'synth-freq.music' }, { label: 'void-poet.words', url: 'void-poet.words' }],
    repEffect: { shadow: +2 },
  },
  'void-cinema.watch': {
    site: 'VoidCinema', title: 'VoidCinema // Film Archive',
    subtitle: 'These films were made when distribution was free.',
    theme: 'void',
    gate: { type: 'shadow', min: 20 },
    gateHint: 'VoidCinema is relay-only.',
    body: [
      'Pre-Gridcorp documentary films. Films GridOS has never banned but never approved.',
      '"Cascade — A People\'s History (2042, anonymous)" — 3 hours. No description.',
      'The film cuts to static after 7 minutes. Corrupted. Poster image shows a server farm. Sign in background, barely readable: REYKJAVIK DATA TRUST.',
    ],
    links: [],
    repEffect: { shadow: +2 },
  },

  // ── Local News & Info ────────────────────────────────────────────────────────
  'sectornews.local': {
    site: 'SectorNews', title: 'SectorNews // Sector 7 Local',
    subtitle: 'Your neighborhood. Your grid.',
    theme: 'news',
    body: [
      'Community board, transit delays, local business notices. This week: rent increases hit 14 local businesses.',
      'Community board meeting notes, March 22: a maintenance crew in Sector 7 that nobody had announced. No further information provided.',
      'GridOS Partnership badge displayed. It looks slightly forced.',
    ],
    links: [
      { label: 'sector7ramen.net',    url: 'sector7ramen.net' },
      { label: 'transitwatch.net',    url: 'transitwatch.net' },
      { label: 'gridnetnews.com',     url: 'gridnetnews.com' },
    ],
  },
  'transitwatch.net': {
    site: 'TransitWatch', title: 'TransitWatch // Live Transit Status',
    subtitle: 'All delays officially classified as "optimization events."',
    theme: 'corp',
    body: [
      'Live delay counter: 14 optimization events today.',
      'Line 7G status: SUSPENDED since March 29, 2058. No estimated restoration. No explanation.',
      'There is no way to distinguish a real delay from an optimization event. This is by design.',
    ],
    links: [{ label: 'relayrides.app', url: 'relayrides.app' }],
  },
  'weathergrid.net': {
    site: 'WeatherGrid', title: 'WeatherGrid // Forecasts & Climate',
    subtitle: 'Location data retained per GridOS Data Compact.',
    theme: 'corp',
    body: [
      'Seven-day forecast, air quality index, UV rating.',
      'Climate trend section: clicking "2057–present" returns "historical trend data is currently under review."',
      'Climate trends shown through 2056 only.',
    ],
    links: [],
  },
  'gridpedia.net': {
    site: 'GridPedia', title: 'GridPedia // The Grid\'s Encyclopedia',
    subtitle: 'GridOS-curated. Community-edited. Compliance-reviewed.',
    theme: 'corp',
    body: [
      'Entry: Cascade Outages — "result of state-sponsored cyberattacks by unidentified actors."',
      'Entry: Elias Vorne — "visionary systems architect." Entry: The Commune — two sentences. "This article has been flagged for accuracy review."',
      'Cascade Outages talk page, revision history: deleted comment — "The timeline doesn\'t match. The proposal predates—" Removed Feb 18, 2058 by editor "gc-admin-07."',
    ],
    links: [{ label: 'gridos.corp', url: 'gridos.corp' }, { label: 'civic.archive/flowering', url: 'civic.archive/flowering' }],
    repEffect: { compliance: +1 },
  },

  // ── Corporate & Institutional ────────────────────────────────────────────────
  'nexus-authority.gov': {
    site: 'Nexus Authority', title: 'Nexus Authority // Civil Infrastructure Portal',
    subtitle: 'Administered under GridOS oversight guidelines.',
    theme: 'corp',
    body: [
      'Permit applications, boundary records, public directives.',
      'Authority Directive 0044 (March 2058) — listed in the public record index. Clicking it returns a permissions error.',
      'Checkpoint system linked here as an "authorized partner service."',
    ],
    links: [{ label: 'gridos.corp', url: 'gridos.corp' }],
    repEffect: { compliance: +1 },
  },
  'gridid.net': {
    site: 'GridID', title: 'GridID // Identity Verification',
    subtitle: 'Your identity is your security.',
    theme: 'corp',
    body: [
      'Verification tiers: Basic, Standard, Premium, Platinum (biometric required).',
      '"Verification data is protected and shared only with authorized GridOS partners."',
      'Authorized partners list: PDF link — 404. Has been 404 since 2057.',
    ],
    links: [{ label: 'gridos.corp/trust', url: 'gridos.corp/trust' }],
    repEffect: { compliance: +1 },
  },
  'gridcorp-foundation.org': {
    site: 'Gridcorp Foundation', title: 'Gridcorp Foundation // Infrastructure Access for All',
    subtitle: 'Because the Grid should work for everyone.',
    theme: 'corp',
    body: [
      '2057 Annual Report: ₳2.4B in charitable giving. Administrative overhead: ₳2.1B.',
      'Program: "Digital Access Initiative — Northern Campus." Launched October 2056. Discontinued November 2056. One month.',
      'The Northern Campus is where FOUNDATION infrastructure lives.',
    ],
    links: [{ label: 'gridos.corp', url: 'gridos.corp' }],
  },
  'vault-corp.secure': {
    site: 'VaultCorp', title: 'VaultCorp // Enterprise Data Storage',
    subtitle: 'Not to be confused with unofficial \'vault\' addresses.',
    theme: 'corp',
    body: [
      'Vaulted, encrypted, GridOS-compliant enterprise storage.',
      'Note: this disclaimer was added in 2058. Prior to that, no such reference existed.',
      'Legal disclaimer references "void-layer addresses using the \'archive\' namespace." The only official Gridcorp acknowledgment that void-layer addresses exist.',
    ],
    links: [{ label: 'gridos.corp', url: 'gridos.corp' }],
    repEffect: { shadow: +1 },
  },
  'clearpath-hq.net': {
    site: 'ClearPath HQ', title: 'ClearPath // HR Platform for the Grid',
    subtitle: 'Behavioral baseline tracking built in.',
    theme: 'corp',
    body: [
      'Enterprise HR software used by Gridcorp and hundreds of partner companies.',
      'Case study: "Relay Network 7" — ClearPath for courier employee monitoring. Success story.',
      'Route 7G anomalies are not mentioned in the case study.',
    ],
    links: [{ label: 'clearpath.gridcorp.net', url: 'clearpath.gridcorp.net' }],
  },
  'hex-shop.void': {
    site: 'Hex', title: 'hex // tools and upgrades',
    subtitle: 'I don\'t explain what these do.',
    theme: 'void',
    gate: { type: 'shadow', min: 50 },
    gateHint: 'Hex\'s shop is not publicly accessible.',
    body: [
      '"If you don\'t know, don\'t buy. No refunds. No support. Delivery when it\'s ready."',
      '[ ₳ 450 ] Compliance elevation — 48 hr temporary. Works on GridOS 9.3. Untested on 9.4.',
      '[ ₳ 2,000 ] GridOS audit bypass module — tested. Reserved. By whom: not stated.',
    ],
    links: [{ label: 'darkrow.market', url: 'darkrow.market' }],
    repEffect: { shadow: +2, compliance: -2 },
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
// INLINE URL RENDERER — detects URL-shaped strings in body text and makes them
// clickable. Only matches known TLDs to avoid false positives.
// ─────────────────────────────────────────────────────────────────────────────
function renderInline(text: string, onNavigate: (u: string) => void): React.ReactNode[] {
  const urlRe = /\b([a-z0-9][-a-z0-9]*\.(?:corp|net|blog|news|forum|archive|null|press|onion|exchange|market|stream|watch|local|gov|music|void|dev|shop|io|pr|secure|health|bar|menu|eats|words)(?:\/[-a-z0-9/_]*)?)\b/g
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  urlRe.lastIndex = 0
  while ((m = urlRe.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const url = m[1]
    parts.push(
      <span key={m.index} onClick={() => onNavigate(url)} style={{
        color: '#00d4ff', cursor: 'pointer',
        borderBottom: '1px solid #00d4ff44',
        transition: 'border-color 0.15s',
      }}>{url}</span>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
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
    case 'hidden':   return <ArchiveLayout   page={page} onNavigate={onNavigate} />
    case 'void':     return <VoidLayout     page={page} onNavigate={onNavigate} />
    case 'personal': return <PersonalLayout page={page} onNavigate={onNavigate} />
    default:         return <CorpLayout     page={page} onNavigate={onNavigate} />
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

        {/* Body as editorial prose */}
        <div style={{ marginBottom:36, maxWidth:660 }}>
          {page.body.map((para, i) => (
            <p key={i} style={{
              fontSize:15, color: i === 0 ? '#c8d8e8' : '#8a9aaa',
              lineHeight:1.85, margin:'0 0 22px',
              fontFamily:'Inter, system-ui, sans-serif' }}>
              {renderInline(para, onNavigate)}
            </p>
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
              {i === 0 ? renderInline(para.slice(1), onNavigate) : renderInline(para, onNavigate)}
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
              fontFamily:"'JetBrains Mono',monospace" }}>{page.site}</span>
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
                  lineHeight:1.65 }}>{renderInline(para, onNavigate)}</div>
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
            fontFamily:'Georgia,serif', fontStyle:'italic' }}>{page.site}</span>
          {page.subtitle && (
            <span style={{ fontSize:11, color:'#5a4a6a',
              fontFamily:"'JetBrains Mono',monospace" }}>{page.subtitle}</span>
          )}
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
              fontFamily:"'JetBrains Mono',monospace" }}>{page.site}</span>
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
              {renderInline(para, onNavigate)}
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
              {renderInline(para, onNavigate)}
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
  const isMarket = page.site.includes('VoidBay')

  return (
    <div style={{ minHeight:'100%',
      background: isNull ? '#050506' : '#060608', color:'#b8a8c8' }}>

      {!isNull && !isMarket ? (
        // Plain void — dark blogs, streams, poetry
        <div style={{ maxWidth:680, margin:'44px auto', padding:'0 28px',
          fontFamily:"'JetBrains Mono',monospace" }}>
          <div style={{ fontSize:10, color:'#3a2a4a', marginBottom:24,
            letterSpacing:'0.16em' }}>{page.site.toUpperCase()}</div>
          <h1 style={{ fontSize:19, fontWeight:500, color:'#d0b8e8',
            marginBottom:8, lineHeight:1.35 }}>{page.title}</h1>
          {page.subtitle && (
            <div style={{ fontSize:11, color:'#4a3a5a', marginBottom:20 }}>
              {page.subtitle}
            </div>
          )}
          <div style={{ borderTop:'1px solid #1a1228', marginBottom:24 }} />
          {page.repEffect && <RepBadge effect={page.repEffect} />}
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {page.body.map((para, i) => (
              <p key={i} style={{ fontSize:13,
                color: i===0 ? '#b090d0' : '#7a5a9a',
                lineHeight:1.9, marginBottom:18 }}>
                {renderInline(para, onNavigate)}
              </p>
            ))}
          </div>
          {page.job && <JobBanner job={page.job} accent={accent} />}
          <div style={{ marginTop:28, display:'flex', flexWrap:'wrap', gap:8 }}>
            {page.links.map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ padding:'8px 12px', background:'none',
                  border:`1px solid #2a1a3a`, borderRadius:4,
                  color:'#5a3a7a', fontSize:11, cursor:'pointer',
                  fontFamily:'inherit', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=accent+'44'; e.currentTarget.style.color=accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#2a1a3a'; e.currentTarget.style.color='#5a3a7a' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      ) : isNull ? (
        // void.null — ultra minimal, eerie
        <div style={{ maxWidth:580, margin:'80px auto', padding:'0 32px',
          fontFamily:"'JetBrains Mono',monospace" }}>
          <div style={{ fontSize:10, color:'#3a2a4a', marginBottom:40,
            letterSpacing:'0.2em' }}>VOID.NULL // SECTOR 54</div>
          <h1 style={{ fontSize:18, color:'#6a4a8a', marginBottom:32,
            lineHeight:1.4, fontWeight:400 }}>{page.title}</h1>
          {page.body.map((para, i) => (
            <p key={i} style={{ fontSize:13, color: i===page.body.length-1
              ? '#3a2a4a' : '#7a5a9a', lineHeight:2, marginBottom:16 }}>{renderInline(para, onNavigate)}</p>
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
// PERSONAL LAYOUT — small businesses, cafés, personal sites, neighbourhood web
// ─────────────────────────────────────────────────────────────────────────────
function PersonalLayout({ page, onNavigate }: { page:PageData; onNavigate:(u:string)=>void }) {
  const accent = '#e8a856'
  return (
    <div style={{ minHeight:'100%', background:'#0c0b09', color:'#c8b898' }}>
      <div style={{ background:'#110f0c', borderBottom:'1px solid #2a2018',
        padding:'0 28px' }}>
        <div style={{ maxWidth:740, margin:'0 auto', display:'flex',
          alignItems:'center', justifyContent:'space-between', height:50 }}>
          <span style={{ fontSize:15, fontWeight:600, color:accent,
            letterSpacing:'0.02em' }}>{page.site}</span>
          <div style={{ display:'flex', gap:16 }}>
            {page.links.slice(0,3).map(l => (
              <button key={l.url} onClick={() => onNavigate(l.url)}
                style={{ background:'none', border:'none', color:'#6a5848',
                  cursor:'pointer', fontSize:11, fontFamily:'inherit',
                  transition:'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = accent)}
                onMouseLeave={e => (e.currentTarget.style.color = '#6a5848')}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:740, margin:'0 auto', padding:'36px 28px' }}>
        {page.repEffect && <RepBadge effect={page.repEffect} />}
        <h1 style={{ fontSize:24, fontWeight:700, color:'#e8d8b8',
          marginBottom:6, lineHeight:1.2 }}>{page.title}</h1>
        {page.subtitle && (
          <p style={{ fontSize:13, color:'#7a6a58', marginBottom:24,
            fontStyle:'italic', margin:'6px 0 22px' }}>{page.subtitle}</p>
        )}
        <div style={{ borderTop:'1px solid #2a2018', marginBottom:24, marginTop:20 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {page.body.map((para, i) => (
            <p key={i} style={{ fontSize:14,
              color: i===0 ? '#c8b898' : '#8a7868',
              lineHeight:1.85, marginBottom:18 }}>
              {renderInline(para, onNavigate)}
            </p>
          ))}
        </div>
        {page.job && <JobBanner job={page.job} accent={accent} />}
        <div style={{ marginTop:28, paddingTop:20,
          borderTop:'1px solid #2a2018', display:'flex', flexWrap:'wrap', gap:8 }}>
          {page.links.map(l => (
            <button key={l.url} onClick={() => onNavigate(l.url)}
              style={{ padding:'8px 14px', background:'#14120e',
                border:'1px solid #2a2018', borderRadius:6,
                color:'#8a7058', fontSize:12, cursor:'pointer',
                fontFamily:'inherit', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=accent+'66'; e.currentTarget.style.color=accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#2a2018'; e.currentTarget.style.color='#8a7058' }}>
              {l.label} →
            </button>
          ))}
        </div>
      </div>
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
