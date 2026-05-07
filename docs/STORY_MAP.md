# GRID-OS — Story Progression Map
> Implementation reference for coding story order, triggers, conditions, state, and all inter-system dependencies.

---

## The Arc in One Paragraph

A new user boots into GridOS. Everything appears routine — a job, email, a browser, a map. Cracks appear: a forum thread, a dead blog column, a maintenance window that keeps extending. An anonymous contact reaches out. The underground is real and organized. The player digs deeper, gains faction trust, and eventually finds a hidden archive that proves Gridcorp engineered the collapse that gave them the world. The final act is a choice: expose what you found, bury it, or burn it all down. The game ends three different ways. Nothing resets.

---

## State Variables

Everything the game must track. Implement as a persistent Zustand store (or Supabase-backed after auth).

```typescript
interface StoryState {
  // ── Core progression ──────────────────────────────────────────────────────
  phase: 0 | 1 | 2 | 3 | 4 | 5 | 6          // current act phase (see Phase Map)
  missions: Record<MissionId, MissionStatus>  // 'inactive'|'active'|'complete'|'failed'
  flags:    Set<StoryFlag>                    // one-time event markers (see Flag Registry)

  // ── Economy ───────────────────────────────────────────────────────────────
  credits: number                             // ₳ balance
  jobsCompleted: string[]                     // job IDs in completion order

  // ── Reputation ────────────────────────────────────────────────────────────
  compliance: number   // 0–100, starts 50
  shadow:     number   // 0–100, starts 50
  overseerFlag: number // 0–100, internal OVERSEER pressure (hidden from player)
                       // rises with underground activity; triggers events at thresholds

  // ── Browser ───────────────────────────────────────────────────────────────
  browserHistory:  string[]        // all URLs visited in order
  browserUnlocks:  Set<string>     // keys unlocked (vault_arc_open, lena_arc_protected, etc.)
  pagesTriggered:  Set<string>     // URLs whose one-time effects have fired

  // ── Email ─────────────────────────────────────────────────────────────────
  emailInbox:    EmailRecord[]     // received emails (id, from, subject, body, read, timestamp)
  emailQueue:    QueuedEmail[]     // emails waiting to deliver: { id, deliverAt, condition? }

  // ── Terminal / Filesystem ─────────────────────────────────────────────────
  terminalNodes:   Set<string>     // connected hack nodes: r114, ghost-net-55, etc.
  filesystemPaths: Set<string>     // files that exist on ~/: relay_r114_log.txt, etc.
  filesRead:       Set<string>     // files opened in File Manager

  // ── Archivist chain ───────────────────────────────────────────────────────
  archivistKeys: {
    step1: boolean  // vault_arc_open received
    step2: boolean  // vault.archive/journal-1 read → unlocks journal-2
    step3: boolean  // vault.archive/journal-2 read → unlocks journal-3
    step4: boolean  // vault.archive/journal-3 read → unlocks journal-4 + lena_arc_protected
  }

  // ── Faction alignment ─────────────────────────────────────────────────────
  // Derived from compliance/shadow, but also from explicit choices:
  factionalChoices: Array<'corp' | 'underground' | 'neutral'>

  // ── Final choice ──────────────────────────────────────────────────────────
  gridfallChoice: 'expose' | 'bury' | 'burn' | null
}

type MissionId =
  'M-01'|'M-02'|'M-03'|'M-04'|'M-05'|'M-06'|'M-07'|'M-08'|
  'S-01'|'S-02'|'S-03'|'S-04'|'S-05'|'S-06'

type MissionStatus = 'inactive' | 'active' | 'complete' | 'failed'
```

---

## Flag Registry

Named story flags. Once set, never cleared. Use `flags.has(flag)` for conditions.

```
ONBOARDING_COMPLETE       — M-01 finished, GRETA-7 dismissed
FIRST_JOB_DONE            — M-02 complete, Marcus Tell acknowledged
UNDERGROUND_CONTACT_MADE  — E-10 read (Null's first email)
SECTOR7_SUSPECTED         — any of: ghostlily/root-bloom, pulse.news/outages, gridnetnews/sector7
SECTOR7_KNOWN             — M-04 complete, incident report in filesystem
OVERSEER_UNDERSTOOD       — vault.archive/journal-3 read
FOUNDATION_KNOWN          — vault.archive/journal-4 read
SPLICE_TRUSTED            — shadow ≥ 55 + splice.onion accessed
COMMUNE_TRUSTED           — freenode.press/operations visited + M-06 accepted
ARCHIVIST_CHAIN_COMPLETE  — M-07 complete
AGENT44_WARNED            — E-14 received (first warning)
AGENT44_ESCALATED         — E-14 received 3+ times
LOCKET_MET                — locket.exchange visited
VAULT_FOUND               — vault.archive loaded
```

---

## Trigger System Reference

Every story event fires when a **condition** is true. Conditions are checked:
- After every page navigation
- After every email read
- After every job completion
- After every terminal command
- After every rep change

### Condition types

```
PAGE_VISITED(url)                — browser navigated to this URL
EMAIL_READ(id)                   — player opened and read this email
JOB_COMPLETE(jobTitle)           — job minigame completed
TERMINAL_CONNECT(nodeId)         — terminal connected to this node
FILE_READ(path)                  — file opened in File Manager
FLAG(name)                       — flag is set
REP(axis, op, value)             — compliance|shadow >= <= == value
CREDITS(op, value)               — credits >= <= value
MISSION(id, status)              — mission in given status
BOTH(A, B)                       — both conditions true
EITHER(A, B)                     — either condition true
NOT(condition)                   — condition is false
FIRST_TIME(condition)            — condition true AND pagesTriggered doesn't have it yet
```

---

## Phase Map

Six phases + the endgame. Phase advances automatically when all phase-completion conditions are met.

---

### Phase 0 — First Boot
**Entry:** Game start. No prerequisites.
**Tone:** Normal. Helpful. Slightly sterile.

| # | Trigger | Effect |
|---|---------|--------|
| 0.1 | Game start | Deliver E-01 (GRETA-7 welcome) immediately |
| 0.2 | E-01 read | Deliver E-02 (Marcus Tell, first job) after 2 minutes |
| 0.3 | E-02 read | M-01 "First Boot" becomes active |
| 0.4 | M-01 complete | Deliver E-03 (Gridcorp HR employment agreement) immediately |
| 0.5 | E-03 read | Deliver E-04 (GRETA-7 tips) after 5 minutes |
| 0.6 | Any job completed | M-02 "Just a Job" becomes active |
| 0.7 | M-02 complete | Flag: FIRST_JOB_DONE. Deliver Memo 1 (Marcus Tell IT reminder) to filesystem |

**Phase 0 → Phase 1 trigger:** `FLAG(FIRST_JOB_DONE)`

---

### Phase 1 — First Cracks
**Entry:** First job done. Player is exploring. Corporate veneer is thin.
**Tone:** Mundane with unsettling edges. The internet feels slightly wrong.

| # | Trigger | Effect |
|---|---------|--------|
| 1.1 | Phase 1 entry | Deliver E-20 (GridMart cart spam) |
| 1.2 | Phase 1 entry | Deliver E-21 (Petra Kwan wellness spam) after 10 min |
| 1.3 | Phase 1 entry | Deliver E-22 (Clovis Marsh Q3 report spam) after 20 min |
| 1.4 | Phase 1 entry | Deliver E-23 (NoodleHut newsletter → S-02 seed) after 15 min |
| 1.5 | PAGE_VISITED('gridos.corp/trust') | Queue E-24 (Sector 7 offline alert, red herring) for 30 min later |
| 1.6 | PAGE_VISITED('yellowthread.forum') | shadow +1; set FLAG(SECTOR7_SUSPECTED) if thread read |
| 1.7 | PAGE_VISITED('ghostlily.blog/root-bloom') | shadow +2; set FLAG(SECTOR7_SUSPECTED) |
| 1.8 | PAGE_VISITED('pulse.news/outages') | shadow +1; set FLAG(SECTOR7_SUSPECTED) |
| 1.9 | FLAG(SECTOR7_SUSPECTED) set | Queue E-10 (Null's first contact) for delivery in 45 min |
| 1.10 | E-23 read | S-02 "Noodle Cipher" becomes active |
| 1.11 | S-02 complete (noodlehut.blog/cipher decoded) | Shadow +2, credits +150, journal note added |
| 1.12 | PAGE_VISITED('mtell.dev') | S-01 seed: player notices the page source comment |
| 1.13 | BOTH(FILE_READ('relay_r114_log.txt'), FILE_READ('ghost_net_capture.txt')) | S-01 "Lost Courier" becomes active |

**Phase 1 → Phase 2 trigger:** `EMAIL_READ('E-10')` (Null's first contact)

---

### Phase 2 — The Underground Is Real
**Entry:** Null has made contact. The player now knows an organized underground exists.
**Tone:** Urgent, conspiratorial. Things are moving.

| # | Trigger | Effect |
|---|---------|--------|
| 2.1 | Phase 2 entry | Flag: UNDERGROUND_CONTACT_MADE |
| 2.2 | E-10 read | Deliver E-11 (Locket, info broker intro) after 15 min |
| 2.3 | E-10 read | M-03 "Ghost Signal" becomes active |
| 2.4 | E-11 read | locket.exchange becomes accessible (shadow gate only, no email key needed) |
| 2.5 | PAGE_VISITED('locket.exchange') | Flag: LOCKET_MET; shadow +1 |
| 2.6 | M-03 complete | Deliver Memo 2 (OVERSEER anomaly preliminary) to filesystem. Deliver E-12 (Silas, Commune intro) after 20 min |
| 2.7 | E-12 read | freenode.press accessible; Commune faction introduced |
| 2.8 | PAGE_VISITED('freenode.press/manifesto') | shadow +3; compliance -3; delivers E-13 (Fray tool drop) after 30 min |
| 2.9 | E-13 read | splice_relay_path.enc decryptable (gives splice.onion relay path) |
| 2.10 | PAGE_VISITED('splice.onion') | Flag: SPLICE_TRUSTED condition started; shadow +3; compliance -4 |
| 2.11 | Deliver E-26 (DataDog rep score update) | After any rep change of ±5 |
| 2.12 | REP(compliance, >=, 65) | gridos.corp/internal unlocks; queue E-14 warning after 2 min if shadow ≥ 30 |
| 2.13 | JOB_COMPLETE('Signal Trace — Sector 4') | shadow +3; Deliver Memo 3 (Route 7G gap) to filesystem |
| 2.14 | JOB_COMPLETE('Archive Integrity Check') | shadow +2; credits +500; seeds civic.archive access |

**Phase 2 → Phase 3 trigger:** `MISSION(M-03, complete)`

---

### Phase 3 — Behind the Curtain
**Entry:** M-03 done. The Sector 7 cover-up is no longer a rumour.
**Tone:** The horror is institutional. People made these choices. People are still making them.

| # | Trigger | Effect |
|---|---------|--------|
| 3.1 | Phase 3 entry | Deliver E-25 ("are you listening?") after 90 min (see Archivist Chain) |
| 3.2 | M-04 "Behind the Curtain" trigger | Deliver E-12 (if not already received) or push M-04 active via Silas email |
| 3.3 | M-04 objective: find Sector 7 incident report | File appears after JOB_COMPLETE('Compliance Queue Auditor') OR hacking corp-443 |
| 3.4 | M-04 complete | Flag: SECTOR7_KNOWN; Deliver Memo 4 (FOUNDATION annual review); Task Manager shows truth.exe |
| 3.5 | FILE_READ('GC-INT-2058-S7-FINAL.pdf') | shadow +2; compliance -2; M-04 objective updated |
| 3.6 | S-01 objectives met | Credits +1200; shadow +2; Deliver Memo 3 if not already delivered |
| 3.7 | REP(compliance, >=, 65) + PAGE_VISITED('gridos.corp/internal') | New content line appears on page (OVERSEER advisory) |
| 3.8 | overseerFlag ≥ 40 | Deliver E-14 (Agent 44 first warning). overseerFlag +10 per underground action |
| 3.9 | overseerFlag ≥ 70 | Deliver E-14 again (second warning). Flag: AGENT44_WARNED |
| 3.10 | overseerFlag ≥ 90 | Flag: AGENT44_ESCALATED; E-14 third delivery; compliance -10 |
| 3.11 | JOB_COMPLETE('Deep Scan') | M-05 objective component complete; Deliver Memo 5 (Splice monitoring) |
| 3.12 | PAGE_VISITED('civic.archive/rootbloom-timeline') | shadow +2; seeds M-04 alternative route |

**Phase 3 → Phase 4 trigger:** `BOTH(MISSION(M-04, complete), FLAG(UNDERGROUND_CONTACT_MADE))`

---

### Phase 4 — Going Deeper
**Entry:** The player knows what Sector 7 is. Factions are in play. The Archivist chain is running.
**Tone:** Choices feel weighted. Rep choices have real consequences now.

| # | Trigger | Effect |
|---|---------|--------|
| 4.1 | Phase 4 entry | M-05 "The Splice Job" becomes active (if not already) |
| 4.2 | Phase 4 entry | M-06 "Deep Cover" available via freenode.press/operations |
| 4.3 | M-05 complete | shadow +5; compliance -5; Deliver Memo 5 if not already; archivistKeys.step3 becomes available |
| 4.4 | M-06 complete | shadow +5; compliance -4; credits +3500; Deliver Memo 6 |
| 4.5 | PAGE_VISITED('vault.archive') | Flag: VAULT_FOUND; M-07 "The Archivist" active |
| 4.6 | Archivist chain step 3 complete | unlock lena_arc_protected; civic.archive/protected accessible |
| 4.7 | Archivist chain step 4 complete | Flag: FOUNDATION_KNOWN; M-07 complete |
| 4.8 | JOB_COMPLETE('Corporate Mole') | shadow +5; compliance -4; M-06 complete |
| 4.9 | REP(shadow, >=, 55) | splice.onion full access; locket.exchange/intel unlocks |
| 4.10 | E-27 delivered (Gridcorp password reset phishing) | If clicked/engaged: credits -200, compliance -5, lesson logged |
| 4.11 | JOB_COMPLETE('Social Engineer — ClearPath') | S-04 "The Phisher" available |
| 4.12 | TERMINAL_CONNECT('ghost-net-55') | splice_relay_path.enc added to filesystem (if not already) |
| 4.13 | TERMINAL_CONNECT('corp-443') | Memo files unlocked in terminal; compliance -8; overseerFlag +15 |

**Phase 4 → Phase 5 trigger:** `MISSION(M-07, complete)`

---

### Phase 5 — Convergence
**Entry:** The Archivist chain is complete. FOUNDATION is known. Everything is in motion.
**Tone:** Quiet dread. The player now knows more than most people ever will.

| # | Trigger | Effect |
|---|---------|--------|
| 5.1 | Phase 5 entry | M-08 "Gridfall" becomes active |
| 5.2 | Phase 5 entry | void-77 terminal node becomes connectable |
| 5.3 | TERMINAL_CONNECT('void-77') | archivist_final_message.txt added to filesystem |
| 5.4 | FILE_READ('archivist_final_message.txt') | splice.onion/thread/archivist gains null's reply: "they left something. find it." |
| 5.5 | Phase 5 entry | Null emails the player with M-08 briefing (from Null + Silas) |
| 5.6 | Phase 5 entry | GRETA-7 sends one final email — subtly wrong tone, slightly too helpful |
| 5.7 | S-05 available via hex-shop.void (shadow ≥ 50) | Side content, optional before M-08 |
| 5.8 | S-06 available via locket.exchange | Browser deep-dive optional mission |
| 5.9 | overseerFlag ≥ 90 AND phase ≤ 4 | Director Sorin email delivered — compliance audit warning |

**Phase 5 → Phase 6 trigger:** `MISSION(M-08, active)` + player makes Gridfall choice

---

### Phase 6 — Gridfall
**Entry:** M-08 active. Three paths. Irreversible.

See **Endings** section below.

---

## Email Timeline

Ordered delivery reference. All times are post-trigger delays in real minutes.

```
BOOT
├── E-01  GRETA-7     "Welcome to GridOS"                  → immediate on game start
├── E-02  Marcus      "Your first shift"                   → +2 min after E-01 read
├── E-03  Gridcorp HR "Your employment agreement"          → immediate after M-01 complete
├── E-04  GRETA-7     "Tips for new employees"             → +5 min after E-03 read

PHASE 1 (first job done)
├── E-20  GridMart    "You left items in your cart!"        → immediate on phase 1 entry
├── E-21  Petra Kwan  "Wellness Wednesday"                  → +10 min
├── E-22  Clovis      "Gridcorp Q3 Report"                  → +20 min
├── E-23  NoodleHut   "This month's noodle pick"            → +15 min  → triggers S-02
├── E-24  GridNet     "Breaking: Sector 7 offline"          → +30 min after gridos.corp/trust visit (RED HERRING)
├── E-26  DataDog     "Your rep score this week"            → any time rep changes ±5 (repeating)

SECTOR7_SUSPECTED flag set (ghostlily/forum/pulse visit)
└── E-10  Null        "[no subject]"                        → +45 min after flag set

E-10 read (phase 2 entry)
├── E-11  Locket      "Package available"                   → +15 min
└── E-12  Silas       "The truth about Gridcorp"           → +20 min after M-03 complete

E-12 read
└── E-13  Fray        "Tool drop"                          → +30 min after freenode.press/manifesto visited

M-04 complete (phase 3)
└── E-25  [encrypted] "are you listening?"                 → +90 min after phase 3 entry

Any underground action that raises overseerFlag
├── E-14  Agent 44    "Warning: Unauthorized access"        → overseerFlag ≥ 40, ≥ 70, ≥ 90 (3 waves)
└── E-27  GridCorp    "Mandatory password reset"            → overseerFlag ≥ 60 (phishing trap)

Phase 5 entry
├── Null / Silas  M-08 briefing                            → immediate
└── GRETA-7       Final email (wrong tone)                 → +30 min
```

### E-10 (Null) — Full Content

> [no subject]
>
> You've been looking at the right things. That's unusual.
>
> I have work, if you're interested. The pay is real. The risk is real too.
>
> Reply to this address if you want to know more. If you forward it, you won't hear from me again.
>
> — Null

*Mechanic: "Replying" opens the M-03 briefing. Forwarding to any address sets `FLAG(BURNED_BY_TRUST)` and delays E-11 by 24 hours.*

### E-25 ([encrypted]) — Full Content

> are you listening?
>
> four years ago someone built a place to put the things that couldn't be said anywhere else.
>
> they're gone now. the place is still there.
>
> vault.archive
>
> the door is unlocked.

*Mechanic: visiting vault.archive after this email auto-grants `vault_arc_open`. Visiting before this email delivers a 404.*

---

## Mission Details

### M-01 — First Boot
**Giver:** GRETA-7 (onboarding AI)
**Trigger:** Game start
**Objectives:**
1. Open the browser and visit gridos.corp
2. Open the email client and read all 4 onboarding emails
3. Open the file manager and view your home directory
**Completion condition:** All 3 objectives met
**Reward:** ₳100 starting bonus, GRETA-7 "dismissed" (but she keeps watching)
**Notes:** This is the tutorial. Cannot fail.

---

### M-02 — Just a Job
**Giver:** Marcus Tell (E-02)
**Trigger:** E-02 read
**Objectives:**
1. Complete one job from gridos.corp/careers or clearpath.gridcorp.net
**Completion condition:** Any job completed
**Reward:** ₳80–420 depending on job, compliance +1, flag FIRST_JOB_DONE
**Notes:** Marcus doesn't explain the stakes. He barely knows them himself.

---

### M-03 — Ghost Signal
**Giver:** Null (E-10)
**Trigger:** E-10 read + replied
**Objectives:**
1. Find a hidden file on the Gridcorp intranet (gridos.corp/internal or /compliance)
2. Export the file — one of: ROOT BLOOM reclassification memo, OVERSEER advisory, compliance queue data
3. Return confirmation to Null (mark job as delivered via email reply)
**Completion condition:** Any internal Gridcorp page visited AND compliance ≥ 65 OR file extracted via terminal
**Reward:** ₳600, shadow +3, Memo 2 to filesystem, E-12 triggered
**Failure state:** overseerFlag ≥ 90 before completion → M-03 fails → Agent 44 email → compliance -15 → M-03 reattempt after 48 hour cooldown

---

### M-04 — Behind the Curtain
**Giver:** Silas Okafor (E-12)
**Trigger:** E-12 read
**Objectives:**
1. Find the Sector 7 incident report (GC-INT-2058-S7-FINAL.pdf)
   - Route A: Complete "Compliance Queue Auditor" job → file delivered as reward
   - Route B: Terminal hack corp-443 → file in remote filesystem → exfil
2. Cross-reference the maintenance date against gridnetnews.com/sector7-maintenance
3. Read ghostlily.blog/root-bloom (if not already)
**Completion condition:** FILE_READ('GC-INT-2058-S7-FINAL.pdf') + PAGE_VISITED('gridnetnews.com/sector7-maintenance')
**Reward:** ₳800, shadow +4, compliance -3, Memo 4 to filesystem, FLAG(SECTOR7_KNOWN), truth.exe appears in Task Manager
**Failure state:** Cannot truly fail — Silas keeps the mission open indefinitely. Agent 44 may escalate if overseerFlag rises.

---

### M-05 — The Splice Job
**Giver:** Fray (via splice.onion/jobs)
**Trigger:** splice.onion accessible AND job accepted
**Objectives:**
1. Complete the "Deep Scan — Target Device" job from splice.onion/jobs
2. Deliver result to Fray via splice.onion reply
**Completion condition:** JOB_COMPLETE('Deep Scan — Target Device')
**Reward:** ₳1200, shadow +5, compliance -5, Memo 5 to filesystem
**Notes:** This is the point of no return for the Splice path. Agent 44 will notice.

---

### M-06 — Deep Cover
**Giver:** Commune (freenode.press/operations)
**Trigger:** freenode.press/operations visited AND job accepted
**Prerequisites:** shadow ≥ 40 (to see operations page)
**Objectives:**
1. Complete the "Corporate Mole — Gridcorp Compliance" contract
2. Extract at minimum 1 document from gridos.corp/compliance while appearing Trusted
3. Route document to freenode.press via anonymous drop
**Completion condition:** JOB_COMPLETE('Corporate Mole — Gridcorp Compliance')
**Reward:** ₳3500, shadow +5, compliance -4, Memo 6 to filesystem, Commune fully trusts player
**Failure state:** overseerFlag ≥ 90 mid-mission → blown cover → compliance -20 → M-06 failed → Commune still trusts player but at reduced capacity

---

### M-07 — The Archivist *(self-triggered)*
**Giver:** E-25 ("are you listening?")
**Trigger:** E-25 read → vault.archive visited
**This is the Archivist chain — 4 sequential steps:**

```
Step 1:  vault.archive loads (granted by E-25 → vault_arc_open key)
         → Read the landing page
         → vault.archive/journal-1 becomes readable
         → archivistKeys.step1 = true

Step 2:  vault.archive/journal-1 read
         → auto-unlocks vault_arc_j2 (the 'unlocks' field fires)
         → journal-1 body contains: "hex string in the margin: 5061727432"
           (decodes to "Part2" — directional hint, not a hard cipher)
         → vault.archive/journal-2 becomes readable
         → archivistKeys.step2 = true

Step 3:  vault.archive/journal-2 read
         → auto-unlocks vault_arc_j3
         → journal-2 reveals Cascade pre-proposal discrepancy
         → CROSS-REFERENCE: if PAGE_VISITED('gridos.corp') is true,
           a new journal note fires: "the date is wrong. they told us 2041.
           the proposal says 2040. one of those is a lie."
         → archivistKeys.step3 = true

Step 4:  vault.archive/journal-3 read
         → auto-unlocks vault_arc_j4
         → auto-unlocks lena_arc_protected → civic.archive/protected accessible
         → flag OVERSEER_UNDERSTOOD
         → archivistKeys.step4 = true

Step 5:  vault.archive/journal-4 read
         → flag FOUNDATION_KNOWN
         → M-07 COMPLETE
         → void-77 terminal node connectable
         → M-08 unlocked
```

**Completion reward:** ₳0 (this is not a job). shadow +5, compliance -3.
**Notes:** M-07 can run in parallel with M-04, M-05, M-06. There is no time pressure. The chain waits.

---

### M-08 — Gridfall *(final mission)*
**Giver:** Null + Silas (joint email after M-07 complete)
**Trigger:** FLAG(FOUNDATION_KNOWN) + Phase 5 entry
**Context:** The player has proof that FOUNDATION exists and is maintained. Null wants to leak the infrastructure location. Silas wants it published globally. The choice is the player's.

**The three options (presented in-game as a final decision screen):**

```
OPTION A — EXPOSE
  Action:  Send FOUNDATION documentation to gridnetnews.com and freenode.press simultaneously
  Requires: compliance ≤ 60 OR shadow ≥ 60 (player must have chosen a side)
  Outcome:  → Ending A (see Endings)

OPTION B — BURY
  Action:  Delete the documentation. Cooperate with Director Sorin (optional path she's been offering)
  Requires: compliance ≥ 60 (player has stayed mostly corporate)
  Outcome:  → Ending B (see Endings)

OPTION C — BURN
  Action:  Trigger FOUNDATION yourself — use the draft authorization found via void-77
  Requires: FILE_READ('foundation_kill_authorization_draft.txt') — void-77 connection required
  Outcome:  → Ending C (see Endings)
```

---

### Side Missions

#### S-01 — Lost Courier
**Trigger:** `BOTH(FILE_READ('relay_r114_log.txt'), FILE_READ('ghost_net_capture.txt'))`
*Player notices the cycle gap without being told to look. The mission self-initiates.*
**Objectives:**
1. Cross-reference Route 7G gap with transitwatch.net (Line 7G suspended)
2. Find voidbay.net/anon-drops DROP-7G-04
3. Match with Memo 3 (GridMart Route 7G telemetry gap)
**Reward:** ₳1200, shadow +3, Memo 3 (if not already), credits from anonymous client

#### S-02 — The Noodle Cipher
**Trigger:** E-23 read → noodlehut.blog visited → noodlehut.blog/cipher visited
**Objectives:** Decode the cipher. Answer: GOOD SOUP.
**Reward:** ₳150, journal note: "Sometimes a noodle blog is just a noodle blog."

#### S-03 — Reputation Run
**Trigger:** E-26 (DataDog) received
**Objectives:** Complete tasks to raise compliance or shadow by 20 points total
**Reward:** ₳400, DataDog sends updated rep summary

#### S-04 — The Phisher
**Trigger:** JOB_COMPLETE('Social Engineer — ClearPath') + E-14 received
**Objectives:** Use social engineering mechanic against Agent 44's account
**Reward:** ₳800, shadow +4, compliance -3, one of Agent 44's internal documents revealed

#### S-05 — Hex's Errand
**Trigger:** hex-shop.void accessible (shadow ≥ 50) + item reserved
**Objectives:** Retrieve a flagged item from a GridMart drop location without triggering compliance scan
**Reward:** ₳900, shadow +3, darkrow.market item unlocked

#### S-06 — GridSocial Stalker
**Trigger:** locket.exchange/intel accessed + Locket assigns task
**Objectives:** Cross-reference 3 NPC profiles on gridsocial.net to find a hidden connection
**Reward:** ₳600, shadow +2, one civic.archive record unlocked

---

## The Archivist Chain — Key & Lock Reference

```
KEY               HOW OBTAINED                           UNLOCKS
────────────────────────────────────────────────────────────────────────────────
vault_arc_open    E-25 received + vault.archive visited  vault.archive index
vault_arc_j2      vault.archive/journal-1 read           vault.archive/journal-2
vault_arc_j3      vault.archive/journal-2 read           vault.archive/journal-3
vault_arc_j4      vault.archive/journal-3 read           vault.archive/journal-4
lena_arc_protected vault.archive/journal-3 read          civic.archive/protected
null54_escalated  overseerFlag ≥ 85 + Watch app misuse   void.null/54
```

---

## Reputation Gates Summary

| Threshold | What Unlocks |
|-----------|-------------|
| shadow ≥ 10 | zeroday.eats, voidthreads.shop visible |
| shadow ≥ 15 | spliceparts.net, deepfreq.stream accessible |
| shadow ≥ 30 | civic.archive/flowering, voidbay.net, freenode.press |
| shadow ≥ 35 | darkfeed.onion |
| shadow ≥ 40 | voidbay.net/anon-drops, freenode.press/operations |
| shadow ≥ 50 | darkrow.market, hex-shop.void, S-05 available |
| shadow ≥ 55 | splice.onion, locket.exchange, civic.archive/rootbloom-timeline |
| compliance ≥ 30 | clearpath.gridcorp.net |
| compliance ≥ 65 | gridos.corp/internal, gridos.corp/compliance |
| compliance ≥ 65 + shadow ≥ 30 | Dual-access player — both corporate and underground unlocked |

---

## OVERSEER Pressure System

`overseerFlag` is a hidden score (0–100). It is never shown to the player directly. It represents how much attention OVERSEER is paying to this account.

**What raises it:**

| Action | Increase |
|--------|----------|
| Visit voidbay.net | +5 |
| Visit splice.onion | +8 |
| Complete underground job | +6 |
| Use terminal on hack node | +5 |
| Terminal on corp-443 | +15 |
| Each E-14 warning received and ignored | +8 |
| Visit vault.archive | +10 |
| M-06 Deep Cover active | +10 |
| Using "root.exe" tool from Fray | +12 |

**What lowers it:**

| Action | Decrease |
|--------|----------|
| Complete corporate jobs | -3 |
| Visit gridos.corp/compliance | -5 |
| Read gridos.corp/trust | -2 |
| compliance ≥ 75 sustained for 24 hrs | -10 |

**Threshold events:**

| overseerFlag | Event |
|-------------|-------|
| 40 | E-14 delivered: first warning from Agent 44 |
| 60 | E-27 delivered: phishing trap |
| 70 | E-14 second wave: more direct warning |
| 85 | null54_escalated key granted (Watch app users) |
| 90 | E-14 third wave: escalation confirmed. compliance -10. FLAG(AGENT44_ESCALATED) |

---

## Cross-Reference Discoveries

These are **compound triggers** — both conditions must be true before the content fires. Neither source alone is sufficient.

| Discovery | Source A | Source B | What Fires |
|-----------|----------|----------|------------|
| S-01 unlock | FILE_READ relay_r114_log.txt | FILE_READ ghost_net_capture.txt | S-01 mission activates |
| Founding date lie | PAGE_VISITED vault.archive/journal-2 | PAGE_VISITED gridos.corp | Journal note: "the date is wrong" |
| Maintenance = OVERSEER | PAGE_VISITED gridnetnews.com/sector7-maintenance | FILE_READ GC-INT-2058-S7-FINAL.pdf | Journal note: "same week" |
| Route 7G full chain | FILE_READ Memo 3 | PAGE_VISITED transitwatch.net | S-01 objective 1 complete |
| Behavioral variance pattern | PAGE_VISITED yellowthread.forum/thread/gridos-watch | PAGE_VISITED splice.onion/thread/sector7 | Journal note: "OVERSEER was already watching forums" |
| phosphor_veil identity | PAGE_VISITED yellowthread.forum/thread/ghost-traffic | PAGE_VISITED void-poet.words | Journal note: "same person. deep underground for years." |
| Northern campus power = FOUNDATION | PAGE_VISITED gridnetnews.com/northern-campus-power | FILE_READ vault.archive/journal-4 | Journal note: "that's where it is" |
| Clovis case study = Sector 7 cover-up | PAGE_VISITED clovis-m.pr | FILE_READ GC-INT-2058-S7-FINAL.pdf | Journal note: "he managed this as a PR win" |
| lena.arc = The Archivist | PAGE_VISITED deepfreq.stream (lena.arc playlist) | PAGE_VISITED civic.archive/protected | Journal note: "lena.arc was their handle" |

---

## Faction Paths

The player's `compliance` vs `shadow` balance, and their explicit choices in M-08, determine which ending fires. No single choice locks a path — the final score matters more.

### The Alignment Matrix

```
              SHADOW LOW          SHADOW HIGH
COMPLIANCE   ┌──────────────────┬──────────────────┐
HIGH         │  GRIDCORP LOYAL  │  DOUBLE AGENT    │
             │  Ending B path   │  Endings A or B  │
             ├──────────────────┼──────────────────┤
LOW          │  CHAOTIC         │  UNDERGROUND     │
             │  Endings A or C  │  Endings A or C  │
             └──────────────────┴──────────────────┘
```

### Rep Effects Summary

**Compliance up:** corporate jobs, trust & safety pages, gridsocial corp visits, gridnetnews
**Compliance down:** underground sites, underground jobs, Archivist journals, void layer
**Shadow up:** forum, ghostlily, underground jobs, Splice access, Archivist chain, void layer
**Shadow down:** corporate-only activities sustained, betraying Null (see below)

### Choice Points That Affect Alignment

| Moment | Corp Choice | Underground Choice |
|--------|-------------|-------------------|
| E-10 — Reply to Null | Reply → underground track | Ignore → +5 compliance |
| E-10 — Forward to GridOS | +10 compliance, -30 shadow, FLAG(BURNED_TRUST) | — |
| M-03 — Report internal page visit | compliance +8, shadow -10 | — |
| M-05 — Accept Splice Job | shadow +5 | — |
| M-06 — Accept Commune job | shadow +5 | compliance -4 |
| M-08 — Final choice | Bury = corp | Expose/Burn = underground |

---

## The Three Endings

### Ending A — Expose
**Condition:** gridfallChoice === 'expose'
**Requires:** shadow ≥ 40 OR compliance ≤ 60

**Sequence:**
1. FOUNDATION documentation sent to gridnetnews.com and freenode.press
2. 48-hour news cycle — gridnetnews.com homepage updates with breaking story
3. Director Sorin email arrives: "This will not stand."
4. GRETA-7 delivers final message — her warmth is suddenly, completely gone. She says: *"Behavioral variance logged. Account flagged. Have a safe day."*
5. Player account gets "OVERSEER REVIEW" notice — but it's too late, the data is out
6. Final screen: the article is spreading. Gridcorp's stock drops 14%. The Cascade is being discussed again.
7. End state: *"The record exists now. You can't unread it. Neither can they."*

**Tone:** Bittersweet. The world didn't end. Nothing was fixed. But someone knows.

---

### Ending B — Bury
**Condition:** gridfallChoice === 'bury'
**Requires:** compliance ≥ 60

**Sequence:**
1. Documentation deleted. Director Sorin email acknowledges: *"The right choice."*
2. Compliance score jumps +20 — Trusted tier
3. GRETA-7 is warm, encouraging, completely normal. This is the worst version of her.
4. All underground connections go quiet — Null's account goes inactive, Locket stops responding
5. A week later, E-26 (DataDog) arrives with a note: *"Your behavioral profile has been marked compliant. Monitoring reduced."*
6. Final screen: the player's account, in a grid of 340 million others. One dot among many.
7. End state: *"You made the reasonable choice. So did everyone else."*

**Tone:** The horror of complicity. Comfortable and hollow.

---

### Ending C — Burn
**Condition:** gridfallChoice === 'burn'
**Requires:** FILE_READ('foundation_kill_authorization_draft.txt') — must have connected void-77

**Sequence:**
1. FOUNDATION triggers. Not a full shutdown — a degradation.
2. A series of brief system status notifications appear: transit, healthcare, finance — all showing delays, errors, "optimization events"
3. GRETA-7 does not respond
4. gridnetnews.com updates: "GridOS experiencing widespread instability. No estimated resolution."
5. Director Sorin sends one final email: *"Do you understand what you've done?"*
6. No reply option is available
7. Final screen: the city at night. Lights flickering in some sectors. Steady in others.
8. End state: *"It worked. You're not sure what you've proven."*

**Tone:** Pyrrhic. The point was never power — it was proof. This ending proves something different.

---

## Red Herring Trigger Reference

These fire and resolve as dead ends. They should feel meaningful. They aren't.

| ID | Entry Point | Trigger | Resolution |
|----|-------------|---------|------------|
| RH-01 | E-22 Clovis Q3 report | EMAIL_READ('E-22') | Visiting the stat → contradicts pulse.news, but neither is a real number |
| RH-02 | E-24 Sector 7 offline | PAGE_VISITED after E-24 | Just a maintenance notice, no new content |
| RH-03 | mtell.dev source | PAGE_VISITED('mtell.dev') | Old password fragment used in S-01 only, looks like a cipher, isn't |
| RH-04 | gridsocial mysterious user | PAGE_VISITED('gridsocial.net/profile/mysterious-user') | Three mundane posts. Nothing else. If player investigates: "sometimes it's nothing" |
| RH-05 | E-27 password reset | EMAIL_READ('E-27') → link clicked | Costs ₳200, compliance -5, journal note: "you should have known better" |
| RH-06 | noodlehut.blog/about | PAGE_VISITED after S-02 | Completely normal about page. No mission content. |
| RH-07 | gitdrop.io/fray README | PAGE_VISITED after splice access | Commit #44 message is flavor — not a mission trigger |

---

## Journal Notes System

The player has a personal journal that accumulates automatic entries when cross-reference discoveries fire. These are NOT missions — they're the player's own record of what they've figured out.

```typescript
interface JournalEntry {
  id:        string
  timestamp: number
  text:      string
  trigger:   string  // the discovery that fired it
}
```

Journal entries use first-person past tense. Example:
> *"The maintenance window started the same week OVERSEER was isolated. They called it subsystem dependencies. They were managing the leak."*

These entries are the player's private record of the truth — they accumulate regardless of faction choice and cannot be deleted.

---

## Story Pacing Reference

Approximate time-to-beat per phase for a moderately exploring player.

| Phase | Min Time | Expected | Notes |
|-------|----------|----------|-------|
| 0 | 5 min | 15 min | Tutorial, emails, first browse |
| 1 | 20 min | 45 min | Exploration, first underground hints |
| 2 | 30 min | 60 min | Underground contact, faction intro |
| 3 | 45 min | 90 min | Sector 7 reveal, rep decisions |
| 4 | 60 min | 120 min | Archivist chain, deep content |
| 5 | 20 min | 40 min | Convergence, final setup |
| 6 | 5 min | 15 min | The choice + ending |
| **Total** | **~3 hours** | **~6 hours** | For completionists: 10+ hours |

---

## Implementation Checklist

Ordered by dependency — build these in sequence.

```
[ ] storyStore.ts       — all state variables, triggers, flag system
[ ] emailQueue.ts       — timed delivery, condition checks, inbox management
[ ] phaseEngine.ts      — phase advancement conditions + side effects
[ ] overseerEngine.ts   — hidden pressure accumulation + threshold events
[ ] crossRefEngine.ts   — compound trigger detection (URL + file combos)
[ ] journalStore.ts     — private player notes accumulation
[ ] missionStore.ts     — mission state, objectives, completion logic
[ ] archivistChain.ts   — key/lock system for vault.archive progression
[ ] endingEngine.ts     — M-08 choice handling + three ending sequences
[ ] repGate.ts          — shadow/compliance gate checks across all systems
```
