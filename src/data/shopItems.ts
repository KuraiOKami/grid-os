// shopItems.ts — static item definitions for GridMart (dev-curated)
import type { CareerKey } from '@/store/careerStore'

export type ShopItem = {
  id: string
  name: string
  description: string
  cost: number
  tier: 'legal' | 'underground'
  shadowRequired?: number     // min shadow score to see/buy
  effect: string              // short mechanical description
  uses: number | null         // null = permanent passive
  relatedCareer?: CareerKey
  tags: string[]
}

export const GRIDMART_ITEMS: ShopItem[] = [
  // ── Legal — GridMart ──────────────────────────────────────────────────────
  {
    id: 'relay_booster',
    name: 'Relay Booster',
    description: 'A licensed signal amplifier. Speeds up node handshakes across the public relay layer.',
    cost: 200,
    tier: 'legal',
    effect: '+15% node connection speed for Hacker breach sequences',
    uses: null,
    relatedCareer: 'hacker',
    tags: ['hacker', 'passive', 'speed'],
  },
  {
    id: 'archive_mirror_key',
    name: 'Archive Mirror Key',
    description: 'Official access credential for one restricted civic archive path.',
    cost: 400,
    tier: 'legal',
    effect: 'Unlocks one protected civic.archive page permanently',
    uses: 1,
    relatedCareer: 'archivist',
    tags: ['archivist', 'access'],
  },
  {
    id: 'compliance_badge',
    name: 'Compliance Badge',
    description: 'Proof of civic standing, officially stamped. One-time verification boost.',
    cost: 350,
    tier: 'legal',
    effect: '+5 Compliance score (one-time)',
    uses: 1,
    relatedCareer: 'auditor',
    tags: ['compliance', 'reputation'],
  },
  {
    id: 'encrypted_drive',
    name: 'Encrypted Drive',
    description: 'Hardware-encrypted storage unit. Keeps data bundles from decaying between sessions.',
    cost: 250,
    tier: 'legal',
    effect: 'Stores up to 3 data bundles without decay',
    uses: null,
    relatedCareer: 'broker',
    tags: ['broker', 'storage', 'passive'],
  },
  {
    id: 'courier_pouch',
    name: 'Courier Pouch',
    description: 'Reinforced concealed carry. Lets you hold an additional active package.',
    cost: 180,
    tier: 'legal',
    effect: '+1 simultaneous delivery slot',
    uses: null,
    relatedCareer: 'courier',
    tags: ['courier', 'capacity', 'passive'],
  },
  {
    id: 'signal_filter',
    name: 'Signal Filter',
    description: 'Passive noise suppressor. Blends your traffic signature into background relay chatter.',
    cost: 300,
    tier: 'legal',
    effect: '-10% trace chance for 3 hack runs',
    uses: 3,
    relatedCareer: 'hacker',
    tags: ['hacker', 'stealth'],
  },
  {
    id: 'audit_macro',
    name: 'Audit Macro Pack',
    description: 'Licensed productivity toolset for GridOS compliance analysts. Pre-fills common rulings.',
    cost: 220,
    tier: 'legal',
    effect: '+20% ₳ on cleared cases for 5 sessions',
    uses: 5,
    relatedCareer: 'auditor',
    tags: ['auditor', 'efficiency'],
  },
  {
    id: 'restore_kit',
    name: 'Archive Restore Kit',
    description: 'Professional-grade data recovery suite. Increases the chance of clean restoration.',
    cost: 320,
    tier: 'legal',
    effect: '+25% restore success rate (5 uses)',
    uses: 5,
    relatedCareer: 'archivist',
    tags: ['archivist', 'efficiency'],
  },
  // ── Underground — VoidBay (Shadow ≥ 30, dev-listed) ───────────────────────
  // These are listed by devs as baseline stock; players can list their own alongside.
  {
    id: 'spoof_token',
    name: 'Spoof Token',
    description: 'Single-use forged identity token. Satisfies one GridOS compliance gate without raising your actual score.',
    cost: 340,
    tier: 'underground',
    shadowRequired: 30,
    effect: 'Bypass one Compliance gate check (single use)',
    uses: 1,
    tags: ['stealth', 'access', 'compliance'],
  },
  {
    id: 'ghost_script',
    name: 'Ghost Script',
    description: 'Wipes your breach signature from the relay log for one full session.',
    cost: 600,
    tier: 'underground',
    shadowRequired: 30,
    effect: 'Zero trace accumulation for one hack session',
    uses: 1,
    relatedCareer: 'hacker',
    tags: ['hacker', 'stealth'],
  },
  {
    id: 'root_bloom_suppressor',
    name: 'ROOT BLOOM Suppressor',
    description: 'Delays a pending GridOS compliance flag. Buys you time — not safety.',
    cost: 2200,
    tier: 'underground',
    shadowRequired: 40,
    effect: 'Delays one personal Compliance flag by 72 hours',
    uses: 1,
    tags: ['compliance', 'survival'],
  },
  {
    id: 'black_mirror_key',
    name: 'Archivist Key (Black Market)',
    description: 'Uncertified mirror credential. Works on any restricted civic.archive path, no questions asked.',
    cost: 800,
    tier: 'underground',
    shadowRequired: 30,
    effect: 'Unlocks any one civic.archive restricted path',
    uses: 1,
    relatedCareer: 'archivist',
    tags: ['archivist', 'access'],
  },
  {
    id: 'identity_veil',
    name: 'Identity Veil',
    description: 'A persistent phantom layer over your identity mesh. Your Compliance score appears inflated to GridOS scanners.',
    cost: 1500,
    tier: 'underground',
    shadowRequired: 40,
    effect: 'Compliance score appears +20 higher to GridOS gate checks',
    uses: null,
    tags: ['stealth', 'compliance', 'passive'],
  },
  {
    id: 'dead_drop_coords',
    name: 'Dead Drop Coord Pack',
    description: 'Handwritten node coordinates for three off-grid Courier drop points. Burn after memorizing.',
    cost: 450,
    tier: 'underground',
    shadowRequired: 30,
    effect: 'Reveals 3 hidden Courier routes',
    uses: 1,
    relatedCareer: 'courier',
    tags: ['courier', 'access'],
  },
]
