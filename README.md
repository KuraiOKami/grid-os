# GridOS

> *You don't use GridOS. GridOS uses you.*

GridOS is a browser-based MMO where the entire game world is a fake operating system owned by a megacorporation. Hack networks, work corporate jobs, join guilds, trade on the market, and explore a lore-filled web — all without ever leaving your desktop.

## Tech Stack

- **Vite + React + TypeScript** — app shell & game UI
- **Zustand** — global game state
- **TailwindCSS** — dark OS aesthetic
- **Supabase** — auth, player data, real-time
- **React Router** — login vs. shell routing

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
  components/     # Reusable UI (Window, Taskbar, Terminal, etc.)
  apps/           # In-OS applications (Browser, Terminal, FileManager, etc.)
  jobs/           # Job minigames (Hacker, CreditOffice, etc.)
  store/          # Zustand global state slices
  lib/            # Supabase client, helpers
  hooks/          # Custom React hooks
  pages/          # Login / boot screen (outside OS shell)
  assets/         # Fonts, icons, static assets
  styles/         # Global CSS
```

## Roadmap

- [ ] OS Shell (desktop, taskbar, draggable windows)
- [ ] Boot / Login screen
- [ ] Fake Browser app with lore pages
- [ ] Terminal app
- [ ] Hacker job minigame
- [ ] Supabase auth + player persistence
- [ ] Guild system
- [ ] Market / economy
