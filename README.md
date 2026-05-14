# GridOS

> *You don't use GridOS. GridOS uses you.*

GridOS is a browser-based MMO where the entire game world is a fake operating system owned by a megacorporation. Hack networks, work corporate jobs, join guilds, trade on the market, and explore a lore-filled web — all without ever leaving your desktop.

---

## Tech Stack

- **Vite + React + TypeScript** — app shell & game UI
- **Zustand** — global game state (25+ slices)
- **TailwindCSS** — dark OS aesthetic
- **Supabase** — auth, player data, real-time
- **React Router** — login vs. shell routing

---

## Getting Started

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key
npm install
npm run dev
```

---

## Project Structure

```
src/
  components/     # Core OS shell (Window, Taskbar, Desktop, BootScreen, StartMenu)
  apps/           # In-OS applications (Terminal, Browser, JobBoard, NodeApp, WatchApp, etc.)
  store/          # Zustand state slices + TriggerEngine
  lib/            # Supabase client, helpers
  hooks/          # Custom React hooks
  data/           # Static lore and game data
  pages/          # Boot / Login / Registration screens
  styles/         # Global CSS
supabase/         # Migrations and edge functions
docs/             # Design docs and lore bible
```

---

## What's Built

### OS Shell
- [x] Boot sequence with animated terminal output
- [x] Login / Registration screens
- [x] Desktop with draggable, resizable windows
- [x] Taskbar with app switcher and system tray
- [x] Start Menu with app launcher

### Apps
| App | Description |
|-----|-------------|
| `Terminal` | Full command-line interface with lore-aware commands |
| `WatchApp` | Real-time market surveillance and trading |
| `NodeApp` | Network node hacking minigame |
| `CourierApp` | Package delivery job system |
| `JobBoard` | Browse and accept available jobs |
| `DataBrokerApp` | Buy and sell stolen data |
| `CheckpointApp` | Faction checkpoint puzzle |
| `CipherApp` | Cryptography minigame |
| `MapApp` | District map with points of interest |
| `MailApp` | In-world email client |
| `GridBrowser` | Fake in-world browser with lore pages |
| `FileSystem` | Fake file manager with hidden lore files |
| `OpsApp` | Corporate ops scanning tool |
| `ArchivistApp` | Lore archive and document viewer |
| `ConnectionsApp` | NPC relationship tracker |
| `RelayApp` | Signal relay hacking tool |
| `SocketApp` | Raw socket connection tool |
| `PulseReaderApp` | Corporate network pulse scanner |
| `CitizenIDApp` | Player identity card |
| `SettingsApp` | OS settings and display options |
| `AppStore` | In-world app marketplace |

### Systems
- [x] **TriggerEngine** — event-driven narrative trigger system
- [x] **Story System** — branching story state with shim bridge
- [x] **Mission System** — mission state and progress tracking
- [x] **Save System** — multi-slot save/load via Supabase
- [x] **Wallet** — in-world currency (CredChips)
- [x] **Reputation** — per-faction reputation tracking
- [x] **Notification System** — OS-style toast notifications
- [x] **Email Queue** — scheduled in-world email delivery
- [x] **NPC System** — NPC state, dialogue flags
- [x] **Inventory** — item tracking
- [x] **Relay Network** — signal chain system
- [x] **Unlock System** — feature/app unlock gating

---

## Roadmap

- [ ] Supabase persistence for mission + story state
- [ ] Guild system
- [ ] Player-to-player market / economy
- [ ] Multiplayer relay chains
- [ ] More lore: factions, districts, NPCs
- [ ] Mobile layout polish

---

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Contributing

This project is in active development. The lore bible and design docs live in `/docs`. If you're contributing, read those first — everything in GridOS exists within the fiction of the Grid.

---

*Built with TypeScript, React, Supabase, and too much lore.*
