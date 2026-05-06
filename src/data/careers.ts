// careers.ts — static definitions for the 5 career paths
import type { CareerKey } from '@/store/careerStore'

export type CareerDef = {
  key: CareerKey
  name: string
  icon: string
  tagline: string
  faction: string
  repBias: string          // flavour text
  payModel: string
  color: string
  tutorial: {
    intro: string          // in-world voice, 1-2 sentences
    steps: string[]        // 3-4 mechanical steps
  }
}

export const CAREERS: CareerDef[] = [
  {
    key: 'hacker',
    name: 'Hacker',
    icon: '>_',
    tagline: 'Breach nodes. Extract data. Stay invisible.',
    faction: 'Underground',
    repBias: 'Shadow +++ / Compliance ---',
    payModel: '₳ per breach · scales with node tier',
    color: '#d6a2ff',
    tutorial: {
      intro: 'You found the Terminal. Good. Nobody handed you this access — you took it. Here is how to not get caught.',
      steps: [
        '1. Open the Terminal app. Type `scan` to list nearby nodes and their security tiers.',
        '2. Target a node with `connect <node-id>`. A breach sequence will appear — a pattern you must match within the time limit.',
        '3. Type the correct sequence characters to progress. Each tier adds more steps and less time.',
        '4. A successful breach pays ₳ and awards Hacker XP. A failed breach raises your trace level — too many failures and GridOS flags your node.',
      ],
    },
  },
  {
    key: 'auditor',
    name: 'Compliance Auditor',
    icon: '⚖',
    tagline: 'Review cases. Issue rulings. Uphold the grid.',
    faction: 'GridOS',
    repBias: 'Compliance +++ / Shadow ---',
    payModel: '₳ per case closed · bonus for escalations',
    color: '#00e5ff',
    tutorial: {
      intro: 'Welcome to the GridOS Compliance Queue. Your job is to review flagged citizen files and determine whether a case warrants escalation or clearance. Speed and accuracy both matter.',
      steps: [
        '1. Open GridBrowser and navigate to `gridos.corp/compliance`. New cases appear in your queue.',
        '2. Each case shows a citizen profile, flagged behavior, and supporting logs. Read them.',
        '3. Click Escalate to flag as a threat (Compliance +, ₳ bonus) or Clear to dismiss (neutral ₳).',
        '4. Issuing too many clearances triggers a quality review. Consistent escalations build your GridOS standing and unlock higher-pay queues.',
      ],
    },
  },
  {
    key: 'courier',
    name: 'Courier',
    icon: '⟳',
    tagline: 'Pick up. Deliver. Ask no questions.',
    faction: 'Various',
    repBias: 'Neutral — reputation shifts by who you work for',
    payModel: '₳ per delivery · danger pay on hot routes',
    color: '#ffd166',
    tutorial: {
      intro: 'You are not paid to know what is in the package. You are paid to get it there on time.',
      steps: [
        '1. Check the Job Board for active Courier contracts. Each one shows a pickup node, a delivery node, and a time limit.',
        '2. Open the Node Map and navigate to the pickup node. Type `collect` in the Terminal to grab the package.',
        '3. Route to the delivery node before the timer expires. Avoid hot nodes — GridOS patrol traffic raises your exposure.',
        '4. Deliver with `drop` at the destination. Pay is credited instantly. Danger pay is added automatically on flagged routes.',
      ],
    },
  },
  {
    key: 'broker',
    name: 'Data Broker',
    icon: '◈',
    tagline: 'Every log has a buyer. Find them first.',
    faction: 'Black Market / Corporations',
    repBias: 'Shifts based on who you sell to',
    payModel: '₳ per bundle sold · price fluctuates with supply',
    color: '#ffa94d',
    tutorial: {
      intro: 'Data does not care who owns it. You do not either. Scrape it, package it, sell it — the only rule is do not get traced.',
      steps: [
        '1. Breach or access nodes to collect raw log fragments. They appear in your File System under /data/raw.',
        '2. Open the Terminal and run `bundle <filename>` to package fragments into a sellable data bundle.',
        '3. Navigate to `voidbay.net/listings` in the Browser to post a listing, or sell directly to a corporate buyer found on corp sites.',
        '4. Corporate buyers pay more but raise your Compliance risk. VoidBay pays less but keeps you anonymous. Broker XP grows either way.',
      ],
    },
  },
  {
    key: 'archivist',
    name: 'Archivist',
    icon: '⌗',
    tagline: 'The past is being rewritten. Someone has to stop it.',
    faction: 'Civic Archive Guild',
    repBias: 'Shadow + / Compliance neutral',
    payModel: '₳ flat per record restored · slow but safe',
    color: '#7bd389',
    tutorial: {
      intro: 'The Civic Archive Guild does not pay well. They pay in something rarer — the truth staying true. If that matters to you, keep reading.',
      steps: [
        '1. Corrupted records appear in your File System as .corrupt files under /archive/. Each one is a recoverable civic document.',
        '2. Open the Terminal and run `restore <filename>` to attempt recovery. Success rate improves with Archivist level.',
        '3. Restored files can be mirrored to a civic archive node via `mirror <filename> <node-id>`. This makes them permanent and harder to erase.',
        '4. Each successful mirror pays flat ₳ from the Guild and adds Archivist XP. Some records are gated behind Shadow score — ask around.',
      ],
    },
  },
]
