# The Grid — Internet Map

A narrative reference for the in-universe internet. Sites are grouped by tier. Every entry includes: IP (in-universe), purpose, connections, and any secrets or lore notes relevant to gameplay.

---

## Tier 1 — Story Critical

These sites drive the main plot. Players will be directed here through natural progression.

### `gridos.corp`
- **IP:** 10.0.0.1
- **Purpose:** The corporate face of the company that owns the internet. Entry point for compliance jobs, lore, and the Trust & Safety rabbit hole.
- **Connects to:** `gridos.corp/investors`, `gridos.corp/trust`, `gridos.corp/careers`, `pulse.news`, `yellowthread.forum`
- **Secrets:** `gridos.corp/internal` and `gridos.corp/compliance` are hidden behind a compliance gate (score ≥ 65). Internal memos reference ROOT BLOOM and call it "routine service decay."
- **Rep effect:** Compliance +1 on visit

### `gridos.corp/internal`
- **IP:** 10.0.0.2
- **Purpose:** Gated corporate intranet. Contains ROOT BLOOM reclassification memos.
- **Gate:** Compliance ≥ 65
- **Connects to:** `gridos.corp/compliance`
- **Secrets:** Analyst access logs retained 180 days. Note implies visiting this page is itself tracked.

### `gridos.corp/compliance`
- **IP:** 10.0.0.3
- **Purpose:** Active compliance queue. Lists flagged domains including `civic.archive/*` and `ghostlily.blog`.
- **Gate:** Compliance ≥ 65
- **Job available:** Compliance Queue Auditor — ₳ 600/session
- **Secrets:** Analysts who consistently close cases as "No Threat" get flagged themselves.

### `civic.archive/flowering`
- **IP:** 10.4.1.2
- **Purpose:** Hidden municipal archive fragment. Pre-GridOS records. First major lore payload.
- **Connects to:** `civic.archive/rootbloom-timeline` (deeper, shadow-gated)
- **Job available:** Recover Flowering District Census — ₳ 1,200 high risk
- **Secrets:** Infrastructure ownership field was overwritten. Final metadata note: *"they bought the roads, then the names, then the memory of both."*

### `civic.archive/rootbloom-timeline`
- **IP:** 10.4.1.3
- **Purpose:** Month-by-month timeline of the ROOT BLOOM incident and GridOS's takeover of civic infrastructure.
- **Gate:** Shadow ≥ 55
- **Connects to:** `civic.archive/protected`
- **Secrets:** One of six remaining archive copies. References mara.sol courier network (not yet a live site).

### `civic.archive/protected`
- **IP:** 10.4.1.4
- **Purpose:** lena.arc's protected records. 42 names removed from public record. Pre-overwrite census.
- **Gate:** Unlocked by key `lena_arc_protected` (granted by reading `vault.archive/journal-3`)
- **Job available:** Distribute Protected Records — ₳ 2,000 critical risk
- **Secrets:** "None of them left voluntarily. I knew three of them." Key moment for moral weight.

### `vault.archive`
- **IP:** 10.9.0.1
- **Purpose:** The Archivist's hidden journal. Four-part lore drop. The narrative spine of the game.
- **Gate:** Unlocked by key `vault_arc_open` (obtained through the investigative chain)
- **Connects to:** `vault.archive/journal-1` through `/journal-4`
- **Secrets:** Journal 3 (`/journal-3`) unlocks `lena_arc_protected`, giving access to `civic.archive/protected`. Journal 4 reveals FOUNDATION — Gridcorp's killswitch.

### `freenode.press`
- **IP:** 10.7.0.1
- **Purpose:** The Commune's publication hub. Home of The Grid Manifesto. Claims Gridcorp engineered the Cascade Outages.
- **Gate:** Shadow ≥ 30
- **Connects to:** `/manifesto`, `/operations`
- **Secrets:** `/manifesto` contains the claim that Vorne arranged the Cascade Outages. `/operations` lists OP: DEEP COVER — corporate mole placement.
- **Job available:** Corporate Mole — Gridcorp Compliance — ₳ 3,500

### `splice.onion`
- **IP:** 10.8.0.1
- **Purpose:** Underground collective forum. Vouched members only. Where "null," "locket," and "fray" operate.
- **Gate:** Shadow ≥ 55
- **Connects to:** `/welcome`, `/jobs`, `/thread/sector7`, `/thread/archivist`
- **Secrets:** Thread on the archivist cross-references `gridnetnews.com/archivist-missing`. Fray "has something" on Sector 7 — teased but unresolved.

---

## Tier 2 — Important Secondary

Used regularly for jobs, lore fragments, and underground navigation.

### `ghostlily.blog`
- **IP:** 10.3.0.1
- **Purpose:** Anonymous journalist keeping receipts on GridOS. Two critical entries: ROOT BLOOM and missing public records.
- **Connects to:** `civic.archive/flowering`, `yellowthread.forum`
- **Job available:** Archive Integrity Check — ₳ 500 (via `/missing-records`)
- **Secrets:** "If timestamps agree too perfectly, the page was rewritten." Gives players a method to detect manipulation.

### `pulse.news`
- **IP:** 10.2.0.1
- **Purpose:** Corporate-leaning news. Covers GridOS stock, outages, and dissent. Entry point for players who follow mainstream media.
- **Connects to:** `ghostlily.blog`, `yellowthread.forum`, `gridos.corp`
- **Secrets:** `/dissent` — archived column whose author went quiet after their identity score changed. Three linked sources are now 404; one redirects to `gridos.corp/trust`.

### `yellowthread.forum`
- **IP:** 10.2.1.1
- **Purpose:** Public, noisy, semi-useful forum. Main civilian hub.
- **Connects to:** All major sites via thread links. Freelance board (`/jobs`) has early contract options.
- **Secrets:** Thread on ghost traffic references a deleted reply with `civic.archive/flowering`. The site is almost certainly monitored.
- **Job available:** Signal Trace — Sector 4 — ₳ 750/run

### `voidbay.net`
- **IP:** 10.5.0.1
- **Purpose:** Grey market exchange. Tools, spoofed tokens, compliance credentials, ROOT BLOOM suppressor scripts.
- **Gate:** Shadow ≥ 30
- **Connects to:** `/listings`, `/anon-drops`
- **Secrets:** Listed as 404 on GridOS routing tables since 2029. "Still here." Drop #443 hints at a new civic archive mirror domain.

### `locket.exchange`
- **IP:** 10.8.1.1
- **Purpose:** Information brokerage. Sells verified intel packages including Sector 7 findings, archivist employment records, FOUNDATION annual review, and OVERSEER training data provenance.
- **Gate:** Shadow ≥ 55
- **Job available:** Browse intel packages — multiple prices ₳ 300–₳ 800
- **Secrets:** "I don't take sides." Has broken her own rule twice. OVERSEER training data provenance is the most disturbing item.

### `darkrow.market`
- **IP:** 10.5.1.1
- **Purpose:** Deeper grey market. OVERSEER blind spot exploit, GridOS audit bypass module.
- **Gate:** Shadow ≥ 50
- **Secrets:** OVERSEER blind spot is a documented behavioral pattern that delays flagging by 7 days — directly usable by players.

### `gridnetnews.com`
- **IP:** 10.2.2.1
- **Purpose:** The official record of the Grid. Nine sub-articles covering Sector 7, GridMart, commune arrests, profits, the missing archivist, GridSocial, DMCA takedowns, power irregularities, and OS updates.
- **Secrets:** `/archivist-missing` cross-references the Splice thread timeline. `/northern-campus-power` hints at a large-scale off-hours compute operation (OVERSEER?).

### `gridsocial.net`
- **IP:** 10.2.3.1
- **Purpose:** Social platform. 500M accounts. AUP-reviewed.
- **Connects to:** Profiles for Elias Vorne (memorial), Agent 44, Petra Kwan (HR), `user_3g44x` (mysterious inactive user)
- **Secrets:** `user_3g44x` — 3 posts, last active 14 months ago. Post 2 links to `sector7ramen.net`. Post 3: "Weather's wrong today." Account matches the timeline of the archivist's disappearance.

### `darkfeed.onion`
- **IP:** 10.5.2.1
- **Purpose:** Unfiltered aggregate of underground content. Pinned: a corrupted partial FOUNDATION log.
- **Gate:** Shadow ≥ 35
- **Secrets:** Always has news before `gridnetnews.com`. The corrupted log (`foundation_infrastructure_partial_2058-01.log`) is a tease for what vault.archive reveals fully.

### `clearpath.gridcorp.net`
- **IP:** 10.0.1.1
- **Purpose:** Gridcorp employee HR portal. Submit elevated access requests, compliance training.
- **Gate:** Compliance ≥ 30
- **Job available:** Credit Processor — ₳ 280/session
- **Secrets:** Flagged keyword submissions are escalated automatically.

---

## Tier 3 — Flavor / World-Building

These sites are real and browsable but don't drive plot. They make the internet feel inhabited. Players may find small details or dead ends.

### Food & Dining

| Site | IP | Notes |
|---|---|---|
| `sector7ramen.net` | 10.6.1.1 | Owner-operated since 2049. GridOS transaction fees went up. Relay hub closure killed lunch crowd. |
| `pitcafe.net` | 10.6.1.2 | WiFi: `ghost_net_55` no password. No GridOS kiosks. Been asked to register three times. |
| `vornebowl.com` | 10.6.1.3 | Named after Elias Vorne. "The Cascade" is a limited-time menu item. Named for the event. |
| `zeroday.eats` | 10.6.1.4 | Shadow ≥ 10. Cash only. Delivery: Sectors 4, 6, Underground. Item on menu 14 months: THE ARCHIVIST — "black coffee, two sugars, sealed cup. Nobody has claimed it." |
| `thequeue.bar` | 10.6.1.5 | Transit worker bar near RELAY-7 Hub. Site design from 2051. Owner: Vesna. |
| `crust.pizza` | 10.6.1.6 | GridOS Commerce Partner. Review system removed in 2056. |
| `coldcuts.market` | 10.6.1.7 | Deli. GridOS payment only since upgrade. |
| `gridkitchen.corp` | 10.6.1.8 | Gridcorp employee cafeteria. Compliance ≥ 10. "Dietary selections may inform your wellness profile." |

### Retail & Services

| Site | IP | Notes |
|---|---|---|
| `techsalvage.market` | 10.6.2.1 | Hardware resale. Flagged by GridOS. Current listing: relay board R-114-compatible. Seller: `relay_ghost`. |
| `spliceparts.net` | 10.6.2.2 | Shadow ≥ 15. Components no questions asked. Signal attenuation module (Gridcorp infrastructure spec) — out of stock 14 months. |
| `voidthreads.shop` | 10.6.2.3 | Shadow ≥ 10. RFID shielding on selected garments. LIMITED: The Cascade jacket. 7 remaining. |
| `relayrides.app` | 10.6.2.4 | Ride booking. "Surge pricing active during compliance events." Destination is part of your travel profile. |
| `mediblock.health` | 10.6.2.5 | Health portal. Full access GridOS Health Premium ₳8/mo. |
| `gridprint.shop` | 10.6.2.6 | Print services. Anonymous printing removed 2055. All jobs attributed. |
| `cleanpage.wash` | 10.6.2.7 | Laundry. Cash machines at Sectors 6 and 7 don't earn GridCoins. |
| `gridmart.shop` | 10.6.2.8 | Gridcorp commerce. `/cart` has a pre-loaded item from an email promo. Coupon code hint in cart notes. |

### Personal Sites & Blogs

| Site | IP | Notes |
|---|---|---|
| `noodlehut.blog` | 10.3.1.1 | Ren's noodle blog. No GridOS login. `/cipher` post: answer is GOOD SOUP. Recommended `sector7ramen.net`. |
| `mtell.dev` | 10.3.1.2 | Marcus Tell, IT. 11 years at Gridcorp. Projects include node sanitation scripts and patch scheduler. |
| `devirowe.net` | 10.3.1.3 | Documentary photography. One photo from Block Delta has a figure in a jacket matching `voidthreads.shop`. Never mentioned. |
| `synth-freq.music` | 10.3.1.4 | `static_moth` ambient music. Tracks: Root Decay, Sector 7 at 2am, Cascade, Monitored, Behavioral Baseline. Full catalog on `deepfreq.stream`. |
| `urbex7.net` | 10.3.1.5 | Urban exploration blog. Final post title: "Northern Campus access point — subbasement level 3." Body: empty. |
| `void-poet.words` | 10.3.1.6 | Poetry by `phosphor_veil`. Poem about OVERSEER published two months before any public record of OVERSEER. |
| `mira-vos.press` | 10.3.1.7 | Investigative journalist. Unfinished article in page source cuts off: *"The anomaly wasn't a bug. It was a fea—"* |
| `retro-net.archive` | 10.3.1.8 | Pre-Gridcorp internet screenshots and cached pages. 2038 article on Vorne's early infrastructure proposals. |

---

## Tier 4 — Trap / Special

### `void.null/54`
- **IP:** 10.9.9.54
- **Purpose:** Triggered if the player escalates a compliance case for `null.54` — a fake citizen profile used as a behavioral test.
- **Gate:** Unlocked by key `null54_escalated`
- **Effect:** Rep -5 Shadow, -5 Compliance. The site tells the player: *"We wanted to know if you would do it. Now we know."*
- **Note:** This is the game's clearest moral mirror. Use sparingly — it should sting.

---

## Link Flow Diagram (simplified)

```
gridos.corp
├── gridos.corp/investors → pulse.news
├── gridos.corp/trust → yellowthread.forum/thread/gridos-watch
├── gridos.corp/careers → ghostlily.blog
├── gridos.corp/internal [C≥65] → gridos.corp/compliance [C≥65]
│
pulse.news
├── pulse.news/markets/gridos → yellowthread.forum/thread/gridos-watch
├── pulse.news/outages → ghostlily.blog/root-bloom
├── pulse.news/dissent [shadow +1] → civic.archive/flowering
│
yellowthread.forum
├── /thread/gridos-watch → ghostlily.blog
├── /thread/ghost-traffic → civic.archive/flowering
├── /jobs → [job: signal trace]
│
ghostlily.blog
├── /root-bloom → [lore]
├── /missing-records → civic.archive/flowering + [job]
│
civic.archive/flowering
├── /rootbloom-timeline [S≥55]
│   └── /protected [key: lena_arc_protected]
│
vault.archive [key: vault_arc_open]
├── /journal-1 → /journal-2 → /journal-3 → /journal-4
│   └── /journal-3 UNLOCKS lena_arc_protected
│
voidbay.net [S≥30]
├── /listings
├── /anon-drops [S≥40]
│
freenode.press [S≥30]
├── /manifesto [S≥30]
├── /operations [S≥40] → [job: corporate mole]
│
splice.onion [S≥55]
├── /welcome
├── /jobs → [job: deep scan]
├── /thread/sector7
├── /thread/archivist → gridnetnews.com/archivist-missing
│
locket.exchange [S≥55]
└── /intel
```

---

## Notes for GMs / Designers

- **Flavor sites don't need to be exhaustive.** A burger ad can just be a burger ad. Texture matters more than density.
- **The three moral paths** emerge naturally from site clusters: Corporate (gridos.corp/clearpath chain), Underground (freenode/splice/voidbay chain), Investigative (ghostlily/civic.archive/vault chain). Most players will blend.
- **`void.null/54` is the one site that punishes compliance.** Don't telegraph it.
- **The Archivist's identity** is deliberately ambiguous. `user_3g44x` and `zeroday.eats/THE ARCHIVIST` are breadcrumbs, not confirmation.
- **FOUNDATION** is the endgame reveal. Don't let players find it before they've earned the weight of it.
