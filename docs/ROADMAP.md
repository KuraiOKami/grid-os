# GridOS — Roadmap

> This is the living development roadmap. It covers not just what features are left, but *how* they should be built.

---

## Priority 1 — GridBrowser: Real Website Rendering

This is the most immersion-critical upgrade in the entire project. Right now `GridBrowser` renders all sites as flat monospace text blocks — every site looks identical. The goal is to make in-world websites feel like *actual websites*, with unique layouts, visual identities, and personalities per faction/corp.

### The Problem

The current renderer in `GridBrowser.tsx` maps `SiteContentRow` types (`body`, `link`, `job`, `forum_post`) to simple divs with shared styles. There is no per-site layout, no typography variation, no visual identity. A megacorp home page looks the same as an underground hacker forum.

### The Vision

Each site should have its own **site theme** — a named design preset that controls color palette, font stack, layout structure, spacing, and component style. The content data stays the same (Supabase rows); the *renderer* changes based on the site's theme.

**Example site themes to build:**

| Theme | Used by | Feel |
|-------|---------|------|
| `corp-clean` | OmniGrid Corp, GridSystems Inc | Sterile, white-on-dark, sans-serif, corporate |
| `megacorp-luxury` | AxisNet, Vance Industries | Dark navy, gold accents, editorial grid, serif headings |
| `hacker-forum` | 0x7f.net, void.run | Green-on-black terminal aesthetic, dense, monospace |
| `gov-portal` | CitizenID Bureau, Checkpoint Authority | Bureaucratic, gray, form-heavy, ID card motifs |
| `underground-market` | DataBroker nodes, black markets | Deep red/amber, classified stamps, fragmented layout |
| `news-feed` | PulseReader sources | Column layout, bylines, timestamps, headline hierarchy |
| `courier-dispatch` | CourierApp portals | Logistics aesthetic, route cards, status badges |
| `social-net` | GridConnect, Relay boards | Feed layout, avatars, reply threads, reaction counts |

### Implementation Plan

#### Step 1 — Add `theme` field to `sites` table

```sql
alter table sites add column theme text not null default 'default';
```

Then tag each site row in the Supabase seed with its appropriate theme.

#### Step 2 — Build a `SiteTheme` renderer architecture

Refactor `GridBrowser.tsx` to be theme-aware:

```
src/apps/GridBrowser/
  index.tsx          ← shell (URL bar, routing, useSite hook)
  themes/
    default.tsx      ← current fallback (monospace blocks)
    corp-clean.tsx
    megacorp-luxury.tsx
    hacker-forum.tsx
    gov-portal.tsx
    underground-market.tsx
    news-feed.tsx
    courier-dispatch.tsx
    social-net.tsx
  ThemeRegistry.tsx  ← maps theme string → component
  SiteRenderer.tsx   ← picks theme from site.theme, renders it
```

Each theme component receives `{ site: SiteRow, rows: SiteContentRow[], navigate }` and owns its full layout.

#### Step 3 — Per-theme component sets

Each theme should define its own version of:
- **Page shell** — header, nav, footer structure
- **Body block** — how paragraph text is displayed
- **Link** — inline link vs. navigation card vs. sidebar item
- **Job card** — styled to match the site's aesthetic
- **Forum post** — thread vs. feed vs. classified listing
- **Hero section** — optional full-width banner block (new `kind: 'hero'`)
- **Divider** — section separator styled to the theme

#### Step 4 — Expand `SiteContentRow` kinds

Add new content block types to allow richer pages:

| New `kind` | Description |
|------------|-------------|
| `hero` | Full-width header banner with title, tagline, optional CTA |
| `section_header` | In-page section title with optional subtitle |
| `stat_block` | Key/value grid (e.g., "Employees: 14,000 / Founded: 2031") |
| `classified` | Redacted document card with [CLASSIFIED] stamp effect |
| `image_placeholder` | Lore-described image with CSS-generated abstract art |
| `nav_links` | Horizontal nav bar rendered at top of page |
| `alert_banner` | System alert / maintenance notice bar |

#### Step 5 — Lore-accurate visual details

Sites should feel like they exist in 2057. This means:
- Corp sites use fictional domain TLDs (`.corp`, `.grid`, `.net`, `.void`)
- Timestamps show in-world calendar dates, not real dates
- Some pages have "Last updated: [in-world date]" footers
- Classified/gov sites show citizen clearance warnings
- Underground sites show uptime countdowns, "members online" fake counts
- Some body text references in-world events the player may or may not have seen

---

## Priority 2 — Supabase Persistence for Story & Mission State

The `missionStore.shim.ts` and `storyStore.shim.ts` files are placeholder bridges — story progression and mission state live in memory only and are lost on refresh. These need real Supabase tables.

**Tables to add:**
- `player_story_flags` — key/value flags per player (`{ player_id, flag_key, value, updated_at }`)
- `player_missions` — active/completed missions per player
- `player_triggers_fired` — log of TriggerEngine events that have fired

The shims should be replaced by real store implementations that read/write these tables through the Supabase client, with optimistic local updates.

---

## Priority 3 — First-Player Experience (FPX)

New players land on the desktop with no guidance. The first 5 minutes need structure:

1. **Boot sequence** drops a welcome email from "Grid Administration" into MailApp
2. Email links to `gridos.corp` in the GridBrowser — this site should be the showpiece of the new site rendering system
3. `gridos.corp` has a "Getting Started" page that explains the world and links to the JobBoard
4. Terminal `help` command lists the core loop: check mail → open browser → find a job → get paid
5. First job completion triggers a toast + an email reply — closes the loop

This entire FPX should be driven by TriggerEngine events, so it's fully data-driven and skippable for returning players.

---

## Priority 4 — Guild System

Factions already exist in the reputation system. Guilds formalize this into joinable player groups:
- `guilds` Supabase table (id, name, faction, description, founder, members)
- `ConnectionsApp` shows guild members and their rep
- Guild membership gates certain jobs and GridBrowser pages
- Guild chat via Supabase Realtime (RelayApp)

---

## Priority 5 — Player-to-Player Market

`WatchApp` has market surveillance. The missing piece is player-created listings:
- `market_listings` table (item, price, seller, quantity, expires_at)
- WatchApp gains a "Post Listing" panel
- DataBrokerApp integrates as a black market variant with different item types
- Economy balance: CredChip sinks and faucets should be logged and tunable

---

## Priority 6 — Mobile Layout

The OS shell is desktop-first. A responsive mode for mobile:
- Taskbar becomes a bottom dock
- Windows become full-screen drawers
- Start Menu becomes a bottom sheet
- Most apps already scroll cleanly — the shell chrome is the only thing that needs rework

---

## Lore Consistency Notes

When building new features, every visible string should exist within the fiction:
- Button labels should use in-world vocabulary ("CONNECT" not "Submit", "TRANSMIT" not "Send")
- Error messages should read like OS errors from 2057
- Empty states should be in-world ("No transmissions on this channel" not "No messages")
- Corp names, dates, and currencies should always be fictional

The design rule: **a player should never be reminded they're using a React app.**
