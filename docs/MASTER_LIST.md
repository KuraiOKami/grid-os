# GridOS — Master Content Build List

> A comprehensive reference for all lore, content, and systems that need to be created for the GridOS browser MMO.

---

## Overview

GridOS is a browser-based MMO set inside a fake operating system owned by a megacorporation called **Gridcorp**. The world is experienced entirely through in-OS apps: a fake browser, email client, terminal, file manager, and more. Everything the player reads, clicks, and discovers *is* the world. This document tracks every piece of content that must be created.

---

## 🏢 NPCs (Non-Player Characters)

NPCs are entities the player interacts with via emails, chat apps, job boards, and in-world websites. Each NPC needs: a name, role, faction affiliation, communication style, and purpose in the narrative.

### Core / Tutorial NPCs
| Name | Role | Faction | Purpose |
|------|------|---------|---------|
| GRETA-7 | Onboarding assistant AI | Gridcorp | Tutorial guide, subtly sinister |
| Marcus Tell | IT Help Desk | Gridcorp | Early job giver, throwaway contact |
| "Null" | Unknown hacker | Underground | First underground contact, sends cryptic emails |

### Faction NPCs — Gridcorp (Corporate)
| Name | Role | Notes |
|------|------|-------|
| Director Yael Sorin | VP of Compliance | Antagonist figure, sends surveillance warnings |
| Agent 44 | Internal Security | Sends threatening emails to rule-breakers |
| Petra Kwan | HR Department | Spam, fake wellness emails, corporate red herrings |
| Clovis Marsh | PR Division | Sends fake positive news blasts about Gridcorp |

### Faction NPCs — The Splice (Underground Hackers)
| Name | Role | Notes |
|------|------|-------|
| Null | Cell leader | First contact, mission giver |
| Fray | Tech expert | Provides hacking tools, forum posts |
| Locket | Information broker | Sells intel via dark web site |
| Devi Rowe | Field operative | Mission support, disposable contact |

### Faction NPCs — The Commune (Anti-Corp Activists)
| Name | Role | Notes |
|------|------|-------|
| Silas Okafor | Commune founder | Sends manifestos, mission giver |
| Mira Vos | Media contact | Runs underground news site |

### Faction NPCs — Neutral / Market
| Name | Role | Notes |
|------|------|-------|
| Hex | Black market vendor | Sells upgrades via dark web shop |
| DataDog | Reputation tracker | Sends player rep scores via email |
| The Archivist | Lore keeper | Hidden NPC, found via puzzle |

---

## 🌐 In-World Websites (Fake Browser Content)

All rendered inside the GridOS fake browser app. Each site needs: URL slug, visual style, content pages, and lore purpose.

### Corporate / Public-Facing
| Site Name | URL | Purpose |
|-----------|-----|---------|
| Gridcorp Official | gridcorp.net | Megacorp homepage, propaganda, job listings |
| GridNet News | gridnetnews.com | State-controlled news, red herring stories |
| ClearPath HR Portal | clearpath.gridcorp.net | Employee portal, used in jobs |
| GridMart | gridmart.shop | Corporate e-commerce, some items are clues |
| Gridcorp Careers | careers.gridcorp.net | Job board for in-game jobs |

### Underground / Hidden
| Site Name | URL | Purpose |
|-----------|-----|---------|
| The Splice Forum | splice.onion | Hacker forum, mission boards, lore drops |
| Darkrow Market | darkrow.market | Black market for tools and upgrades |
| The Commune Zine | freenode.press | Anti-Gridcorp manifesto site, Commune faction |
| Locket's Exchange | locket.exchange | Info broker, pay-to-unlock lore |
| The Vault | vault.archive | Hidden lore site unlocked via puzzle chain |

### Personal / Social (Red Herrings + Depth)
| Site Name | URL | Purpose |
|-----------|-----|---------|
| GridSocial | gridsocial.net | Fake social network, NPC profiles, rabbit holes |
| NoodleHut Blog | noodlehut.blog | Fake food blog — red herring, hides a cipher |
| Marcus Tell's Portfolio | mtell.dev | IT NPC's personal site, hidden file in source |
| Fray's GitDrop | gitdrop.io/fray | Fake code repo with hidden mission trigger |

---

## 📧 Emails

Emails are received in the in-OS mail client. They serve as quest starters, lore delivery, red herrings, and spam. Each email needs: sender, subject, body, trigger condition, and follow-up behavior.

### Onboarding Emails
| # | Sender | Subject | Purpose |
|---|--------|---------|---------|
| E-01 | GRETA-7 | Welcome to GridOS | Tutorial kickoff |
| E-02 | Marcus Tell | Your first shift | Delivers first job |
| E-03 | Gridcorp HR | Your employment agreement | Red herring / lore |
| E-04 | GRETA-7 | Tips for new employees | Soft tutorial tips |

### Mission-Critical Emails
| # | Sender | Subject | Purpose |
|---|--------|---------|---------|
| E-10 | Null | [no subject] | First underground contact, mission trigger |
| E-11 | Locket | Package available | Unlocks info broker shop |
| E-12 | Silas Okafor | The truth about Gridcorp | Commune faction intro |
| E-13 | Fray | Tool drop | Delivers hacking utility |
| E-14 | Agent 44 | Warning: Unauthorized access | Consequence email after a hack |
| E-15 | Devi Rowe | Safe house coordinates | Mid-game mission |

### Spam / Red Herring Emails
| # | Sender | Subject | Notes |
|---|--------|---------|-------|
| E-20 | GridMart | 🛒 You left items in your cart! | Spam, one hidden coupon code is a clue |
| E-21 | Petra Kwan | Wellness Wednesday 💪 | Corporate wellness spam, red herring |
| E-22 | Clovis Marsh | Gridcorp Q3 Report — Record Profits! | PR spam, contains a false stat used in mission |
| E-23 | NoodleHut Newsletter | This month's noodle pick 🍜 | Spam that leads to NoodleHut cipher |
| E-24 | GridNet Alerts | Breaking: Sector 7 offline | Red herring news alert |
| E-25 | unknown@encrypted.net | are you listening? | Cryptic, leads to The Vault puzzle |
| E-26 | DataDog | Your rep score this week | Informational, also a red herring delivery vehicle |
| E-27 | Gridcorp Security | Mandatory password reset | Red herring — clicking "reset" is a trap |

### Spam Chains (Clicking Leads to More Spam)
| Chain | Entry Point | Steps | Punchline |
|-------|------------|-------|-----------|
| GridMart Loyalty | E-20 | 3 emails escalating "deals" | Final email has encrypted attachment |
| Gridcorp Surveys | Petra Kwan email | 4 survey reminder emails | Completion grants hidden file |
| Phishing Chain | E-27 (password reset) | 2 warning emails + lockout notice | Players who click lose credits, teaches phishing awareness |

---

## 💼 Jobs (Playable Minigames)

Jobs are how players earn in-game currency. Each job is a minigame accessed through the Gridcorp Careers portal or faction job boards.

### Tier 1 — Entry Level (New Players)
| Job | Employer | Mechanic | Pay Rate |
|-----|----------|----------|----------|
| Data Entry Clerk | Gridcorp | Typing/matching minigame | Low |
| Network Monitor | Gridcorp IT | Watch logs, flag anomalies | Low |
| Credit Processor | ClearPath | Approve/deny applications via form | Low-Med |
| Courier Bot Operator | GridMart | Route-planning puzzle | Med |

### Tier 2 — Skilled (Mid Game)
| Job | Employer | Mechanic | Pay Rate |
|-----|----------|----------|----------|
| Hacker | The Splice | Terminal hacking minigame | Med-High |
| Social Engineer | Neutral | Craft phishing emails to NPCs | Med-High |
| Data Broker | Locket's Exchange | Find + sell info via browser | High |
| Security Auditor | Gridcorp (undercover) | Scan systems, report findings | High |

### Tier 3 — Black Market (Late Game)
| Job | Employer | Mechanic | Pay Rate |
|-----|----------|----------|----------|
| Ghost Operative | The Splice | Multi-step stealth mission | Very High |
| Corporate Mole | Commune | Extract documents while employed | Very High |
| Network Architect | Neutral | Build and sell fake infrastructure | Highest |

---

## 🎯 Missions (Quests)

Missions are narrative-driven objectives triggered by emails, NPCs, or discovered sites. Each mission needs: title, giver, objectives, rewards, and failure states.

### Main Story Missions
| # | Title | Giver | Summary |
|---|-------|-------|---------|
| M-01 | First Boot | GRETA-7 | Complete onboarding, set up OS |
| M-02 | Just a Job | Marcus Tell | Complete your first data entry shift |
| M-03 | Ghost Signal | Null | Locate a hidden file on the Gridcorp intranet |
| M-04 | Behind the Curtain | Silas Okafor | Discover what Sector 7 actually is |
| M-05 | The Splice Job | Fray | Execute a coordinated network breach |
| M-06 | Deep Cover | Commune | Infiltrate Gridcorp while maintaining cover job |
| M-07 | The Archivist | Self-triggered | Solve the 4-part puzzle chain to find The Vault |
| M-08 | Gridfall | Null / Silas | Final mission — player chooses a side |

### Side Missions
| # | Title | Giver | Summary |
|---|-------|-------|---------|
| S-01 | Lost Courier | Marcus Tell | Find a missing data packet via browser clues |
| S-02 | The Noodle Cipher | NoodleHut email | Decode the cipher hidden in a food blog |
| S-03 | Reputation Run | DataDog | Boost your rep score by completing tasks |
| S-04 | The Phisher | Agent 44 | Turn the trap back on Gridcorp security |
| S-05 | Hex's Errand | Hex | Retrieve a black market item without getting caught |
| S-06 | GridSocial Stalker | Locket | Dig through NPC profiles for hidden intel |

---

## 🔴 Red Herrings

Deliberate dead ends that feel meaningful but lead nowhere (or loop back to spam). These add world texture and punish mindless clicking.

| Red Herring | Entry Point | What Players Expect | Reality |
|-------------|------------|---------------------|---------|
| Gridcorp Q3 Report | E-22 | Hidden financials | Just PR fluff |
| Sector 7 Offline Alert | E-24 | Secret location | Generic maintenance notice |
| Marcus Tell's Portfolio | mtell.dev | Hidden mission | One buried comment in source code — just flavor |
| GridSocial "mysterious user" | gridsocial.net | Underground contact | Inactive account, 3 old posts, nothing else |
| Gridcorp Password Reset | E-27 | Account management | Phishing trap — costs credits, no mission |
| NoodleHut About Page | noodlehut.blog/about | Cipher context | Completely normal "about a noodle lover" page |
| Fray's GitDrop README | gitdrop.io/fray | Code with secrets | Normal README — the secret is in commit history |

---

## 🔧 Core Systems to Build

Technical components and data structures that must be implemented.

### OS Shell & UI
- [ ] Desktop environment (draggable windows, taskbar, clock)
- [ ] Boot / login screen with lore-flavored loading
- [ ] System tray (notifications, status icons)
- [ ] Right-click context menus
- [ ] Window minimize/maximize/close behavior

### In-OS Applications
- [ ] **Fake Browser** — renders in-world websites, has URL bar, bookmarks, history
- [ ] **Email Client (GridMail)** — inbox, compose, spam folder, read receipts
- [ ] **Terminal** — command-line interface for hacking minigames
- [ ] **File Manager** — displays player files, mission documents, red herring files
- [ ] **Settings App** — cosmetic OS customization, hidden lore in "about" screen
- [ ] **Task Manager** — shows "running processes," some are mission clues
- [ ] **Calculator** — functional; one easter egg code unlocks hidden content
- [ ] **Chat App (GridTalk)** — NPC real-time-style messaging for mission delivery

### Game Systems
- [ ] **Player reputation system** — per-faction rep scores (Gridcorp, Splice, Commune)
- [ ] **Credit economy** — in-game currency, earn via jobs, spend via market
- [ ] **Inventory / item system** — hold tools, documents, upgrades
- [ ] **Notification queue** — timed email delivery, event triggers
- [ ] **Puzzle engine** — tracks cipher/puzzle state, locks/unlocks content
- [ ] **Mission tracker** — active missions, objectives, completion state

### Backend / Data
- [ ] Supabase auth (email/password login)
- [ ] Player profile table (credits, rep scores, inventory, mission state)
- [ ] NPC relationship flags (who you've helped/betrayed)
- [ ] Timed event system (emails that arrive after X hours/actions)
- [ ] Zustand store slices for all major systems

---

## 📁 Lore Assets to Write

Written content that populates the world and gives it depth.

- [ ] **Gridcorp founding myth** — corporate "history" on gridcorp.net
- [ ] **The Grid Manifesto** — Commune's founding document on freenode.press
- [ ] **Sector 7 incident report** — classified document found via M-04
- [ ] **GRETA-7's true purpose** — hidden in a deep OS system file
- [ ] **The Archivist's journal** — 4-part document found via puzzle chain
- [ ] **NPC backstory files** — 1–2 paragraph bios for all major NPCs
- [ ] **GridNet News archive** — at least 10 fake news articles (mix of red herrings + clues)
- [ ] **Splice Forum thread archive** — 5–10 fake forum threads with player-adjacent lore
- [ ] **Gridcorp internal memos** — 6 memos found as mission rewards / file drops

---

## 🧩 Easter Eggs & Hidden Content

- [ ] Calculator easter egg — enter `1337` to unlock a hidden note
- [ ] Task Manager — one "process" named `truth.exe` appears after M-04
- [ ] The Archivist — 4-step puzzle chain ending in The Vault lore dump
- [ ] Commit history easter egg on Fray's GitDrop
- [ ] GRETA-7 breaks character if player completes Gridfall on the Commune side
- [ ] Hidden `<!-- comment -->` in Marcus Tell's portfolio site source
