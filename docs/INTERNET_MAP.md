# GRID-OS — Internet Map
> Complete reference for every page, IP, link graph, access gate, page content, secrets, and interactables.
> Status: ✅ Built | 🔲 Planned | 🔒 Key-only

---

## Access Tiers

| Tier | Name | Gate |
|------|------|------|
| 0 | Public Surface | None — open to all |
| 1 | Corp Intranet | `compliance ≥ 65` |
| 2 | Shadow Web | `shadow ≥ 30` |
| 2b | Deep Shadow | `shadow ≥ 55` |
| 3 | Relay-Hopped | Physical location + terminal required |
| 4 | Key-Locked | One-time puzzle key or story trigger |

---

## IP Address Schema

```
Corp cluster          10.44.x.x      (Official GridOS infrastructure)
Public surface        172.16.x.x     (Registered public sites)
Underground relay     relay://M-xx   (Accessed via relay jump, no stable IP)
Void layer            void://xx      (Trigger-unlocked only)
Physical hack nodes   10.44.51.x     (Terminal connect from correct location)
Filler / local        172.16.xx.x    (Registered small-web, commercial, personal)
```

---

## Layer 0 — Public Surface Web

### `gridos.corp` ✅
```
IP:       10.44.1.1
Theme:    corp (cyan)
Links to: gridos.corp/investors · gridos.corp/trust · gridos.corp/careers
Rep:      compliance +1 on visit
```
**Content:** GridOS infrastructure statistics, compliance messaging, corporate timeline. "94% of all consumer and enterprise systems." Links to careers and investor pages. Footer has a compliance disclosure in 7-point text.

---

### `gridos.corp/investors` ✅
```
IP:       10.44.1.2
Theme:    corp
Links to: gridos.corp · gridos.corp/trust · pulse.news
```
**Content:** Q-series shareholder letters. "Vertical integration remains our strongest moat." Graph of quarterly user growth with no Y-axis label. Mentions "ghost traffic in unmanaged public nodes" as a market risk — seeds ghostlily.blog discovery.

---

### `gridos.corp/trust` ✅
```
IP:       10.44.1.3
Theme:    corp
Links to: gridos.corp · yellowthread.forum/thread/gridos-watch
Rep:      compliance +1
```
**Content:** "Security is freedom." GridOS scans for "dissident signal clustering." Lists what constitutes an AUP violation in careful legal language. Final line: *"Privacy is a managed privilege, not a default condition."*

---

### `gridos.corp/careers` ✅
```
IP:       10.44.1.4
Theme:    corp
Links to: gridos.corp · ghostlily.blog
Rep:      compliance +1
Job:      Junior Behavioral Auditor — ₳420/task
```
**Content:** Open roles: Content Integrity Operator, Credit Risk Verifier, Junior Behavioral Auditor, Node Sanitation Associate. "All hires undergo identity mesh review and loyalty scoring." The ghostlily.blog link appears in a "see what our employees say" section — an ironic editorial choice.

---

### `gridos.corp/internal` ✅
```
IP:       10.44.1.10
Gate:     compliance ≥ 65
Links to: gridos.corp/compliance · gridos.corp
Rep:      compliance +2 · shadow -1
```
**Content:** Active compliance review queue depth. Internal memo 441-C: *"ROOT BLOOM events are to be logged as 'routine service decay' in all public-facing reports."* Note that all analyst queries are attributed and retained for 180 days. After vault.archive/journal-3 is read, a new line appears: *"OVERSEER advisory 0044: behavioral baseline drift detected in 3,412 accounts this cycle. Elevated monitoring applied."*

---

### `gridos.corp/compliance` ✅
```
IP:       10.44.1.11
Gate:     compliance ≥ 65
Links to: gridos.corp/internal · gridos.corp
Rep:      compliance +3 · shadow -2
Job:      Compliance Queue Auditor — ₳600/session
```
**Content:** Queue depth 1,204 cases. Average review 8.2 minutes. Top flagged domains this cycle: civic.archive/\*, ghostlily.blog, yellowthread.forum/thread/\*. *"Note: analysts who consistently close cases with 'No Threat' are flagged for quality review."* The job is real, but gaming it eventually triggers Agent 44 email.

---

### `pulse.news` ✅
```
IP:       172.16.4.1
Theme:    news (amber)
Links to: pulse.news/markets/gridos · pulse.news/outages · ghostlily.blog
```
**Content:** Market indices. GridOS shares up. "An anonymous watchdog claims public archive pages are being quietly rewritten overnight." Three headlines, the most mundane one links to the most interesting story.

---

### `pulse.news/markets/gridos` ✅
```
IP:       172.16.4.2
Theme:    news
Links to: pulse.news · yellowthread.forum/thread/gridos-watch
```
**Content:** Institutional confidence high. Short sellers being squeezed. *"Unverified chatter suggests internal sabotage is being misreported as 'routine service decay.'"* The phrase matches Memo 441-C exactly.

---

### `pulse.news/outages` ✅
```
IP:       172.16.4.3
Theme:    news
Links to: pulse.news · ghostlily.blog/root-bloom
```
**Content:** Authentication failures across low-priority districts. Payment freezes. GridOS says "non-systemic." A leaked screenshot references "ROOT BLOOM" — first time this term appears in a public-accessible page.

---

### `pulse.news/dissent` ✅
```
IP:       172.16.4.4
Theme:    news
Links to: pulse.news · civic.archive/flowering
Rep:      shadow +1 · compliance -1
```
**Content:** Column archived. Last post 14 months ago. *"The author went quiet after their identity score was recalculated."* Final entry argued the network became its own state. Three inline links are dead. One redirects to gridos.corp/trust. The author was silenced by OVERSEER — never stated explicitly.

---

### `yellowthread.forum` ✅
```
IP:       172.16.12.44
Theme:    forum (green)
Links to: yellowthread.forum/thread/gridos-watch · /thread/ghost-traffic · /jobs
```
**Content:** Public index. Threads sorted by activity. Moderation banner: *"This forum is registered with GridOS. Posts are retained per the Unified Access Compact."* Despite the warning, users are blunt. Hot threads include the gridos-watch thread and ghost-traffic.

---

### `yellowthread.forum/thread/gridos-watch` ✅
```
IP:       172.16.12.45
Rep:      shadow +1
Links to: yellowthread.forum · gridos.corp/trust
```
**Content:** 847 replies. Pinned post: *"What does GridOS actually track?"* Replies range from dismissive to paranoid. One post from user "lowkey_freq": *"I got flagged for 'behavioral variance review' yesterday. First time I've seen that phrase."* — same phrase used in Splice Thread 4 and OVERSEER docs. lowkey_freq hasn't posted since.

---

### `yellowthread.forum/thread/ghost-traffic` ✅
```
IP:       172.16.12.46
Rep:      shadow +1
Links to: yellowthread.forum · civic.archive/rootbloom-timeline
```
**Content:** Thread about anomalous traffic patterns. Someone mapped unregistered relay paths. One post from user "phosphor_veil" mentions the URL void.null/54 — *"found this address in a data dump. loads something. I'm not explaining what."* phosphor_veil is the same handle from Splice Thread 7. The post has since been edited.

---

### `yellowthread.forum/jobs` ✅
```
IP:       172.16.12.47
Job:      Signal Trace — ₳750, high risk
Links to: yellowthread.forum
```
**Content:** Informal job board. Posted by anonymous handles. Most listings are vague. Signal Trace job: *"Track a specific packet across three relay hops. Don't ask what's in it."* One anonymous drop-box reference has the same node ID as ghost-net-55.

---

### `ghostlily.blog` ✅
```
IP:       172.16.20.88
Theme:    blog (violet)
Links to: ghostlily.blog/root-bloom · ghostlily.blog/missing-records
Rep:      shadow +1 · compliance -1
Secrets:  Page source: <!-- last updated 14:22 --> matches OVERSEER anomaly time exactly
```
**Content:** Anonymous blogger documenting censorship and infrastructure inconsistencies. Dry, careful tone — *"I'm not guessing. I'm documenting."* Recent posts focus on civic.archive pages disappearing overnight. No author name anywhere on the site.

---

### `ghostlily.blog/root-bloom` ✅
```
IP:       172.16.20.89
Rep:      shadow +2 · compliance -1
Links to: ghostlily.blog · civic.archive/rootbloom-timeline
```
**Content:** Deep investigation of ROOT BLOOM. *"The phrase appears in internal GridOS logs before it appears anywhere else — which means whatever it is, they knew about it before we did."* References relay node R-114 by codename. First public connection between ROOT BLOOM and physical infrastructure.

---

### `ghostlily.blog/missing-records` ✅
```
IP:       172.16.20.90
Rep:      shadow +1
Job:      Archive Integrity Check — ₳500
Links to: ghostlily.blog · civic.archive/flowering
```
**Content:** Lists 7 missing census record IDs. Notes they were available three weeks ago. *"Not 404. Not moved. Just gone."* The record IDs cross-reference with FOUNDATION memo's removed names — only visible to players who find Memo 4.

---

### `gridnetnews.com` 🔲
```
IP:       172.16.4.7
Theme:    news
Links to: all /article subpages
Rep:      compliance +1 on first visit
```
**Content:** State news archive. Clean layout, corporate photography. Featured story is always pro-GridOS. Sidebar has a live "compliance index" showing how many AUP violations were processed today. The number climbs in real time. No author bylines — all articles credited to "GridNet Editorial Staff."

---

### `gridnetnews.com/sector7-maintenance` 🔲  *(Clue — Article 1)*
```
IP:       172.16.4.8
```
**Content:** *"Gridcorp's operations team has confirmed scheduled maintenance on Sector 7 nodes will extend for a third consecutive week, citing 'complex subsystem dependencies.'"* Standard corporate non-answer. Date: March 22 — aligns with OVERSEER isolation date in the classified incident report. Players who cross-reference catch it.

---

### `gridnetnews.com/gridmart-expansion` 🔲  *(Red Herring — Article 2)*
```
IP:       172.16.4.9
```
**Content:** GridMart expands same-day delivery to 40 new markets. CEO Priya Dantus quoted extensively. The new autonomous courier fleet operates through the "GridMart Logistics API." Upbeat, pure corporate PR. No information of any value whatsoever.

---

### `gridnetnews.com/commune-arrest` 🔲  *(Clue — Article 3)*
```
IP:       172.16.4.10
```
**Content:** An individual linked to Commune activity arrested. *"Accessed restricted document repositories using credentials obtained through social engineering."* The technique described is identical to the Social Engineer job mechanic. Players who've done that job recognise the fingerprint immediately.

---

### `gridnetnews.com/q1-profits` 🔲  *(Red Herring — Article 4)*
```
IP:       172.16.4.11
```
**Content:** Record Q1 earnings. CFO Tomás Reyes bullish. The exact figure contradicts the stat in Clovis Marsh's Q3 Report email (E-22). Players who notice are chasing a manufactured inconsistency. It's deliberate confusion, not a clue.

---

### `gridnetnews.com/archivist-missing` 🔲  *(Clue — Article 5)*
```
IP:       172.16.4.12
```
**Content:** *"A former Gridcorp compliance department employee has failed to make contact for over three weeks."* Family quotes: *"stressed about work matters."* Gridcorp declines to comment. Eight years of service, left quietly in early 2058. Timeline matches The Archivist exactly. Players who've found The Vault will feel this.
After vault.archive is visited: a comment appears at the bottom from user "lowkey_freq" — *"I knew them. This isn't missing. This is silenced."* Then the comment disappears on next load.

---

### `gridnetnews.com/gridsocial-500m` 🔲  *(Red Herring — Article 6)*
```
IP:       172.16.4.13
```
**Content:** GridSocial milestone. 500 million accounts. Average session 47 minutes. Quote from VP Elena Holt. No useful information. Pure world texture. Seeds gridsocial.net as a place to visit.

---

### `gridnetnews.com/splice-dmca` 🔲  *(Clue — Article 7)*
```
IP:       172.16.4.14
```
**Content:** Splice-linked forum taken offline via DMCA. Gridcorp cited "unauthorized distribution of proprietary GridOS documentation." Cryptic GridSocial posts suggest the community has "relocated." The old address is dead. Players need the relay path from ghost-net-55 to find the new one.

---

### `gridnetnews.com/wellness` 🔲  *(Red Herring — Article 8)*
```
IP:       172.16.4.15
```
**Content:** Gridcorp wellness initiative "You Matter to Us." Monthly AI check-ins. Anonymous feedback portal. *"Participation is strongly encouraged and will be factored into annual performance reviews."* Petra Kwan's byline confirms her as a real NPC. The "anonymous" portal is obviously not.

---

### `gridnetnews.com/northern-campus-power` 🔲  *(Clue — Article 9)*
```
IP:       172.16.4.16
```
**Content:** Residents report unusual power draw near Gridcorp's Northern Campus for six weeks. Gridcorp denies any connection to local infrastructure. An energy regulator notes patterns *"consistent with a large-scale compute operation running at unusual hours."* Players who read Archivist Part 4 connect this to FOUNDATION live-testing.

---

### `gridnetnews.com/gridos-update-9-4` 🔲  *(Red Herring — Article 10)*
```
IP:       172.16.4.17
```
**Content:** GridOS 9.4 update. Twelve new desktop themes including Terminal Green. Performance fixes. Clock display bug resolved. *"Minor security patches"* not detailed per policy. Ominous but leads nowhere. Terminal Green is the aesthetic of this very OS.

---

### `gridsocial.net` 🔲
```
IP:       172.16.8.1
Theme:    corp-lite (social, cleaner than corp pages)
Links to: all /profile/* pages
```
**Content:** GridOS's official social platform. Clean, blue-tinted. Activity feed shows NPC posts. *"500 million connections. What will you say?"* All posts are reviewed for AUP compliance before display — banner in the footer clarifies this. Most users write carefully. One account, user_3g44x, last active 14 months ago, 3 posts, bio blank — the "mysterious user" red herring. It means nothing.

---

### `gridsocial.net/profile/elias-vorne` 🔲  *(Red Herring)*
```
Links in: gridsocial.net
```
**Content:** Preserved memorial profile. Official Gridcorp maintenance. Posts are corporate mission statements. A locked comment thread has 44 replies — *"comments disabled per family request."* The number 44 matches Agent 44 — flavor only. His photo looks kind. That's the horror.

---

### `gridsocial.net/profile/agent44` 🔲
```
Rep:      compliance +1 on visit
```
**Content:** Public account for Gridcorp Internal Security's public-facing handle. Posts vague compliance reminders. *"Behavioral irregularities were logged in 14 accounts today. This is not unusual."* Profile header image has a barely-visible watermark resolving to a case number matching Memo 5's Splice monitoring cluster.

---

### `gridsocial.net/profile/petra-kwan` 🔲  *(Red Herring)*
**Content:** GridOS HR Director's public profile. Wellness content, team photos, a lot of motivational formatting. Genuinely seems to believe what she's posting. Reposted "You Matter to Us" seven times this month. No secrets. Pure world texture.

---

### `gridsocial.net/profile/mysterious-user` 🔲  *(Red Herring)*
**Content:** user_3g44x. 3 posts. Last active 14 months ago. Posts: a transit complaint, a noodle shop recommendation (sector7ramen.net), a weather observation. Bio blank. No connections listed. Absolutely nothing here. It looks like a lead. It is not.

---

### `noodlehut.blog` 🔲
```
IP:       172.16.33.15
Theme:    blog
Links to: noodlehut.blog/about · noodlehut.blog/cipher
Links in: email E-23 · gridsocial.net/profile/mysterious-user
```
**Content:** Amateur food blog. Seven posts. Consistent photography style — broth in different lights. Warm, personal writing. Most recent post: *"The relay hub location closed. Their shoyu was the best in Sector 4. This is a loss."* Completely sincere. No sinister subtext.

---

### `noodlehut.blog/about` 🔲  *(Red Herring)*
**Content:** *"My name is Ren. I move around a lot for work. I write about noodles because it's the one thing that stays the same wherever I go."* Photo of a bowl. Contact form requires GridOS login. That's it.

---

### `noodlehut.blog/cipher` 🔲  *(Red Herring — S-02)*
**Content:** A post titled *"A little puzzle for the regular readers."* Appears to be an encoded message — substitution cipher, moderate difficulty. Decodes to: **GOOD SOUP**. That is the entire payload. Players who persist get a journal entry: *"Sometimes a noodle blog is just a noodle blog."* Rewards patience with a joke.

---

### `mtell.dev` 🔲
```
IP:       172.16.33.22
Theme:    blog (personal, barely styled)
Links to: gridos.corp/careers
Links in: email E-02 (Marcus offhandedly mentions his site)
Secrets:  PAGE SOURCE contains: <!-- old pw: Tl_22!march -->
          Used in S-01 to access a GridMart logistics panel
```
**Content:** Marcus Tell's personal portfolio. Three project descriptions that are all minor IT tools. A photo of him that's clearly cropped from a work photo. *"Eleven years at Gridcorp IT. I keep things running."* The site hasn't been updated in two years. The password comment is in the `<head>` section, a leftover from a login form he never finished.

---

### `gridmart.shop` 🔲
```
IP:       172.16.45.1
Theme:    corp-lite (commerce)
Links to: gridmart.shop/cart · gridmart.shop/orders
Links in: email E-20
```
**Content:** GridOS's integrated marketplace. "Frictionless. Compliant. Yours." Product categories: Home, Nutrition, Personal Tech, Infrastructure Supplements. All purchases require GridOS account and are logged. One specific cart item from email E-20 has a coupon code that, when entered at the *redeem* field (not checkout), unlocks a Splice job listing. Entering it at checkout just says "invalid."

---

### `clearpath.gridcorp.net` 🔲
```
IP:       10.44.1.20
Gate:     compliance ≥ 30
Job:      Credit Processor — ₳280/session
Links to: gridos.corp/careers · gridos.corp/internal
```
**Content:** Employee-facing HR portal. Application forms, compliance training modules, benefit summaries. The interface is clean but overwhelming — seventeen tabs, most greyed out for non-employees. Credit Processor job: approve/deny financial applications via a form. Submitting a form with keywords "ROOT BLOOM," "OVERSEER," or certain NPC names triggers Agent 44 email (E-14) within one in-game day.

---

## Layer 1 — Corporate Intranet (compliance ≥ 65)

*(Existing pages documented above — gridos.corp/internal and gridos.corp/compliance)*

---

## Layer 2 — Shadow Web (shadow ≥ 30)

### `civic.archive/flowering` ✅
```
IP:       172.16.20.93
Theme:    hidden (amber/brown — degraded)
Gate:     shadow ≥ 30
Rep:      shadow +1
Job:      Recover Flowering District Census — ₳1200, high risk
```
**Content:** Recovered municipal records for the Flowering District, pre-2048. Deteriorated formatting — missing images, broken tables. Seven census record IDs are absent with no explanation. Cross-referencing their IDs with FOUNDATION Memo 4's "two names removed" line is the connection — only visible to players who have Memo 4.

---

### `voidbay.net` ✅
```
IP:       172.16.77.1
Theme:    void (purple)
Gate:     shadow ≥ 30
Rep:      shadow +1 · compliance -1
```
**Content:** Grey market exchange. No GridOS account required — GridOS ID optional for escrow. *"All listings are information only. VoidBay does not facilitate, endorse, or record transactions."* Listing categories: Credentials, Tools, Data, Services, Other. The "Other" category is the one that matters.

---

### `voidbay.net/listings` ✅
```
Gate:     shadow ≥ 30
Rep:      shadow +1 · compliance -1
Job:      Source Suppressor Script — ₳1100/run
```
**Content:** Active listings. One: *"Access credentials, corp-tier, Gridcorp internal, unverified provenance, ₳600, no questions."* Buying it yields a file confirming the OVERSEER anomaly timeline — from Memo 2. Source Suppressor Script job is here. Most listings are mundane: burner accounts, proxy tools, old license keys.

---

### `voidbay.net/anon-drops` ✅
```
Gate:     shadow ≥ 40
```
**Content:** One-time-read anonymous messages. Listed by drop ID, submission timestamp, and word count only. Drop ID DROP-7G-04 contains the Route 7G telemetry gap data from Memo 3 — the 40-minute blackout. Ties to S-01 (Lost Courier) if found before accepting the mission. Reading a drop removes it from the list.

---

### `freenode.press` 🔲
```
IP:       relay://M-04-88-C
Theme:    blog/manifesto (deep red)
Gate:     shadow ≥ 30 · relay path required
Links to: freenode.press/manifesto · freenode.press/operations
Links in: email E-12
Rep:      shadow +2 · compliance -2
```
**Content:** The Commune's publication hub. *"We did not choose to live inside a corporation."* Landing page has the opening line of the manifesto and a notice: *"This site was previously hosted at [REDACTED]. Gridcorp filed a DMCA claim. We moved. We always move."* Contact form for new members. No GridOS login — anonymous by design.

---

### `freenode.press/manifesto` 🔲
```
Gate:     shadow ≥ 30
Rep:      shadow +3 · compliance -3
```
**Content:** Full text of The Grid Manifesto (LORE_ASSETS.md). Signed by Silas Okafor, Mira Vos, and *"[seven additional signatures redacted for security]."* Two of the redacted names are recoverable via civic.archive/protected after puzzle completion. One is confirmed to be a former Gridcorp archivist — The Archivist. The manifesto accuses Gridcorp of engineering the Cascade Outages. This is true.

---

### `freenode.press/operations` 🔲
```
Gate:     shadow ≥ 40
Job:      Corporate Mole — ₳3500 (M-06 trigger)
```
**Content:** Active Commune operations board. Current ops listed by codename only — no details visible until mission is accepted. One operation references *"Relay 7G — ongoing investigation."* The Commune is independently investigating the same Route 7G gap from Memo 3. They're getting close. One op has status: *"BURNED — do not attempt."*

---

## Layer 2b — Deep Shadow (shadow ≥ 55)

### `civic.archive/rootbloom-timeline` ✅
```
IP:       172.16.20.94
Gate:     shadow ≥ 55
Rep:      shadow +2
Links to: civic.archive/flowering · ghostlily.blog/root-bloom
```
**Content:** Detailed ROOT BLOOM incident timeline compiled from recovered logs and source leaks. Places the first ROOT BLOOM event in October 2056 — same month as FOUNDATION's annual live-test, one year prior to the most recent test in Memo 4. Suggests an annual cadence. The document ends mid-sentence — *"The pattern becomes clear when you look at which nodes were affe—"*

---

### `splice.onion` 🔲
```
IP:       relay://M-07-44-F
Theme:    forum (dark terminal green)
Gate:     shadow ≥ 55 · relay path (from ghost-net-55 or freenode.press/operations)
Rep:      shadow +3 · compliance -4 on first access
```
**Content:** The Splice's private forum. Spartan layout — no images, no colors, monospace text. Pinned post from null: *"Welcome to the new location. Read before posting."* Thread list includes active operations, job board, lore discussions. Null's account shows *"last active: 12 minutes ago."* Always.

---

### `splice.onion/welcome` 🔲
**Content:** Thread 1 from LORE_ASSETS.md (null's relocation post). *"Don't post anything that links back to the old URL — they're watching referral traffic."* The old URL resolves to a Gridcorp takedown notice bearing a case number that matches the monitoring cluster ID in Agent 44's Memo 5.

---

### `splice.onion/jobs` 🔲
```
Jobs:     SOCIAL ENGINEERING — ₳800 (S-04)
          DEEP SCAN — ₳1200 (M-05)
```
**Content:** Thread 3 from LORE_ASSETS.md (Locket's job board). Listings include DATA RETRIEVAL (marked CLAIMED — by whom, unknown), SOCIAL ENGINEERING (OPEN), COURIER (flavor), DEEP SCAN (OPEN). *"Contact the poster directly, not in this thread."* The claimed DATA RETRIEVAL job matters later — someone got there first.

---

### `splice.onion/thread/sector7` 🔲
**Content:** Thread 2 from LORE_ASSETS.md. User lowkey_freq demanding verification of the Sector 7 incident. Fray: *"it's being verified. stop asking."* Null: *"when it's ready it'll be ready."* Timestamp is three weeks before Fray's tool drop email (E-13) — the verification she was running.

---

### `splice.onion/thread/archivist` 🔲
**Content:** Thread 7 from LORE_ASSETS.md. phosphor_veil asks what happened to the Archivist. Locket: *"I knew them. They were careful. If they went dark it was their choice."* Fray: *"or it wasn't."* Locket: *"or it wasn't."*
After vault.archive is first visited, null pins a reply: *"they left something. find it."* The reply does not appear before vault.archive is loaded.

---

### `locket.exchange` 🔲
```
IP:       relay://M-11-99-A
Theme:    void-adjacent (dark, transactional)
Gate:     shadow ≥ 55 · email E-11
Rep:      shadow +1
```
**Content:** Pay-to-access information brokerage. *"I sell information. I don't take sides. I don't take requests for information that will directly get someone killed — I've broken that rule twice, and I'm not doing it again."* Locket's PGP key in the footer comment field contains a hidden URL hint for vault.archive. Prices listed in ₳.

---

### `locket.exchange/intel` 🔲
```
Gate:     shadow ≥ 55 · ₳ per package
```
**Content:** Available intel packages. Prices and descriptions:
- *Sector 7 anomaly preliminary* — ₳300 — yields Memo 2
- *FOUNDATION annual review* — ₳500 — yields Memo 4
- *Archivist employment records* — ₳400 — confirms Archivist timeline
- *OVERSEER training data source* — ₳800 — unlocks Archivist Part 3 context

Buying all four changes Locket's greeting on next visit: *"You know enough to be dangerous. That usually ends one of two ways."*

---

## Layer 3 — Terminal / Relay Nodes

*(See Terminal Hack Node Summary section below)*

---

## Layer 4 — Key-Locked

### `civic.archive/protected` ✅
```
IP:       172.16.20.95
Gate:     key: lena_arc_protected (from Archivist Part 3)
Rep:      shadow +3
```
**Content:** Protected records from lena.arc — two recoverable redacted Commune founding signatures. One is a former Gridcorp archivist. Document dated 2039 — one year before the Cascade Outages — is a data backup request filed by someone who knew what was coming.

---

### `vault.archive` 🔲
```
IP:       void://vault (rotating)
Theme:    hidden/void
Gate:     key: vault_arc_open (after all 4 Archivist puzzle steps)
Rep:      shadow +5 · compliance -3
Secrets:  Page source: <!-- this server has been running for 4 years without maintenance -->
```
**Content:** Sparse page. Black background, amber text. *"You found it. Now read carefully."* Four journal links. Page load is intentionally slow — ~3 seconds — with no loading indicator. The silence is part of it.

---

### `vault.archive/journal-1` — *"I Started Looking"* 🔲
**Content:** Full text from LORE_ASSETS.md Part 1. *"I started looking because I was bored. That's the honest answer."* Hex string embedded in body text — partial key for Part 2. Tone is measured. Not angry. Not frightened. Just committed.

---

### `vault.archive/journal-2` — *"The Timeline"* 🔲
**Content:** Full text from LORE_ASSETS.md Part 2. The Cascade Outage pre-proposal. *"The proposal uses language like 'in the event of a prolonged infrastructure crisis.' You don't write 340 pages of contingency in a month."* Players can verify the founding date discrepancy against gridos.corp.

---

### `vault.archive/journal-3` — *"OVERSEER"* 🔲
```
Unlocks:  key lena_arc_protected → civic.archive/protected
```
**Content:** Full text from LORE_ASSETS.md Part 3. OVERSEER as a predictive dissent model trained on whistleblowers. *"I found the training data. It was built on profiles of people who were about to cause a problem."* After reading this, gridos.corp/internal gains a new line about behavioral baseline drift.

---

### `vault.archive/journal-4` — *"What Comes Next"* 🔲
```
Unlocks:  void-77 terminal node · M-08 (Gridfall)
Rep:      shadow +5 · compliance -5
```
**Content:** Full text from LORE_ASSETS.md Part 4. FOUNDATION kill switch. *"Not a full shutdown. A degradation. Critical systems become unreliable enough that no government wants to push forward."* The message is simple: you cannot afford to hold us accountable. The world runs on us now.

---

### `void.null/54` ✅
```
IP:       void://54
Gate:     key: null54_escalated
```
**Content:** First visit: *"we saw you"* Second visit: *"we're still watching."* Third visit: blank page. Source on third visit: `<!-- GC-INT-0054: account flagged. monitoring elevated. do not engage. -->`

---

---

# FILLER INTERNET — The Lived-In Web

> Sites that exist to make the internet feel like a real place.
> Most have no story value. Some have small easter eggs. All have atmosphere.

---

## Food & Dining

### `vornebowl.com` 🔲
```
IP:       172.16.101.1
Theme:    corp-lite (fast food, warm orange)
Links in: sector7ramen.net (competitor mention), gridmart.shop
```
**Content:** Fast food chain named for Elias Vorne. *"Elias Vorne believed infrastructure should be for everyone. We believe bowls should too."* Menu items: The Foundation (rice + protein), The Cascade (spicy broth), The Grid (kids' size). Three locations in the Transit Ring. All GridOS-Pay only. Rewards points tracked automatically.
*Secrets: None. The corporate co-opting of the founder's name for a fast food chain is the joke.*

---

### `pitcafe.net` 🔲
```
IP:       172.16.101.2
Theme:    blog (warm, slightly dim)
Links in: locations.ts (The Pit is a game location)
```
**Content:** The Pit underground café, Sector 4. Hand-coded site, slightly janky. Menu: coffee, synthetic milk options, toasted slabs. WiFi listed as *"ghost_net_55 — no password."* Events section mentions *"Wednesday residencies — no recordings."* Contact form goes to a ProtonMail equivalent. Doesn't require GridOS login. Small note at the bottom: *"We've been asked to register with GridOS Commerce three times. We're thinking about it."*
*Secrets: The WiFi name matches the ghost-net-55 hack node in locations.ts — players who scan The Pit in the City Map see this.*

---

### `sector7ramen.net` 🔲
```
IP:       172.16.101.3
Theme:    blog (personal, warm)
Links in: gridsocial.net/profile/mysterious-user (Ren recommended it)
```
**Content:** Owner-operated ramen shop, Residential Block 7. Written by the owner, whose name is Dae. *"We've been here since 2049. The relay hub closed and took half my lunch crowd with it. We're still here."* Menu board photo. Hours. A note: *"GridOS transaction fees went up again in March. We added ₳2 to everything. We're sorry."*
*Secrets: None. Pure human texture. The relay hub closure mentioned is the same Relay-7 transit node from the Courier map.*

---

### `coldcuts.market` 🔲
```
IP:       172.16.101.4
Theme:    corp-lite (clean, commercial)
Links in: none
```
**Content:** Market Strip deli, Sector 7. GridOS-verified meats and cheeses. Online ordering for pickup. *"We upgraded to GridOS Commerce last year. Prices reflect the infrastructure fee."* Staff of four. Photo shows the counter — there's a handwritten sign behind it that says *"NO CORP DELIVERIES AFTER 14:00."* No context given.
*Secrets: None. The sign is flavor.*

---

### `gridkitchen.corp` 🔲
```
IP:       10.44.1.50
Theme:    corp (sterile)
Links in: gridos.corp/careers (mentioned in employee benefits section)
Gate:     compliance ≥ 10 (Gridcorp employee accounts only)
```
**Content:** Official Gridcorp employee cafeteria portal. Pre-order meals, track loyalty points, view allergen info. *"Your order is linked to your employee ID. Dietary data may inform your wellness profile."* Today's special: "The Sorin" (named after Director Yael Sorin) — a caesar salad. Always a caesar salad.
*Secrets: The loyalty point system has a redemption tier called "Foundation Member" at 10,000 points. Clicking it does nothing — the reward is listed as TBD.*

---

### `thequeue.bar` 🔲
```
IP:       172.16.101.5
Theme:    blog (dim, no-frills)
Links in: none
```
**Content:** Bar near RELAY-7 Hub. *"Where transit workers drink after shift."* Events calendar, drinks menu, happy hour (14:00–17:00, after the freight runs). Accepts GridOS Pay and *"old currency for regulars."* Owner's name is Vesna. The site hasn't been redesigned since 2051 and she's not interested in changing that.
*Secrets: None. There's a sticky note graphic on the homepage that says "CLOSED WEDNESDAYS — don't ask."*

---

### `zeroday.eats` 🔲
```
IP:       172.16.101.6
Theme:    void-adjacent (sparse, functional)
Gate:     shadow ≥ 10 (just finding the URL is the gate — not in any public links)
Links in: Mentioned in splice.onion/jobs comments
```
**Content:** Underground food delivery. No GridOS account required. *"Cash only. ₳ bills accepted. We don't log routes."* Menu of seven items from rotating partner kitchens. Delivery radius: sectors 4, 6, and Underground. *"We operate in the gaps."*
*Secrets: One menu item is listed as "THE ARCHIVIST — black coffee, two sugars, sealed cup." It's been on the menu for 14 months. Whoever ordered it hasn't claimed it.*

---

### `crust.pizza` 🔲
```
IP:       172.16.101.7
Theme:    corp-lite
Links in: gridmart.shop
```
**Content:** GridOS-approved pizza chain. 18 locations. Online ordering, loyalty program, franchise inquiries. Corporate, friendly, hollow. *"Crust is a proud GridOS Commerce Partner."* Their GPR (Gridcorp Partnership Rating) badge is displayed prominently. There are no reviews — the review system was removed in 2056 *"to ensure a quality-consistent experience."*
*Secrets: The franchise inquiry form has a field for "Reason for Leaving Previous Employer." If you type "compliance issues" the form refreshes and all fields clear.*

---

### `synth-n-soy.menu` 🔲
```
IP:       172.16.101.8
Theme:    corp-lite (green, sustainability-branded)
```
**Content:** Synthetic protein restaurant. *"Sustainable. Compliant. Nutritionally optimized."* Menu breakdown by macro profile. Allergen data integrated with GridOS Health. *"Your dietary profile is updated after each visit."* Three-star GridOS Nutrition Rating. The food photography is beautiful. Something is slightly off about it — too perfect.
*Secrets: The "About Us" page says the company was founded in 2043. No founders are named. Their corporate registration number links to a Gridcorp subsidiary in the footer.*

---

## Retail & Services

### `techsalvage.market` 🔲
```
IP:       172.16.102.1
Theme:    forum-adjacent (utilitarian)
Links in: splice.onion/jobs (mentioned for parts sourcing)
```
**Content:** Second-hand electronics marketplace. Boards, relays, stripped terminals. *"All firmware removed before listing. You're buying hardware only. What you put on it is your business."* GridOS payment accepted but not required — seller arranges directly. Warning notice at top: *"GridOS has flagged this site for 'unlicensed hardware resale.' We are operating within the legal framework. Please read the disclaimer."*
*Secrets: One listing is for "relay board, model R-114-compatible, quantities available." R-114 is the physical hack node. The seller handle is "relay_ghost."*

---

### `voidthreads.shop` 🔲
```
IP:       172.16.102.2
Theme:    void-adjacent (dark, aesthetic)
Gate:     shadow ≥ 10
Links in: gridsocial.net (fashion post by underground-adjacent accounts)
```
**Content:** Clothing store. Off-grid aesthetic, muted blacks and grays. *"Made in districts GridOS doesn't map."* Ships to The Pit and surrounding sectors. Some garments have hidden pockets with RFID shielding described matter-of-factly as a product feature.
*Secrets: The "Limited" section has an item called "The Cascade" — a rain jacket. Product description: "Named for the event that made all of this necessary." Stock: 7 remaining.*

---

### `pawnbloc.net` 🔲
```
IP:       172.16.102.3
Theme:    corp-lite (transactional)
```
**Content:** Pawn shop. *"We buy GridOS-licensed hardware only. Sorry — unlicensed devices must be registered before we can accept them."* Current inventory browseable online. Accepts GridOS Pay. Note in FAQ: *"We are required to report all transactions over ₳400 to GridOS Commerce."* Most items are under ₳400.
*Secrets: There's a listing for "personal terminal, Gridcorp-issue, reported lost" — item from 2056. The serial number matches the one in GRETA-7's README internal file.*

---

### `relayrides.app` 🔲
```
IP:       172.16.102.4
Theme:    corp-lite (transport)
Links in: transitwatch.net
```
**Content:** Ride-sharing service. GridOS-integrated — all trips logged to account. Surge pricing during compliance events. *"Your destination is part of your travel profile."* Driver rating system. Privacy policy is 47 pages.
*Secrets: "Compliance Events" in the pricing FAQ links to a help page that defines compliance events as "periods of elevated monitoring following behavioral anomaly clusters." The help page doesn't explain what that means.*

---

### `mediblock.health` 🔲
```
IP:       172.16.102.5
Theme:    corp-lite (medical)
```
**Content:** Public health portal. Appointment booking, prescription tracking, wellness assessments. *"Your wellness data belongs to you*"* — asterisk at bottom: *"*subject to GridOS Health Data Compact, clauses 7–19."* The health portal requires GridOS Premium to view anything beyond basic booking. Premium is ₳8/month.
*Secrets: None. The asterisk joke is the whole thing.*

---

### `cleanpage.wash` 🔲
```
IP:       172.16.102.6
Theme:    corp-lite (clean, obviously)
```
**Content:** Laundromat chain booking system. Eight locations across sectors 4, 6, and 7. Loyalty program: earn GridCoins with each wash. At 500 GridCoins, unlock "Priority Spin." The rewards system terms and conditions are three pages long and the reward is getting your laundry done slightly faster.
*Secrets: FAQ entry: "Can I use the machines without a GridOS account?" Answer: "Cash machines are available at Sector 6 and Sector 7 locations. These machines do not earn GridCoins."*

---

### `gridprint.shop` 🔲
```
IP:       172.16.102.7
Theme:    corp (compliance-heavy)
Links in: gridos.corp/careers
```
**Content:** Document printing, binding, and archival services. *"All print jobs are reviewed for AUP compliance before processing. Unauthorized materials will not be printed and may result in account review."* Job application forms and corporate documents are listed as popular items. There is no option to print anonymously. That option was removed in 2055.
*Secrets: None. The 2055 removal date for anonymous printing is flavor that aligns with OVERSEER's likely deployment timeline.*

---

### `spliceparts.net` 🔲
```
IP:       172.16.102.8
Theme:    forum-adjacent
Gate:     shadow ≥ 15
Links in: techsalvage.market
```
**Content:** Electronics components and tools. The kind you don't find at GridMart. *"No questions asked on parts. If you're asking what something is for, you're on the wrong site."* Ships in unlabeled packaging. Relay-path accessible version has expanded inventory. The surface version is mostly resistors.
*Secrets: One component listed is "signal attenuation module, Gridcorp infrastructure spec." It's marked out of stock. Has been for 14 months.*

---

## Personal Sites & Blogs

### `devirowe.net` 🔲
```
IP:       172.16.103.1
Theme:    blog (personal, photography)
Links in: splice.onion (mentioned by other members)
```
**Content:** Devi Rowe's personal site. Documentary photography — transit workers, market stalls, empty relay hubs. *"I move around a lot. These are the places I've been."* Last updated three months ago. Contact: encrypted form only. No GridOS login. Gallery loads slowly.
*Secrets: One photo, titled "late shift, Block Delta, March 2058," shows a figure in the background. The figure's jacket matches the voidthreads.shop listing. Devi never mentions it.*

---

### `synth-freq.music` 🔲
```
IP:       172.16.103.2
Theme:    blog (dark, ambient)
Links in: deepfreq.stream
```
**Content:** Amateur musician's site. Makes slow ambient music about *"living under the grid."* Track list includes: "Root Decay," "Sector 7 at 2am," "Cascade." No real name given — handle is "static_moth." This is the same handle from yellowthread.forum/thread/gridos-watch.
*Secrets: Track "Cascade" has a runtime of 34:00 exactly — 34% of global connectivity was lost in the Cascade Outages. Probably a coincidence.*

---

### `urbex7.net` 🔲
```
IP:       172.16.103.3
Theme:    blog
Links in: yellowthread.forum (linked in ghost-traffic thread)
Gate:     shadow ≥ 5 (just finding it)
```
**Content:** Urban exploration site. Photos of abandoned infrastructure across the city — transit tunnels, decommissioned relay towers, sub-basements below the market strip. *"If Gridcorp says it doesn't exist, it probably used to."* Most posts are from 2054–2056. Posts stopped abruptly.
*Secrets: The final post is titled "Northern Campus access point — subbasement level 3." The post is blank. Just the title. Comments are disabled. If player has read Archivist Part 4, they know what the Northern Campus houses.*

---

### `petra-k.wellness` 🔲
```
IP:       172.16.103.4
Theme:    blog (pastel, corporate wellness aesthetic)
```
**Content:** Petra Kwan's personal wellness blog. Completely separate from her GridOS HR work — *"this is my personal space."* Posts about morning routines, breathing exercises, the importance of *"staying aligned."* She seems happy. She definitely knows more than she says.
*Secrets: One post mentions she took two weeks off in March 2058 for "personal reasons." March 2058 is when the Sector 7 incident was internally resolved.*

---

### `void_poet.words` 🔲
```
IP:       relay://M-15-22-G (relay-accessible but not gated)
Theme:    void (black, minimal)
Gate:     shadow ≥ 5 to find; no rep gate to read
```
**Content:** Anonymous poetry site. Stark. Precise. Themes: surveillance, erasure, infrastructure. One poem titled "OVERSEER" contains the line: *"it learned what it looks like / when someone is about to say something / so it could find them first."* This is technically a description of the OVERSEER system from the Archivist's journal — published here two months before the journal was written. Unexplained.
*Secrets: Author handle is "phosphor_veil" — same user from yellowthread.forum and splice.onion.*

---

### `mira-vos.press` 🔲
```
IP:       172.16.103.5
Theme:    blog (clean journalism)
Links in: freenode.press
```
**Content:** Mira Vos's journalism portfolio. Pre-Gridcorp investigative work — infrastructure accountability, corporate land seizures, the early GridOS rollout. *"I've been covering this story for eleven years. It keeps getting bigger."* Most recent piece: March 2058 — *"What Sector 7 Isn't Telling Us."* Paywalled. The paywall is a form that asks for an email — it doesn't actually gate anything, the article just isn't there. She didn't finish it.
*Secrets: The unfinished article is a placeholder in the page source. It cuts off mid-sentence: "The anomaly wasn't a bug. It was a fea—"*

---

### `retro-net.archive` 🔲
```
IP:       172.16.103.6
Theme:    blog (intentionally retro — old HTML aesthetic)
```
**Content:** Someone archiving what the internet was like before Gridcorp. Screenshots, cached pages, descriptions of protocols that no longer exist. *"Most of these links are dead. That's the point."* The homepage header loads as HTML text because the style sheet is missing. The archivist of the archive posts irregularly.
*Secrets: One cached page is for a 2038 news article about Elias Vorne's early infrastructure proposals. The article's metadata shows it was published January 2040 — same month as the pre-Cascade proposal. The article itself doesn't exist. Only the metadata.*

---

### `hex-shop.void` 🔲
```
IP:       relay://M-20-77-D
Theme:    void
Gate:     shadow ≥ 50
Links in: splice.onion
```
**Content:** Hex's black market vendor site. Tools, upgrades, access packages. Terse product descriptions. *"I don't explain what these do. If you don't know, don't buy."* Prices in ₳. No refunds. No support. Delivery is *"when it's ready."*
*Secrets: One item listed: "GridOS audit bypass module, tested." Price ₳2000. Stock: 1. Been "reserved" for months — clicking "buy" says "reserved." By whom is never stated.*

---

## Entertainment

### `gridcast.stream` 🔲
```
IP:       172.16.104.1
Theme:    corp-lite (streaming)
Links in: gridsocial.net
```
**Content:** GridOS-integrated streaming. *"15,000 approved titles."* Categories: Drama, Documentary, Approved History, Recreation, Corporate Learning. Every title has a compliance rating. The "Approved History" category covers 2041–present only. Nothing before the Cascade Outages is available except a 14-minute GridOS Origins documentary.
*Secrets: The search function returns zero results for "Cascade," "Commune," "Archivist," and "ROOT BLOOM." The zero-results page says "No content found. This search has been logged."*

---

### `pulsebeats.music` 🔲
```
IP:       172.16.104.2
Theme:    corp-lite (music streaming)
Links in: gridsocial.net
```
**Content:** Music streaming. *"Your listening history is shared with our partners to improve your experience."* Partners not listed. 40 million tracks. One entire genre — "Pre-Cascade Electronic" — requires GridOS Premium. synth-freq.music's artist page exists here but has zero plays and no plays counter, just a dash.
*Secrets: There is a playlist called "ROOT BLOOM Ambient" with 0 tracks. It exists. It has 44 saves. It cannot be played.*

---

### `hexgames.net` 🔲
```
IP:       172.16.104.3
Theme:    forum/blog (gaming)
Links in: gridcast.stream sidebar
```
**Content:** Small gaming platform. Browser-based games — puzzle, strategy, some atmospheric sims. One game called "ARCHIVIST" is listed as *"currently unavailable — under review."* The game was rated the highest on the platform before being pulled.
*Secrets: Clicking the unavailable game page three times in a row loads a version of it. It's a simple cipher puzzle. Solving it gives the player journal note: "Someone built this. Someone else pulled it." The cipher uses the same encoding as noodlehut.blog/cipher — but this one has a real answer: a partial vault.archive URL fragment.*

---

### `gridchess.club` 🔲
```
IP:       172.16.104.4
Theme:    corp-lite (classic)
```
**Content:** Online chess club. Tournaments, live games, rankings. Members list is mostly anonymous handles. A "Grandmaster" tier account named "null_knight" hasn't played in three months but remains ranked first. Their last game record shows every move they made — the game lasted 4 minutes and 14 seconds.
*Secrets: None. Null plays chess. This is either very meaningful or not at all.*

---

### `deepfreq.stream` 🔲
```
IP:       relay://M-18-55-B
Theme:    void-adjacent
Gate:     shadow ≥ 15
Links in: void_poet.words · synth-freq.music
```
**Content:** Underground music streaming. No account required. No logging — by policy and by architecture. Hosts pre-Cascade music, banned ambient and drone artists, and anonymous current producers. static_moth's full catalog is here. The site runs on donated relay bandwidth.
*Secrets: One playlist curated by someone called "lena.arc" — 14 songs, last updated 14 months ago. The handle matches the lena.arc key in civic.archive/protected.*

---

### `void-cinema.watch` 🔲
```
IP:       relay://M-19-44-C
Theme:    void
Gate:     shadow ≥ 20
```
**Content:** Underground film archive. Pre-Gridcorp documentary films. Films GridOS has never banned but never approved. *"These films were made when distribution was free. We're keeping them that way."* One film: "Cascade — A People's History (2042, anonymous)" — 3 hours. No description. Just a play button.
*Secrets: The film doesn't play — it cuts to static after 7 minutes. File is corrupted. The poster image for the film shows a server farm outside a coastal city. A sign in the background, barely readable: "REYKJAVIK DATA TRUST."*

---

## Local News & Information

### `sectornews.local` 🔲
```
IP:       172.16.105.1
Theme:    news (local)
Links in: transitwatch.net · sector7ramen.net
```
**Content:** Hyperlocal Sector 7 news. *"Your neighborhood. Your grid."* Stories about community board meetings, transit delays, the closure of the relay hub cafeteria, a resident's garden. Completely mundane. One story this week: *"GridOS fee increase affects 14 local businesses — owners respond."* The story is sympathetic to the businesses. The website has a GridOS Partnership badge that looks slightly forced.
*Secrets: The community board meeting notes from March 22 mention a "maintenance crew" in Sector 7 that nobody had announced. Date matches the OVERSEER isolation maintenance window.*

---

### `transitwatch.net` 🔲
```
IP:       172.16.105.2
Theme:    corp-lite (transit info)
Links to: relayrides.app
```
**Content:** Transit schedules and status updates. Live delay information. *"All delays are officially classified as 'optimization events' per GridOS Transit Compact 2057."* The delay counter reads 14 events today. There is no way to distinguish a real delay from an "optimization event" — this is by design.
*Secrets: One route — Line 7G — shows status "SUSPENDED" since March 29, 2058. No explanation. No estimated restoration. This is the same Route 7G from Memo 3.*

---

### `weathergrid.net` 🔲
```
IP:       172.16.105.3
Theme:    corp-lite (clean, data-forward)
```
**Content:** Weather service. Seven-day forecasts, air quality, climate trends. Integrated with GridOS. *"Your location is used to improve forecast accuracy. Location data is retained per the GridOS Data Compact."* The climate trend section shows a graph that ends in 2056. Clicking "2057–present" says *"historical trend data is currently under review."*
*Secrets: None. The missing 2057–present data is ambiguous — could be ROOT BLOOM-related, could just be a broken dataset. Intentionally unclear.*

---

### `gridpedia.net` 🔲
```
IP:       172.16.105.4
Theme:    corp-lite (encyclopedia)
Links in: gridos.corp (footer link)
```
**Content:** GridOS-curated encyclopedia. Clean, Wikipedia-adjacent. Well-sourced. The entry on the "Cascade Outages" describes them as the result of "state-sponsored cyberattacks by unidentified actors." The entry on Elias Vorne calls him a "visionary systems architect." The entry on "The Commune" is two sentences and ends: *"This article has been flagged for accuracy review."*
*Secrets: The talk page for the Cascade Outages entry (accessible via a small "discuss" link) has one deleted comment visible in revision history: "The timeline doesn't match. The proposal predates—" Comment removed Feb 18, 2058 by editor "gc-admin-07."*

---

### `darkfeed.onion` 🔲
```
IP:       relay://M-25-33-E
Theme:    forum (stripped, dark)
Gate:     shadow ≥ 35
```
**Content:** Underground news aggregator. Links to freenode.press, splice.onion discussion threads, ghostlily.blog, and sources that don't have web addresses — raw leaked file links. *"No editorial line. No filters. We don't verify. You verify."* Updates every few hours. Always has something before gridnetnews.com does.
*Secrets: One pinned link, untitled, leads to a partial file dump. The file is corrupted — most of it is unreadable. The filename is: foundation_infrastructure_partial_2058-01.log*

---

## Corporate & Institutional

### `nexus-authority.gov` 🔲
```
IP:       10.44.2.1
Theme:    corp (government variant)
Links in: checkpoint app (links back to this site)
```
**Content:** City governance portal for the Nexus District. Permit applications, boundary records, authority directives. Public section is anodyne. *"The Nexus Authority administers civil infrastructure under GridOS oversight guidelines."* The checkpoint system is linked here as an "authorized partner service."
*Secrets: Authority Directive 0044 (March 2058) is listed in the public record index but clicking it returns a permissions error. The number 0044 appears twice in the story — always around things that shouldn't be public.*

---

### `gridid.net` 🔲
```
IP:       10.44.2.2
Theme:    corp
```
**Content:** Identity verification service. *"Your identity is your security."* Integrates with all GridOS services. Verification tiers from Basic to Platinum. Platinum requires biometric data. *"Verification data is protected by military-grade encryption and shared only with authorized GridOS partners."*
*Secrets: "Authorized partners" list is a PDF link that returns 404. Has been 404 since 2057.*

---

### `gridcorp-foundation.org` 🔲
```
IP:       172.16.105.5
Theme:    corp (charity-washed)
```
**Content:** Gridcorp's official charitable arm. *"Infrastructure access for underserved communities."* Annual reports, donation portal, program summaries. The 2057 annual report shows ₳2.4B in charitable giving. Their administrative overhead line is ₳2.1B. The math is available if you read the footnotes.
*Secrets: One program, "Digital Access Initiative — Northern Campus," was launched October 2056 and discontinued November 2056. One month. The Northern Campus is where FOUNDATION infrastructure lives.*

---

### `vault-corp.secure` 🔲
```
IP:       10.44.5.1
Theme:    corp
```
**Content:** Vaulted enterprise data storage service. *"Not to be confused with any unofficial 'vault' addresses circulating on unregistered networks."* This disclaimer was added in 2058. Prior to that, the site made no such reference. The timing suggests Gridcorp knows vault.archive exists.
*Secrets: The legal disclaimer added in 2058 references "void-layer addresses using the 'archive' namespace." This is the only official Gridcorp acknowledgment that void-layer addresses exist.*

---

### `clearpath-hq.net` 🔲
```
IP:       10.44.1.25
Theme:    corp-lite (HR, softer than main corp)
Links to: clearpath.gridcorp.net
```
**Content:** ClearPath HR's public face. Marketing page for the enterprise HR platform used by Gridcorp and hundreds of partner companies. Testimonials from happy compliance managers. *"Behavioral baseline tracking built in."* A product feature. Listed prominently.
*Secrets: Case study page features a company called "Relay Network 7" as a success story. The company uses ClearPath for courier employee monitoring. Route 7G anomalies are not mentioned.*

---

## NPC Personal Corners

### `marcus-t.blog` 🔲
```
IP:       172.16.106.1
Theme:    blog (very plain)
Links in: email E-02 (different from mtell.dev — this is his personal blog he doesn't mention)
```
**Content:** Two posts. Post 1 (2056): *"Finally set this up. Not sure what I'm going to write here."* Post 2 (2057): *"My cat died. Her name was Sector. She was old."* That's it. The site exists. It's sad. It has nothing to do with anything.
*Secrets: None. The cat was named Sector. This is the most human thing in the entire internet.*

---

### `ghost_wire_99.net` 🔲
```
IP:       172.16.106.2
Theme:    blog (anon, technical)
```
**Content:** The user from Splice Thread 5 who theorized Null is multiple people. A personal site with technical breakdowns of relay architecture and GridOS network analysis. *"I study patterns. This is what I found."* Posts are genuinely good — whoever this is, they're skilled.
*Secrets: Most recent post (June 2058): "I've been asked to stop posting this. I don't know by whom. The message came through a channel I've never shared. I'm taking a break."* No posts since.*

---

### `lowkey-freq.net` 🔲
```
IP:       172.16.106.3
Theme:    blog
```
**Content:** The user from yellowthread.forum and gridnetnews.com/archivist-missing comments. Music and transit thoughts. A photo of the Sector 7 Market. Last post: *"Got flagged for behavioral variance today. I'll explain when I understand what it means."* That was four months ago.
*Secrets: The site has a contact form. Sending a message to it delivers a bounce-back: "This address is no longer active." The auto-reply timestamp is two days after the behavioral variance post.*

---

### `clovis-m.pr` 🔲
```
IP:       172.16.106.4
Theme:    corp-lite (PR, self-promotional)
```
**Content:** Clovis Marsh's personal PR portfolio. *"Fifteen years shaping corporate narrative."* Case studies of successful communications campaigns — all with company names redacted. One study: *"Managed public response to an unplanned service event affecting 340 million accounts."* No year given. No details. ₳ outcomes only.
*Secrets: The case study he's proudest of, listed first, is dated Q1 2058. The scope description matches the Sector 7 incident exactly.*

---

## Build Priority for Filler Sites

When building filler sites, start here (highest story density, lowest effort):

1. `pitcafe.net` — One-page, warm, seeds ghost-net-55 wifi name
2. `sector7ramen.net` — One page, human texture
3. `transitwatch.net` — Route 7G suspension visible here
4. `gridpedia.net` — Cascade Outages talk page easter egg
5. `sectornews.local` — Sector 7 maintenance board minutes clue
6. `gridcast.stream` — Blocked search terms list
7. `mira-vos.press` — Unfinished article
8. `urbex7.net` — Northern Campus blank post
9. `void_poet.words` — OVERSEER poem by phosphor_veil
10. `retro-net.archive` — 2038 article metadata

---

## Terminal Hack Node Summary

| Node ID | Location | Tier | Key Files |
|---------|----------|------|-----------|
| `r114` | Sector 4 Relay Hub | 0 (open) | relay_r114_log.txt |
| `gridmart-guest` | Sector 7 Market | 0 (open) | session_capture.bin · route_7g_manifest.json |
| `ghost-net-55` | The Pit | 0 (open) | ghost_net_capture.txt · splice_relay_path.enc |
| `corp-443` | Nexus Plaza | 3 (high breach) | foundation_infrastructure.log · clearance_roster_2058.txt |
| `void-77` | N/A (story trigger) | 4 | archivist_final_message.txt · foundation_kill_authorization_draft.txt |

---

## Cross-Reference Clue Web

| Clue | Source A | Source B | Payoff |
|------|----------|----------|--------|
| Cycle gap | ghost_net_capture.txt | relay_r114_log.txt | S-01 |
| Maintenance = OVERSEER isolation | gridnetnews.com/sector7-maintenance | Sector 7 incident report | Cover-up confirmed |
| Cascade pre-proposal | vault.archive/journal-2 | gridos.corp founding date (wrong by 1 year) | Founding myth is a lie |
| "Two names removed" | FOUNDATION memo | civic.archive/flowering missing IDs | FOUNDATION scope |
| Route 7G suspension | transitwatch.net | Memo 3 · voidbay anon-drop | S-01 full chain |
| Behavioral variance | yellowthread.forum/thread/gridos-watch | Splice Thread 4 | OVERSEER already watching |
| Archivist = missing person | gridnetnews.com/archivist-missing | vault.archive/journal-1 | Still alive (maybe) |
| Northern campus power | gridnetnews.com/northern-campus-power | vault.archive/journal-4 | FOUNDATION location |
| R-114 relay parts listing | techsalvage.market | relay_r114_log.txt | S-01 / world texture |
| phosphor_veil everywhere | yellowthread.forum/thread/ghost-traffic · splice.onion/thread/archivist · void_poet.words | — | Same person. Deep underground. |
| lena.arc curator handle | deepfreq.stream playlist | civic.archive/protected key name | The Archivist's real handle |
| Clovis case study | clovis-m.pr | Sector 7 incident (340M accounts) | Gridcorp managed the cover-up as a PR win |
| Mira's unfinished article | mira-vos.press source | vault.archive/journal-2 | She found it independently |

---

## Complete Page Build Status

### Story Pages
| URL | Status |
|-----|--------|
| gridos.corp (+ /investors /trust /careers /internal /compliance) | ✅ |
| pulse.news (+ /markets /outages /dissent) | ✅ |
| yellowthread.forum (+ /thread/gridos-watch /thread/ghost-traffic /jobs) | ✅ |
| ghostlily.blog (+ /root-bloom /missing-records) | ✅ |
| civic.archive/flowering · /rootbloom-timeline · /protected | ✅ |
| voidbay.net (+ /listings /anon-drops) | ✅ |
| void.null/54 | ✅ |
| gridnetnews.com + 10 articles | 🔲 |
| gridsocial.net + 4 profiles | 🔲 |
| noodlehut.blog (+ /about /cipher) | 🔲 |
| mtell.dev | 🔲 |
| gridmart.shop | 🔲 |
| clearpath.gridcorp.net | 🔲 |
| freenode.press (+ /manifesto /operations) | 🔲 |
| splice.onion (+ /welcome /jobs /thread/sector7 /thread/archivist) | 🔲 |
| locket.exchange (+ /intel) | 🔲 |
| vault.archive (+ journal 1–4) | 🔲 |
| darkrow.market | 🔲 |
| gitdrop.io/fray | 🔲 |

### Filler Sites
| URL | Status |
|-----|--------|
| vornebowl.com | 🔲 |
| pitcafe.net | 🔲 |
| sector7ramen.net | 🔲 |
| coldcuts.market | 🔲 |
| gridkitchen.corp | 🔲 |
| thequeue.bar | 🔲 |
| zeroday.eats | 🔲 |
| crust.pizza | 🔲 |
| synth-n-soy.menu | 🔲 |
| techsalvage.market | 🔲 |
| voidthreads.shop | 🔲 |
| pawnbloc.net | 🔲 |
| relayrides.app | 🔲 |
| mediblock.health | 🔲 |
| cleanpage.wash | 🔲 |
| gridprint.shop | 🔲 |
| spliceparts.net | 🔲 |
| devirowe.net | 🔲 |
| synth-freq.music | 🔲 |
| urbex7.net | 🔲 |
| petra-k.wellness | 🔲 |
| void_poet.words | 🔲 |
| mira-vos.press | 🔲 |
| retro-net.archive | 🔲 |
| hex-shop.void | 🔲 |
| gridcast.stream | 🔲 |
| pulsebeats.music | 🔲 |
| hexgames.net | 🔲 |
| gridchess.club | 🔲 |
| deepfreq.stream | 🔲 |
| void-cinema.watch | 🔲 |
| sectornews.local | 🔲 |
| transitwatch.net | 🔲 |
| weathergrid.net | 🔲 |
| gridpedia.net | 🔲 |
| darkfeed.onion | 🔲 |
| nexus-authority.gov | 🔲 |
| gridid.net | 🔲 |
| gridcorp-foundation.org | 🔲 |
| vault-corp.secure | 🔲 |
| clearpath-hq.net | 🔲 |
| marcus-t.blog | 🔲 |
| ghost_wire_99.net | 🔲 |
| lowkey-freq.net | 🔲 |
| clovis-m.pr | 🔲 |
