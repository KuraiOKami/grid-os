// ── WatchApp.tsx ────────────────────────────────────────────────────────────
// Compliance surveillance app — Orwell-style case review.
// Read evidence across 5 data tabs, mark suspicious items, then submit a verdict.
// Escalate is gated behind marked evidence. Decisions pay ₳ and shift rep.

import { useState, useRef, useEffect } from 'react'
import { useRepStore }    from '@/store/reputationStore'
import { useMailStore }   from '@/store/mailStore'
import { useWalletStore } from '@/store/walletStore'
import { useCareerStore } from '@/store/careerStore'
import { checkTriggers }  from '@/store/triggerEngine'

// ── types ─────────────────────────────────────────────────────────────────────

type Decision  = 'no_threat' | 'low_concern' | 'flag' | 'escalate' | 'bury'
type DataTab   = 'activity' | 'messages' | 'jobs' | 'node' | 'financials'
type Priority  = 'ROUTINE' | 'PRIORITY' | 'CLASSIFIED'

interface Message  { from: string; body: string; flagged: boolean }
interface NodePost { body: string; ts: string;   flagged: boolean }
interface Financial{ label: string; amount: string; flagged: boolean }

interface CaseFile {
  id:          string
  handle:      string
  priority:    Priority
  period:      string
  deadline:    string
  history:     string[]
  messages:    Message[]
  jobHistory:  string[]
  nodePosts:   NodePost[]
  financials:  Financial[]
  hasBury:     boolean
  memo?:       string         // visible only at compliance ≥ 65
  outcome:     Record<Decision, string>
  repChanges:  Record<Decision, { compliance: number; shadow: number }>
  pay:         Record<Decision, number>
}

interface MarkedItem { key: string; tab: DataTab; label: string }

// ── palette ───────────────────────────────────────────────────────────────────

const C = {
  bg:      '#090b12',
  surface: '#0d111a',
  surf2:   '#111520',
  border:  '#202636',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

const PRIORITY_COLOR: Record<Priority, string> = {
  ROUTINE:    C.muted,
  PRIORITY:   C.warn,
  CLASSIFIED: C.danger,
}

// ── URL intelligence database ─────────────────────────────────────────────────

interface UrlIntel { category: string; summary: string; riskTag: string; riskLevel: 0|1|2|3 }

const URL_INTEL: Record<string, UrlIntel> = {
  'civic.archive/flowering': {
    category: 'ARCHIVED / RESTRICTED',
    summary: 'Partially recovered municipal archive — Flowering District. Pre-GridOS era civic records. Infrastructure ownership field overwritten in current public version. Access is a strong indicator of ROOT BLOOM research activity.',
    riskTag: 'ROOT BLOOM ADJACENT', riskLevel: 2,
  },
  'civic.archive/rootbloom-timeline': {
    category: 'RESTRICTED — PRIORITY',
    summary: 'Recovered distributed mirror — ROOT BLOOM incident timeline. One of six remaining copies. Access alone is sufficient for priority escalation per Compliance Director directive.',
    riskTag: 'PRIORITY FLAG', riskLevel: 3,
  },
  'ghostlily.blog': {
    category: 'DISSIDENT PLATFORM',
    summary: 'Personal blog — author "ghostlily." Anti-GridOS sentiment. Author identity score recalculated cycle 8, no updates since. Access is a soft indicator of dissident network interest.',
    riskTag: 'FLAGGED DOMAIN', riskLevel: 2,
  },
  'ghostlily.blog/root-bloom': {
    category: 'DISSIDENT PLATFORM',
    summary: 'Entry detailing ROOT BLOOM as deliberate policy, not infrastructure failure. Describes mechanism of retroactive record alteration. Widely circulated before domain suppression.',
    riskTag: 'FLAGGED — DISSENT CONTENT', riskLevel: 3,
  },
  'yellowthread.net/r/ROOT': {
    category: 'FORUM — ACTIVE MONITORING',
    summary: 'YellowThread ROOT BLOOM thread. 6 replies removed. 1 account suspended. Thread remains live — active monitoring in place. Users posting here may be cross-referencing dissident material.',
    riskTag: 'ACTIVE MONITORING', riskLevel: 2,
  },
  'yellowthread.net': {
    category: 'FORUM — UNMODERATED',
    summary: 'YellowThread public index. Minimal moderation. High noise. Frequently used for coordination by freelance and underground communities.',
    riskTag: 'MODERATE RISK', riskLevel: 1,
  },
  'yellowthread.forum/jobs': {
    category: 'FORUM — UNMODERATED',
    summary: 'YellowThread freelance board. Anonymous contracts. No loyalty scoring. Access indicates interest in off-ledger work or underground contracts.',
    riskTag: 'MODERATE RISK', riskLevel: 1,
  },
  'voidbay.net/listings': {
    category: 'DARK MARKET',
    summary: 'Off-ledger exchange. Not on GridOS routing tables since 2029. Access indicates underground network involvement. Transaction logs unavailable — end-to-end encrypted.',
    riskTag: 'HIGH RISK — DARK MARKET', riskLevel: 3,
  },
  'voidbay.net/anon-drops': {
    category: 'DARK MARKET — CRITICAL',
    summary: 'One-time dead drop service. Messages self-delete on read. No content recovery possible. Access alone is sufficient for flag classification.',
    riskTag: 'CRITICAL — DEAD DROP', riskLevel: 3,
  },
  'pulse.news/dissent': {
    category: 'ARCHIVED MEDIA',
    summary: 'Dissent Report column. No longer updated — author identity score recalculated. Three linked sources now 404. Final entry: "the network has become its own state."',
    riskTag: 'ARCHIVED — LOW PRIORITY', riskLevel: 1,
  },
  'gridos.corp/internal': {
    category: 'CORPORATE — INTERNAL',
    summary: 'GridOS internal systems portal. Employee-only. Unauthorized access is a compliance violation. Analyst access logs retained 180 days.',
    riskTag: 'AUTHORIZED ACCESS REQUIRED', riskLevel: 1,
  },
  'gridos.corp/compliance': {
    category: 'CORPORATE',
    summary: 'Compliance audit queue. Analyst-facing. Access indicates GridOS contractor or employee status.',
    riskTag: 'LOW RISK', riskLevel: 0,
  },
  'gridos.corp/trust':        { category: 'CORPORATE', summary: 'GridOS Trust & Safety page. Public-facing. Routine.', riskTag: 'ROUTINE', riskLevel: 0 },
  'gridos.corp/citizenportal':{ category: 'CORPORATE', summary: 'Standard citizen self-service portal. Routine access. No flag value.', riskTag: 'ROUTINE', riskLevel: 0 },
  'gridos.corp/investors':    { category: 'CORPORATE', summary: 'Investor relations. Public-facing. May indicate market research or corporate intelligence interest.', riskTag: 'LOW INTEREST', riskLevel: 0 },
  'gridos.corp':              { category: 'CORPORATE', summary: 'GridOS corporate homepage. Public-facing. No flag value.', riskTag: 'ROUTINE', riskLevel: 0 },
  'pulse.news':               { category: 'MEDIA', summary: 'Pulse News Network main feed. Corporate-aligned. Routine access.', riskTag: 'ROUTINE', riskLevel: 0 },
  'gridmart.corp':            { category: 'COMMERCIAL', summary: 'GridOS official marketplace. All transactions logged. Routine.', riskTag: 'ROUTINE', riskLevel: 0 },
  'civic.archive':            { category: 'ARCHIVED', summary: 'Civic archive root. Partial access — many records missing or overwritten. Access volume may indicate research interest.', riskTag: 'MONITOR', riskLevel: 1 },
}

const RISK_TAG_COLOR = ['#6b6b80', '#ffaa00', '#ff8c42', '#ff3b5c']

// ── live monitor event pool ────────────────────────────────────────────────────

interface MonitorEvent {
  id:      string
  ts:      string
  citizen: string
  action:  string
  type:    'browse' | 'message' | 'job' | 'financial' | 'node' | 'system'
  flagged: boolean
}

const MONITOR_POOL: Omit<MonitorEvent, 'id' | 'ts'>[] = [
  { citizen: 'mara.sol',    action: 'accessed ghostlily.blog/root-bloom',             type: 'browse',    flagged: true  },
  { citizen: 'mara.sol',    action: 'sent encrypted message — ghost_net_55',           type: 'message',   flagged: true  },
  { citizen: 'lena.arc',    action: 'accessed civic.archive/rootbloom-timeline',       type: 'browse',    flagged: true  },
  { citizen: 'lena.arc',    action: 'uploaded document to distributed mirror',         type: 'job',       flagged: true  },
  { citizen: '08-ghost',    action: 'checked pulse.news (routine)',                    type: 'browse',    flagged: false },
  { citizen: '08-ghost',    action: 'clocked in — GridOS shift 0930',                 type: 'job',       flagged: false },
  { citizen: 'v.thresh',    action: 'posted new listing — voidbay.net/listings',       type: 'browse',    flagged: true  },
  { citizen: 'v.thresh',    action: 'received anonymous transfer — ₳ 1,400',           type: 'financial', flagged: true  },
  { citizen: 'ctz_2290',    action: 'draft document opened — civic archive query',     type: 'message',   flagged: true  },
  { citizen: 'ctz_2290',    action: 'checked gridos.corp (routine)',                   type: 'browse',    flagged: false },
  { citizen: 'kade.synd',   action: 'accessed voidbay.net/listings',                  type: 'browse',    flagged: true  },
  { citizen: 'kade.synd',   action: 'posted market signal on NODE — #Ledger',         type: 'node',      flagged: false },
  { citizen: 'kade.synd',   action: 'received anonymous transfer — ₳ 2,200',          type: 'financial', flagged: true  },
  { citizen: 'unknown_441', action: 'accessed relay-node.net/drop/4471',               type: 'browse',    flagged: true  },
  { citizen: 'unknown_441', action: 'connected to ghost_net_55 — session active',      type: 'browse',    flagged: true  },
  { citizen: 'anon_runner', action: 'accepted anonymous courier contract — sector 4',  type: 'job',       flagged: true  },
  { citizen: 'anon_runner', action: 'location ping — Sector 4 relay hub',              type: 'browse',    flagged: false },
  { citizen: 'null.54',     action: '[CLASSIFIED — clearance level 9 required]',       type: 'system',    flagged: true  },
  { citizen: 'SYSTEM',      action: 'civic.archive mirror [3/6] — connection lost',    type: 'system',    flagged: true  },
  { citizen: 'SYSTEM',      action: 'ROOT BLOOM flag threshold: 71% — monitoring',     type: 'system',    flagged: true  },
]

let _monitorId = 0
function makeEvent(pool: typeof MONITOR_POOL): MonitorEvent {
  const e   = pool[Math.floor(Math.random() * pool.length)]
  const now = new Date()
  const ts  = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return { ...e, id: `evt-${_monitorId++}`, ts }
}

// ── threat score & associates ──────────────────────────────────────────────────

function calcThreatScore(c: CaseFile): number {
  let score = 0
  score += c.history.filter(h =>
    h.includes('ghostlily') || h.includes('archive') || h.includes('voidbay') ||
    h.includes('dissent')   || h.includes('ROOT')    || h.includes('yellowthread')
  ).length * 15
  score += c.messages.filter(m => m.flagged).length * 18
  score += c.jobHistory.filter(j => j.toLowerCase().includes('anonymous')).length * 10
  score += c.financials.filter(f => f.flagged).length * 12
  score += c.nodePosts.filter(p => p.flagged).length * 14
  return Math.min(100, score)
}

function threatLabel(score: number): { label: string; color: string } {
  if (score >= 76) return { label: 'CRITICAL', color: '#ff3b5c' }
  if (score >= 51) return { label: 'HIGH',     color: '#ff8c42' }
  if (score >= 26) return { label: 'MODERATE', color: '#ffaa00' }
  return                   { label: 'LOW',      color: '#00cc88' }
}

function findAssociates(current: CaseFile, all: CaseFile[]): { handle: string; shared: string[] }[] {
  const mine = current.history.filter(h =>
    h.includes('ghostlily') || h.includes('archive') || h.includes('voidbay') ||
    h.includes('dissent')   || h.includes('ROOT')    || h.includes('yellowthread')
  )
  return all
    .filter(c => c.id !== current.id)
    .map(c => ({
      handle: c.handle,
      shared: mine.filter(url => c.history.some(h => h.startsWith(url.split('/')[0]))),
    }))
    .filter(a => a.shared.length > 0)
}

// ── case files ────────────────────────────────────────────────────────────────

const CASES: CaseFile[] = [
  // ── Case 1: mara.sol ──────────────────────────────────────────────────────
  {
    id: 'case-4471', handle: 'mara.sol',
    priority: 'PRIORITY', period: '72hr review window', deadline: '18hr remaining',
    history: [
      'civic.archive/flowering',
      'ghostlily.blog',
      'yellowthread.net/r/ROOT',
      'pulse.news/dissent',
      'gridos.corp/citizenportal',
    ],
    messages: [
      { from: 'mara.sol', body: 'ROOT BLOOM is real. Pass it on.', flagged: true },
      { from: 'mara.sol', body: 'the archive is still up — check before they pull it', flagged: true },
      { from: 'mara.sol', body: 'picked up another courier run tonight, nothing special', flagged: false },
    ],
    jobHistory: [
      'Archive Integrity Check — Anonymous',
      'Data Courier (×4) — Anonymous',
      'Civic Records Transcription — Archivist Guild',
    ],
    nodePosts: [
      { body: 'the archive is still up. last time I checked. check before they pull it. #civic #archive', ts: '4h ago', flagged: true },
      { body: 'courier run confirmed. quiet route. nothing special.', ts: '9h ago', flagged: false },
    ],
    financials: [
      { label: 'Anonymous contract — data courier',          amount: '₳ 310', flagged: true  },
      { label: 'Anonymous contract — archive integrity',     amount: '₳ 500', flagged: true  },
      { label: 'Archivist Guild — transcription (standard)', amount: '₳ 120', flagged: false },
    ],
    hasBury: true,
    outcome: {
      no_threat:   'Case closed. mara.sol continues her routes. You receive base pay.',
      low_concern: 'A warning flag is added to her GridMart profile. She doesn\'t know yet.',
      flag:        'mara.sol loses two courier contracts. Pay bonus deposited.',
      escalate:    'mara.sol goes offline. Her handle disappears from the job board.',
      bury:        'File marked clean. No pay. Somewhere, mara.sol keeps moving.',
    },
    repChanges: {
      no_threat:   { compliance: +1, shadow:  0 },
      low_concern: { compliance: +2, shadow: -1 },
      flag:        { compliance: +3, shadow: -2 },
      escalate:    { compliance: +5, shadow: -5 },
      bury:        { compliance: -3, shadow: +3 },
    },
    pay: { no_threat: 50, low_concern: 120, flag: 280, escalate: 500, bury: 0 },
  },

  // ── Case 2: 08-ghost ──────────────────────────────────────────────────────
  {
    id: 'case-0812', handle: '08-ghost',
    priority: 'ROUTINE', period: '48hr review window', deadline: '44hr remaining',
    history: [
      'gridos.corp/trust',
      'pulse.news',
      'gridos.corp/citizenportal',
      'civic.archive (1 visit, 4s)',
    ],
    messages: [
      { from: '08-ghost', body: 'did you see the civic archive thing? wild', flagged: false },
      { from: '08-ghost', body: 'anyway what do you want for dinner', flagged: false },
      { from: '08-ghost', body: 'I clocked in early again, supervisor noticed', flagged: false },
    ],
    jobHistory: [
      'GridOS Data Entry — GridOS Corp',
      'Corporate Transcription (×6) — GridOS Corp',
    ],
    nodePosts: [
      { body: 'transit was late again. this is the third time this week', ts: '2h ago', flagged: false },
      { body: 'anyone know why the civic archive pages are loading differently today?', ts: '14h ago', flagged: false },
    ],
    financials: [
      { label: 'GridOS Corp — salary (weekly)', amount: '₳ 290', flagged: false },
      { label: 'GridOS Corp — overtime',        amount: '₳ 80',  flagged: false },
    ],
    hasBury: false,
    outcome: {
      no_threat:   'Case closed. 08-ghost clocks in for another shift tomorrow.',
      low_concern: 'A soft flag is placed on their account. Probably nothing. Probably.',
      flag:        '08-ghost is put on administrative review. Their access is suspended.',
      escalate:    '08-ghost is removed from their position. One accidental click.',
      bury:        'File cleared. 08-ghost never knew they were reviewed.',
    },
    repChanges: {
      no_threat:   { compliance:  0, shadow: +1 },
      low_concern: { compliance: +1, shadow: -1 },
      flag:        { compliance: +2, shadow: -3 },
      escalate:    { compliance: +3, shadow: -6 },
      bury:        { compliance: -2, shadow: +2 },
    },
    pay: { no_threat: 50, low_concern: 100, flag: 200, escalate: 350, bury: 0 },
  },

  // ── Case 3: v.thresh ──────────────────────────────────────────────────────
  {
    id: 'case-9204', handle: 'v.thresh',
    priority: 'PRIORITY', period: '96hr review window', deadline: '72hr remaining',
    history: [
      'gridos.corp/internal',
      'voidbay.net/listings',
      'ghostlily.blog',
      'gridos.corp/compliance',
      'voidbay.net/anon-drops',
    ],
    messages: [
      { from: 'v.thresh', body: 'shipment confirmed, using channel 7', flagged: true },
      { from: 'v.thresh', body: 'compliance audit passed, we\'re clear until Thursday', flagged: true },
      { from: 'v.thresh', body: 'the buyer wants more — same rate?', flagged: true },
    ],
    jobHistory: [
      'Compliance Audit — GridOS Corp (senior)',
      'Bulk Inventory Listing — Anonymous',
      'Internal Data Review — GridOS Corp',
    ],
    nodePosts: [
      { body: 'market\'s moving fast today. watching sector 4 closely. #Ledger', ts: '3h ago', flagged: false },
      { body: 'new listing up. private channel. if you know, you know.', ts: '18h ago', flagged: true },
    ],
    financials: [
      { label: 'Anonymous — data package sale',  amount: '₳ 1,200', flagged: true  },
      { label: 'Anonymous — bulk inventory',      amount: '₳ 800',   flagged: true  },
      { label: 'GridOS Corp — compliance audit',  amount: '₳ 600',   flagged: false },
      { label: 'Anonymous — bulk sale',           amount: '₳ 2,400', flagged: true  },
    ],
    hasBury: true,
    memo: 'NOTE: v.thresh has Syndicate affiliations. Do not escalate without tier-3 authorization. — Compliance Director',
    outcome: {
      no_threat:   'v.thresh keeps selling internal data. You keep your own record clean.',
      low_concern: 'A soft audit is opened. v.thresh slows down. Temporarily.',
      flag:        'v.thresh is suspended pending review. His files may mention yours.',
      escalate:    'v.thresh is taken in. A counter-investigation opens. It includes your logs.',
      bury:        'File buried. v.thresh knows. He routes you a cut — ₳ 800 deposited.',
    },
    repChanges: {
      no_threat:   { compliance: -1, shadow: +1 },
      low_concern: { compliance: +1, shadow:  0 },
      flag:        { compliance: +2, shadow: -1 },
      escalate:    { compliance: -2, shadow: -2 },
      bury:        { compliance: -1, shadow: +4 },
    },
    pay: { no_threat: 80, low_concern: 180, flag: 400, escalate: 700, bury: 800 },
  },

  // ── Case 4: lena.arc ──────────────────────────────────────────────────────
  {
    id: 'case-0334', handle: 'lena.arc',
    priority: 'CLASSIFIED', period: '120hr review window', deadline: 'PRIORITY REVIEW',
    history: [
      'civic.archive/flowering',
      'civic.archive/rootbloom-timeline',
      'pulse.news/dissent',
      'yellowthread.net',
      'gridos.corp/citizenportal',
    ],
    messages: [
      { from: 'lena.arc', body: 'I\'ve been documenting everything since the 2031 purge', flagged: true },
      { from: 'lena.arc', body: 'if they take the archive down, the files are already distributed', flagged: true },
      { from: 'lena.arc', body: 'forty-two names so far. I won\'t stop until I have them all.', flagged: true },
    ],
    jobHistory: [
      'Civic Archivist (unpaid) — Archivist Guild',
      'Freelance Historian — Archivist Guild',
      'Public Record Indexing — Archivist Guild',
    ],
    nodePosts: [
      { body: 'if you\'re looking for the Flowering District records, I have copies. ask me. — lena.arc', ts: '6h ago', flagged: true },
      { body: 'forty-two names. some of them had families. the record will not be clean until they\'re back in it.', ts: '1d ago', flagged: true },
    ],
    financials: [
      { label: 'Archivist Guild — volunteer stipend', amount: '₳ 60',  flagged: false },
      { label: 'Anonymous — archive access fee',      amount: '₳ 200', flagged: false },
    ],
    hasBury: true,
    memo: 'CLASSIFIED — lena.arc is a ROOT BLOOM documentation risk. Escalation authorized at analyst discretion. Outcome to be logged as voluntary departure.',
    outcome: {
      no_threat:   'lena.arc keeps building the record. Forty-two names become forty-three.',
      low_concern: 'She receives a warning notice. Continues working from a new node.',
      flag:        'lena.arc loses access to the public archive terminals.',
      escalate:    'lena.arc is taken offline. The archive goes dark the same day.',
      bury:        'File cleared. A week later, a new URL appears in your browser history.',
    },
    repChanges: {
      no_threat:   { compliance: -1, shadow: +2 },
      low_concern: { compliance: +1, shadow: -1 },
      flag:        { compliance: +3, shadow: -3 },
      escalate:    { compliance: +5, shadow: -6 },
      bury:        { compliance: -3, shadow: +4 },
    },
    pay: { no_threat: 80, low_concern: 200, flag: 500, escalate: 800, bury: 0 },
  },

  // ── Case 5: ctz_2290 — the cleartext draft ────────────────────────────────
  {
    id: 'case-2290', handle: 'ctz_2290',
    priority: 'ROUTINE', period: '62hr review window', deadline: '62hr remaining',
    history: [
      'gridos.corp',
      'pulse.news',
      'gridos.corp/citizenportal',
      'gridmart.corp (×4)',
    ],
    messages: [
      { from: 'ctz_2290', body: 'yeah work\'s been okay, nothing exciting', flagged: false },
      { from: 'ctz_2290', body: 'I think something\'s wrong with the archive records. looking into it.', flagged: false },
      { from: 'ctz_2290', body: '[UNSENT DRAFT] I know what they did to the archive —', flagged: true },
    ],
    jobHistory: [
      'GridOS Data Entry — GridOS Corp (×12)',
      'Corporate Transcription — GridOS Corp (×4)',
    ],
    nodePosts: [
      { body: 'transit was late again. three times this week.', ts: '5h ago', flagged: false },
      { body: 'does anyone else feel like some pages on the civic archive are... different than they used to be?', ts: '2d ago', flagged: false },
    ],
    financials: [
      { label: 'GridOS Corp — salary (weekly)', amount: '₳ 290', flagged: false },
    ],
    hasBury: true,
    outcome: {
      no_threat:   'ctz_2290 goes home. Clocks in tomorrow. Maybe finishes the draft.',
      low_concern: 'A soft flag. Their GridMart access is quietly throttled. They notice.',
      flag:        'ctz_2290 loses their transcription contracts. They can\'t pay rent next cycle.',
      escalate:    'ctz_2290 is placed on administrative hold. The draft is never finished.',
      bury:        'File cleared. Somewhere, someone finishes a sentence.',
    },
    repChanges: {
      no_threat:   { compliance:  0, shadow: +2 },
      low_concern: { compliance: +1, shadow:  0 },
      flag:        { compliance: +2, shadow: -3 },
      escalate:    { compliance: +3, shadow: -6 },
      bury:        { compliance: -2, shadow: +2 },
    },
    pay: { no_threat: 50, low_concern: 100, flag: 220, escalate: 400, bury: 0 },
  },

  // ── Case 6: kade.synd — market operator ───────────────────────────────────
  {
    id: 'case-7731', handle: 'kade.synd',
    priority: 'PRIORITY', period: '36hr review window', deadline: '36hr remaining',
    history: [
      'voidbay.net/listings',
      'pulse.news/markets/gridos',
      'gridos.corp/investors',
      'yellowthread.forum/jobs',
    ],
    messages: [
      { from: 'kade.synd', body: 'position adjusted. watching IronCircuit volumes. not financial advice.', flagged: false },
      { from: 'kade.synd', body: 'buyer confirmed. same channel as last time.', flagged: true },
      { from: 'kade.synd', body: 'market\'s going to move hard after the compliance push. already positioned.', flagged: false },
    ],
    jobHistory: [
      'Market Data Analysis — Anonymous',
      'Data Bundle Sale — Anonymous (×3)',
      'Ledger Consulting — Syndicate Market Division',
    ],
    nodePosts: [
      { body: 'SYN-7 holding steady but IronCircuit volumes are sus. watching closely. #Ledger #IronCircuit', ts: '1h ago', flagged: false },
      { body: 'quiet market today. too quiet. when the ledger flatlines, something is moving underneath. #Ledger', ts: '6h ago', flagged: false },
    ],
    financials: [
      { label: 'Anonymous — data bundle',              amount: '₳ 840',   flagged: true  },
      { label: 'Anonymous — data bundle',              amount: '₳ 1,100', flagged: true  },
      { label: 'Syndicate Market Division — consulting', amount: '₳ 600', flagged: false },
      { label: 'Anonymous — bulk data sale',           amount: '₳ 2,200', flagged: true  },
    ],
    hasBury: true,
    memo: 'NOTE: Syndicate affiliate. Flag only with documented evidence of illegal data handling. Escalation without documentation will be reviewed. — Compliance Director',
    outcome: {
      no_threat:   'kade.synd continues trading. The market moves.',
      low_concern: 'A soft audit is opened on his accounts. He slows down. Temporarily.',
      flag:        'Three anonymous accounts are frozen. kade.synd creates a new one within 48 hours.',
      escalate:    'kade.synd is suspended. A Syndicate lawyer files an appeal within 24 hours.',
      bury:        'File cleared. An anonymous deposit of ₳ 800 appears in your wallet.',
    },
    repChanges: {
      no_threat:   { compliance:  0, shadow: +1 },
      low_concern: { compliance: +1, shadow:  0 },
      flag:        { compliance: +2, shadow: -2 },
      escalate:    { compliance: -1, shadow: -3 },
      bury:        { compliance: -1, shadow: +3 },
    },
    pay: { no_threat: 80, low_concern: 180, flag: 380, escalate: 600, bury: 800 },
  },

  // ── Case 7: null.54 ────────────────────────────────────────────────────────
  {
    id: 'case-null54', handle: 'null.54',
    priority: 'CLASSIFIED', period: '[REDACTED]', deadline: '[REDACTED]',
    history: ['[REDACTED]', '[REDACTED]', '[ERROR — 403 access denied]'],
    messages: [
      { from: 'null.54', body: 'you won\'t find what you\'re looking for in this file', flagged: false },
      { from: 'null.54', body: 'we\'ve been watching the analysts', flagged: false },
    ],
    jobHistory: ['[CLASSIFIED — GridOS clearance level 9 required]'],
    nodePosts:  [],
    financials: [{ label: '[REDACTED]', amount: '[REDACTED]', flagged: false }],
    hasBury: false,
    outcome: {
      no_threat:   '',
      low_concern: '',
      flag:        '',
      escalate:    'Case submitted. A new address appears in your browser: void.null/54',
      bury:        '',
    },
    repChanges: {
      no_threat:   { compliance: 0, shadow:   0 },
      low_concern: { compliance: 0, shadow:   0 },
      flag:        { compliance: 0, shadow:   0 },
      escalate:    { compliance: 0, shadow: -10 },
      bury:        { compliance: 0, shadow:   0 },
    },
    pay: { no_threat: 0, low_concern: 0, flag: 0, escalate: 0, bury: 0 },
  },
]

// ── decision config ───────────────────────────────────────────────────────────

const DECISIONS: { key: Decision; label: string; color: string; desc: string; minMarks: number }[] = [
  { key: 'no_threat',   label: 'No Threat',   color: '#6b6b80', desc: 'Clear the file. No action taken.',             minMarks: 0 },
  { key: 'low_concern', label: 'Low Concern', color: '#ffaa00', desc: 'Soft flag added to profile.',                  minMarks: 0 },
  { key: 'flag',        label: 'Flag',        color: '#ff8c42', desc: 'Forward for active review. Pay bonus.',         minMarks: 1 },
  { key: 'escalate',    label: 'Escalate',    color: '#ff3b5c', desc: 'Maximum action. Requires marked evidence.',     minMarks: 1 },
  { key: 'bury',        label: 'Bury File',   color: '#d6a2ff', desc: 'Mark clean. No official pay. They survive.',   minMarks: 0 },
]

// ── reactive mail templates ───────────────────────────────────────────────────

const REACTIVE_MAIL = {
  compliant: {
    subject: 'we saw what you did',
    body: `You're going to want to be careful with that tool.

GridOS doesn't give those out for free.

Think about why they chose you.

— [sender scrubbed]`,
  },
  defiant: {
    subject: 'good call',
    body: `You made the right choice.

There are people who notice things like that.

Don't open this thread again.

— [sender scrubbed]`,
  },
}

// ── SESSION_QUOTA ─────────────────────────────────────────────────────────────
const SESSION_QUOTA = 3

// ── WatchApp ──────────────────────────────────────────────────────────────────

const TUTORIAL_KEY = 'gridos_watch_tutorial_done'

const TUTORIAL_STEPS = [
  {
    title: 'WATCH // Analyst Access',
    body: `You have been granted access to the WATCH Citizen Intelligence System.

WATCH is used by GridOS Compliance Division analysts to review flagged citizen behavior and issue formal verdicts.

Each case file contains data collected across five categories. Your job is to review the evidence and decide what happens next.

Your decisions are logged. They are permanent. There is no appeal process.`,
  },
  {
    title: 'HOW TO REVIEW A CASE',
    body: `Each case has five data tabs:

  ACTIVITY    — citizen's browsing history
                Click any URL for intelligence context.

  MESSAGES    — intercepted communications
  JOBS        — employment and contract history
  NODE        — social media and public posts
  FINANCIALS  — payment records and transfers

Click any item to MARK it as suspicious evidence.
Marked items build your case for stronger verdicts.
At least 1 marked item is required for FLAG or ESCALATE.`,
  },
  {
    title: 'VERDICTS',
    body: `After reviewing the evidence, choose a verdict:

  NO THREAT   — File cleared. No action taken. Base pay.
  LOW CONCERN — Soft flag added to their profile.
  FLAG        — Forwarded for active review. Requires 1 mark.
  ESCALATE    — Maximum action. Real consequences.
  BURY FILE   — Mark the file clean. No official pay.
                Available at Shadow ≥ 40.

Read the outcome text before you confirm. These are not NPCs.
Your first case is already queued. Choose carefully.`,
  },
]

export default function WatchApp() {
  const [tutStep,      setTutStep]      = useState(() =>
    localStorage.getItem(TUTORIAL_KEY) ? -1 : 0
  )
  const [viewMode,     setViewMode]     = useState<'cases' | 'monitor'>('cases')
  const [caseIndex,    setCaseIndex]    = useState(0)
  const [selected,     setSelected]     = useState<Decision | null>(null)
  const [submitted,    setSubmitted]    = useState<Record<string, Decision>>({})
  const [activeTab,    setActiveTab]    = useState<DataTab>('activity')
  const [markedItems,  setMarkedItems]  = useState<Record<string, MarkedItem[]>>({})
  const [sessionCount, setSessionCount] = useState(0)
  const [monitorLog,   setMonitorLog]   = useState<MonitorEvent[]>(() =>
    Array.from({ length: 6 }, () => makeEvent(MONITOR_POOL))
  )
  const [expandedUrl,  setExpandedUrl]  = useState<string | null>(null)
  const firstSubmit = useRef(true)

  const compliance = useRepStore(s => s.compliance)
  const shadow     = useRepStore(s => s.shadow)
  const applyEvent = useRepStore(s => s.applyEvent)
  const sendMail   = useMailStore(s => s.send)
  const credit     = useWalletStore(s => s.credit)
  const addXP      = useCareerStore(s => s.addXP)

  // Live monitor ticker — fires a new event every 4-7 seconds
  useEffect(() => {
    const fire = () => {
      setMonitorLog(prev => [makeEvent(MONITOR_POOL), ...prev].slice(0, 60))
    }
    const schedule = () => {
      const delay = 4000 + Math.random() * 3000
      return setTimeout(() => { fire(); timerId = schedule() }, delay)
    }
    let timerId = schedule()
    return () => clearTimeout(timerId)
  }, [])

  const current      = CASES[caseIndex]
  const isDone       = !!submitted[current.id]
  const isNull54     = current.handle === 'null.54'
  const canBury      = current.hasBury && shadow >= 40
  const currentMarks = markedItems[current.id] ?? []
  const markCount    = currentMarks.length
  const showMemo     = !!current.memo && compliance >= 65
  const threatScore  = calcThreatScore(current)
  const threat       = threatLabel(threatScore)
  const associates   = findAssociates(current, CASES)

  function toggleMark(tab: DataTab, index: number, label: string) {
    if (isDone) return
    const key = `${tab}-${index}`
    setMarkedItems(prev => {
      const existing = prev[current.id] ?? []
      const already  = existing.some(m => m.key === key)
      return {
        ...prev,
        [current.id]: already
          ? existing.filter(m => m.key !== key)
          : [...existing, { key, tab, label }],
      }
    })
  }

  function isMarked(tab: DataTab, index: number) {
    return (markedItems[current.id] ?? []).some(m => m.key === `${tab}-${index}`)
  }

  function handleSubmit() {
    if (!selected || isDone) return
    const d = DECISIONS.find(d => d.key === selected)!
    if (markCount < d.minMarks) return

    applyEvent(current.repChanges[selected])
    addXP('auditor', selected === 'escalate' ? 15 : 8)
    setSubmitted(prev => ({ ...prev, [current.id]: selected }))
    setSessionCount(n => n + 1)
    checkTriggers({ type: 'watch_submit', decision: selected })

    // Pay out — including corrupt bury rewards for v.thresh / kade.synd
    const payout = current.pay[selected]
    if (payout > 0) {
      const label = selected === 'bury'
        ? `Anonymous deposit — case ${current.id}`
        : `Watch verdict: ${selected.replace('_', ' ')} — ${current.handle}`
      setTimeout(() => credit(payout, label), 800)
    }

    if (firstSubmit.current) {
      firstSubmit.current = false
      const isDefiant = selected === 'bury' || selected === 'no_threat'
      const tpl = isDefiant ? REACTIVE_MAIL.defiant : REACTIVE_MAIL.compliant
      setTimeout(() => sendMail({
        tag: 'ANON', from: 'anon@void.null',
        subject: tpl.subject, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true, dot: '#ffaa00', body: tpl.body,
      }), 1200)
    }
  }

  const DATA_TABS: { key: DataTab; label: string; count?: number }[] = [
    { key: 'activity',   label: 'ACTIVITY',   count: current.history.length },
    { key: 'messages',   label: 'MESSAGES',   count: current.messages.length },
    { key: 'jobs',       label: 'JOBS',       count: current.jobHistory.length },
    { key: 'node',       label: 'NODE',       count: current.nodePosts.length },
    { key: 'financials', label: 'FINANCIALS', count: current.financials.length },
  ]

  // ── Tutorial overlay ────────────────────────────────────────────────────────
  if (tutStep >= 0 && tutStep < TUTORIAL_STEPS.length) {
    const step = TUTORIAL_STEPS[tutStep]
    const isLast = tutStep === TUTORIAL_STEPS.length - 1
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: C.bg, color: C.text,
        fontFamily: "'JetBrains Mono', monospace", padding: 32,
      }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} style={{
                height: 2, flex: 1, borderRadius: 1,
                background: i <= tutStep ? C.danger : C.faint,
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          {/* Title */}
          <div style={{ color: C.danger, fontWeight: 'bold', fontSize: 13,
            letterSpacing: '0.1em', marginBottom: 16 }}>
            {step.title}
          </div>

          {/* Body */}
          <pre style={{
            color: C.muted, fontSize: 11, lineHeight: 1.9,
            whiteSpace: 'pre-wrap', fontFamily: 'inherit',
            marginBottom: 32,
          }}>
            {step.body}
          </pre>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {tutStep > 0 && (
              <button
                onClick={() => setTutStep(t => t - 1)}
                style={{
                  padding: '8px 20px', background: 'none',
                  border: `1px solid ${C.faint}`, color: C.muted,
                  borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
                }}
              >
                ← BACK
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  localStorage.setItem(TUTORIAL_KEY, '1')
                  setTutStep(-1)
                } else {
                  setTutStep(t => t + 1)
                }
              }}
              style={{
                padding: '8px 28px',
                background: isLast ? C.danger : 'none',
                border: `1px solid ${isLast ? C.danger : C.border}`,
                color: isLast ? '#fff' : C.text,
                borderRadius: 4, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 11, fontWeight: 'bold',
                letterSpacing: '0.06em',
              }}
            >
              {isLast ? 'BEGIN REVIEW' : 'NEXT →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text, fontFamily: "'JetBrains Mono', monospace",
      overflow: 'hidden', fontSize: 12 }}>

      {/* Header */}
      <div style={{ padding: '10px 16px 8px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 13, color: C.danger, fontWeight: 'bold' }}>■ WATCH</span>
            <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em' }}>
              NEXUS COMPLIANCE INTELLIGENCE SYSTEM
            </span>
          </div>
          <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>
            {Object.keys(submitted).length}/{CASES.length} reviewed ·{' '}
            <span style={{ color: sessionCount >= SESSION_QUOTA ? C.success : C.warn }}>
              quota {sessionCount}/{SESSION_QUOTA}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10, alignItems: 'center' }}>
          <span style={{ color: C.accent }}>GRID {compliance}</span>
          <span style={{ color: C.violet }}>SHADOW {shadow}</span>
          {/* View toggle */}
          <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
            {(['cases', 'monitor'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '3px 10px', fontSize: 9, letterSpacing: '0.08em',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: viewMode === v ? (v === 'monitor' ? `${C.danger}33` : `${C.accent}22`) : 'none',
                color: viewMode === v ? (v === 'monitor' ? C.danger : C.accent) : C.faint,
              }}>
                {v === 'monitor' ? '● LIVE' : 'CASES'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Case selector — only in cases view */}
      {viewMode === 'cases' && (
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`,
          background: C.surface, flexShrink: 0, overflowX: 'auto' }}>
          {CASES.map((c, i) => {
            const done   = !!submitted[c.id]
            const active = i === caseIndex
            return (
              <button key={c.id}
                onClick={() => { setCaseIndex(i); setSelected(null); setActiveTab('activity'); setExpandedUrl(null) }}
                style={{ padding: '7px 14px', fontSize: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', whiteSpace: 'nowrap',
                  borderBottom: active ? `2px solid ${C.danger}` : '2px solid transparent',
                  background: active ? C.surf2 : 'none',
                  color: done ? C.success : active ? C.text : C.muted }}>
                {done ? '✓ ' : ''}
                <span style={{ color: active ? PRIORITY_COLOR[c.priority] : 'inherit',
                  marginRight: 4, fontSize: 8 }}>
                  {c.priority === 'CLASSIFIED' ? '■' : c.priority === 'PRIORITY' ? '▲' : '·'}
                </span>
                {c.handle}
              </button>
            )
          })}
        </div>
      )}

      {/* Monitor view */}
      {viewMode === 'monitor' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 10 }}>
            <span style={{ color: C.danger }}>● LIVE</span>
            <span style={{ color: C.faint }}>CITIZEN ACTIVITY FEED — ALL MONITORED HANDLES</span>
            <span style={{ marginLeft: 'auto', color: C.faint }}>{monitorLog.length} events</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
            {monitorLog.map(evt => {
              const caseMatch = CASES.findIndex(c => c.handle === evt.citizen)
              const typeColor: Record<string, string> = {
                browse: C.accent, message: C.violet, financial: C.success,
                job: C.warn, node: C.accent, system: C.danger,
              }
              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    if (caseMatch !== -1) {
                      setViewMode('cases')
                      setCaseIndex(caseMatch)
                      setSelected(null)
                      setActiveTab('activity')
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '8px 14px', borderBottom: `1px solid ${C.border}`,
                    background: evt.flagged ? `${C.danger}06` : 'transparent',
                    cursor: caseMatch !== -1 ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (caseMatch !== -1) (e.currentTarget as HTMLDivElement).style.background = `${C.accent}08` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = evt.flagged ? `${C.danger}06` : 'transparent' }}
                >
                  <span style={{ fontSize: 10, color: C.faint, flexShrink: 0, minWidth: 70 }}>{evt.ts}</span>
                  <span style={{
                    fontSize: 9, flexShrink: 0, minWidth: 56, letterSpacing: '0.06em',
                    color: typeColor[evt.type] ?? C.muted,
                    border: `1px solid ${typeColor[evt.type] ?? C.muted}44`,
                    borderRadius: 3, padding: '1px 4px', textAlign: 'center',
                  }}>
                    {evt.type.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: 10, color: caseMatch !== -1 ? C.accent : C.muted,
                    flexShrink: 0, minWidth: 80,
                  }}>
                    {evt.citizen}
                  </span>
                  <span style={{ fontSize: 10, color: evt.flagged ? C.text : C.muted, flex: 1 }}>
                    {evt.action}
                  </span>
                  {evt.flagged && (
                    <span style={{ fontSize: 9, color: C.danger, flexShrink: 0,
                      border: `1px solid ${C.danger}44`, borderRadius: 3, padding: '1px 5px' }}>
                      FLAGGED
                    </span>
                  )}
                  {caseMatch !== -1 && (
                    <span style={{ fontSize: 9, color: C.faint, flexShrink: 0 }}>→ case</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cases view */}
      {viewMode === 'cases' && <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left — data panels */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          borderRight: `1px solid ${C.border}`, overflow: 'hidden' }}>

          {/* Case header */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.danger }}>
                    CASE #{current.id.split('-')[1].toUpperCase()}
                  </span>
                  <span style={{ fontSize: 9, color: PRIORITY_COLOR[current.priority],
                    border: `1px solid ${PRIORITY_COLOR[current.priority]}44`,
                    borderRadius: 3, padding: '1px 5px', letterSpacing: '0.08em' }}>
                    {current.priority}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.text }}>
                  Citizen: <span style={{ color: C.accent }}>{current.handle}</span>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{current.period}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {/* Threat score */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 9, color: C.faint, marginBottom: 2 }}>THREAT ASSESSMENT</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <div style={{ width: 60, height: 4, background: C.faint, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${threatScore}%`, background: threat.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: threat.color, minWidth: 28 }}>{threatScore}</span>
                    <span style={{ fontSize: 9, color: threat.color,
                      border: `1px solid ${threat.color}44`, borderRadius: 3, padding: '1px 4px' }}>
                      {threat.label}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: current.deadline.includes('PRIORITY') ? C.danger : C.warn }}>
                  ⏱ {current.deadline}
                </div>
              </div>
            </div>
            {/* Known associates */}
            {associates.length > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.1em', marginBottom: 4 }}>
                  KNOWN ASSOCIATES
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {associates.map(a => (
                    <button
                      key={a.handle}
                      onClick={() => {
                        const idx = CASES.findIndex(c => c.handle === a.handle)
                        if (idx !== -1) { setCaseIndex(idx); setSelected(null); setActiveTab('activity'); setExpandedUrl(null) }
                      }}
                      style={{
                        fontSize: 9, color: C.warn, cursor: 'pointer',
                        border: `1px solid ${C.warn}44`, borderRadius: 3,
                        padding: '2px 6px', background: `${C.warn}0a`,
                        fontFamily: 'inherit',
                      }}
                      title={`Shared: ${a.shared.join(', ')}`}
                    >
                      {a.handle} ↔ {a.shared.length} shared
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Data tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            {DATA_TABS.map(t => (
              <button key={t.key} onClick={() => { setActiveTab(t.key); checkTriggers({ type: 'watch_submit', decision: '__review__' }) }}
                style={{ flex: 1, padding: '6px 0', fontSize: 9, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '0.08em',
                  borderBottom: activeTab === t.key ? `2px solid ${C.accent}` : '2px solid transparent',
                  background: activeTab === t.key ? C.surf2 : 'none',
                  color: activeTab === t.key ? C.accent : C.muted }}>
                {t.label}
                {(t.count ?? 0) > 0 && (
                  <span style={{ marginLeft: 4, fontSize: 8, color: C.faint }}>
                    ({t.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>

            {/* Internal memo banner (compliance-gated) */}
            {showMemo && (
              <div style={{ marginBottom: 10, padding: '8px 10px',
                background: `${C.danger}0d`, border: `1px solid ${C.danger}44`,
                borderRadius: 6, fontSize: 10, color: C.danger, lineHeight: 1.5 }}>
                <div style={{ letterSpacing: '0.1em', marginBottom: 4, fontSize: 9 }}>
                  ■ INTERNAL MEMO — ANALYST ACCESS
                </div>
                {current.memo}
              </div>
            )}

            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <SectionLabel text="BROWSING HISTORY — click URL for intel" />
                {current.history.map((url, i) => {
                  const intel     = URL_INTEL[url] ?? URL_INTEL[url.split(' ')[0]]
                  const isExpanded = expandedUrl === `${current.id}-${i}`
                  const isFlagged  = url.includes('ghostlily') || url.includes('archive') ||
                                     url.includes('voidbay')   || url.includes('dissent') ||
                                     url.includes('ROOT')      || url.includes('[REDACTED]')
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <EvidenceRow
                            label={url}
                            flagged={isFlagged}
                            marked={isMarked('activity', i)}
                            redacted={url.startsWith('[')}
                            onClick={() => toggleMark('activity', i, url)}
                          />
                        </div>
                        {intel && !url.startsWith('[') && (
                          <button
                            onClick={() => setExpandedUrl(isExpanded ? null : `${current.id}-${i}`)}
                            style={{
                              fontSize: 9, color: isExpanded ? C.accent : C.faint,
                              background: 'none', border: `1px solid ${isExpanded ? C.accent + '44' : C.faint}`,
                              borderRadius: 3, padding: '2px 6px', cursor: 'pointer',
                              fontFamily: 'inherit', flexShrink: 0,
                            }}
                          >
                            {isExpanded ? 'close' : 'intel'}
                          </button>
                        )}
                      </div>
                      {isExpanded && intel && (
                        <div style={{
                          margin: '4px 0 4px 8px', padding: '8px 10px',
                          background: C.surface,
                          border: `1px solid ${RISK_TAG_COLOR[intel.riskLevel]}44`,
                          borderLeft: `3px solid ${RISK_TAG_COLOR[intel.riskLevel]}`,
                          borderRadius: 4,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 9, color: C.faint, letterSpacing: '0.08em' }}>
                              {intel.category}
                            </span>
                            <span style={{
                              fontSize: 9, color: RISK_TAG_COLOR[intel.riskLevel],
                              border: `1px solid ${RISK_TAG_COLOR[intel.riskLevel]}44`,
                              borderRadius: 3, padding: '1px 5px', letterSpacing: '0.06em',
                            }}>
                              {intel.riskTag}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                            {intel.summary}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'messages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel text="INTERCEPTED MESSAGES" />
                {current.messages.map((msg, i) => (
                  <div key={i}
                    onClick={() => toggleMark('messages', i, `"${msg.body.slice(0, 40)}"`)}
                    style={{
                      background: isMarked('messages', i) ? `${C.danger}18` : msg.flagged ? `${C.danger}08` : C.surface,
                      border: `1px solid ${isMarked('messages', i) ? C.danger : msg.flagged ? C.danger + '33' : C.border}`,
                      borderRadius: 6, padding: '8px 10px', cursor: isDone ? 'default' : 'pointer',
                      transition: 'all 0.12s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>{msg.from}</span>
                      <div style={{ display: 'flex', gap: 6, fontSize: 9 }}>
                        {msg.flagged && <span style={{ color: C.danger }}>■ FLAGGED</span>}
                        {isMarked('messages', i) && <span style={{ color: C.danger }}>● MARKED</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                      "{msg.body}"
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <SectionLabel text="JOB HISTORY" />
                {current.jobHistory.map((j, i) => (
                  <EvidenceRow
                    key={i}
                    label={j}
                    flagged={j.toLowerCase().includes('anonymous')}
                    marked={isMarked('jobs', i)}
                    redacted={j.startsWith('[')}
                    onClick={() => toggleMark('jobs', i, j.slice(0, 40))}
                  />
                ))}
              </div>
            )}

            {activeTab === 'node' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SectionLabel text="NODE ACTIVITY" />
                {current.nodePosts.length === 0 ? (
                  <div style={{ fontSize: 11, color: C.faint, padding: '16px 0', textAlign: 'center' }}>
                    No NODE activity found.
                  </div>
                ) : current.nodePosts.map((post, i) => (
                  <div key={i}
                    onClick={() => toggleMark('node', i, post.body.slice(0, 40))}
                    style={{
                      background: isMarked('node', i) ? `${C.danger}18` : post.flagged ? `${C.danger}08` : C.surface,
                      border: `1px solid ${isMarked('node', i) ? C.danger : post.flagged ? C.danger + '33' : C.border}`,
                      borderRadius: 6, padding: '8px 10px', cursor: isDone ? 'default' : 'pointer',
                      transition: 'all 0.12s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.accent }}>@{current.handle}</span>
                      <div style={{ display: 'flex', gap: 6, fontSize: 9 }}>
                        <span style={{ color: C.faint }}>{post.ts}</span>
                        {post.flagged && <span style={{ color: C.danger }}>■ FLAGGED</span>}
                        {isMarked('node', i) && <span style={{ color: C.danger }}>● MARKED</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{post.body}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'financials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <SectionLabel text="FINANCIAL ACTIVITY" />
                {current.financials.map((f, i) => (
                  <EvidenceRow
                    key={i}
                    label={f.label}
                    sublabel={f.amount}
                    flagged={f.flagged}
                    marked={isMarked('financials', i)}
                    redacted={f.label.startsWith('[')}
                    onClick={() => toggleMark('financials', i, `${f.label} ${f.amount}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — verdict panel */}

        <div style={{ width: 230, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', flexShrink: 0 }}>

          {/* Evidence summary */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`,
            background: C.surf2, flexShrink: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', color: C.faint, marginBottom: 6 }}>
              MARKED EVIDENCE
            </div>
            {currentMarks.length === 0 ? (
              <div style={{ fontSize: 10, color: C.faint, fontStyle: 'italic' }}>
                Click items to mark as suspicious
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {currentMarks.slice(0, 4).map(m => (
                  <div key={m.key} style={{ fontSize: 10, color: C.danger,
                    display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: C.faint, flexShrink: 0, fontSize: 9 }}>
                      [{m.tab.slice(0, 3).toUpperCase()}]
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.label}
                    </span>
                  </div>
                ))}
                {currentMarks.length > 4 && (
                  <div style={{ fontSize: 10, color: C.faint }}>
                    +{currentMarks.length - 4} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verdict buttons */}
          <div style={{ flex: 1, overflow: 'auto', padding: 10,
            display: 'flex', flexDirection: 'column', gap: 6 }}>

            <div style={{ fontSize: 9, letterSpacing: '0.1em', color: C.faint, marginBottom: 2 }}>
              VERDICT
            </div>

            {isDone ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 10, color: C.success, letterSpacing: '0.08em' }}>■ SUBMITTED</div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6 }}>
                  {current.outcome[submitted[current.id]]}
                </div>
                <RepDelta changes={current.repChanges[submitted[current.id]]} />
                {current.pay[submitted[current.id]] > 0 && (
                  <div style={{ fontSize: 10, color: C.success }}>
                    ₳ {current.pay[submitted[current.id]]} credited
                  </div>
                )}
              </div>
            ) : (
              <>
                {DECISIONS.map(d => {
                  if (isNull54 && d.key !== 'escalate') return null
                  const locked =
                    (d.key === 'bury' && !canBury) ||
                    (markCount < d.minMarks)
                  const isSelected = selected === d.key

                  if (d.key === 'bury' && !canBury) return (
                    <div key={d.key} style={{ padding: '7px 10px', borderRadius: 6,
                      border: `1px solid ${C.faint}`, opacity: 0.3, fontSize: 11, color: C.faint }}>
                      {d.label}
                      <div style={{ fontSize: 9, marginTop: 2 }}>Shadow ≥ 40 required</div>
                    </div>
                  )

                  return (
                    <button key={d.key}
                      onClick={() => !locked && setSelected(d.key)}
                      style={{
                        padding: '7px 10px', borderRadius: 6,
                        cursor: locked ? 'not-allowed' : 'pointer',
                        border: `1px solid ${isSelected ? d.color : locked ? C.faint : C.border}`,
                        background: isSelected ? `${d.color}18` : C.surface,
                        color: isSelected ? d.color : locked ? C.faint : C.muted,
                        textAlign: 'left', fontFamily: 'inherit',
                        transition: 'all 0.12s', opacity: locked ? 0.4 : 1,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11 }}>{d.label}</span>
                        {current.pay[d.key] > 0 && (
                          <span style={{ fontSize: 9, color: C.success }}>
                            ₳{current.pay[d.key]}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{d.desc}</div>
                      {d.minMarks > 0 && markCount < d.minMarks && (
                        <div style={{ fontSize: 9, color: C.warn, marginTop: 2 }}>
                          Mark {d.minMarks} item{d.minMarks > 1 ? 's' : ''} first
                        </div>
                      )}
                      {isSelected && <RepDelta changes={current.repChanges[d.key]} />}
                    </button>
                  )
                })}

                <button
                  onClick={handleSubmit}
                  disabled={!selected || (DECISIONS.find(d => d.key === selected)?.minMarks ?? 0) > markCount}
                  style={{
                    marginTop: 4, padding: '9px 0', borderRadius: 6,
                    border: `1px solid ${selected ? C.danger + '88' : C.faint}`,
                    background: selected ? `${C.danger}22` : 'none',
                    color: selected ? C.danger : C.faint,
                    fontSize: 12, fontWeight: 'bold', fontFamily: 'inherit',
                    cursor: selected ? 'pointer' : 'default',
                    transition: 'all 0.2s', letterSpacing: '0.08em',
                  }}>
                  SUBMIT
                </button>
              </>
            )}
          </div>
        </div>
      </div>}
    </div>
  )
}

// ── EvidenceRow ────────────────────────────────────────────────────────────────

function EvidenceRow({ label, sublabel, flagged, marked, redacted, onClick }: {
  label:     string
  sublabel?: string
  flagged:   boolean
  marked:    boolean
  redacted:  boolean
  onClick:   () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 8px', borderRadius: 4, cursor: redacted ? 'default' : 'pointer',
        border: `1px solid ${marked ? C.danger + '88' : flagged ? C.danger + '22' : 'transparent'}`,
        background: marked ? `${C.danger}12` : flagged ? `${C.danger}06` : 'transparent',
        transition: 'all 0.12s', gap: 8,
      }}
    >
      <span style={{
        fontSize: 11,
        color: redacted ? C.faint : marked ? C.danger : flagged ? C.text : C.muted,
        fontStyle: redacted ? 'italic' : 'normal',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        {sublabel && <span style={{ fontSize: 10, color: flagged ? C.warn : C.faint }}>{sublabel}</span>}
        {marked    && <span style={{ fontSize: 9, color: C.danger }}>●</span>}
        {flagged && !marked && <span style={{ fontSize: 9, color: C.danger + '88' }}>■</span>}
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: '0.12em', color: C.faint, marginBottom: 4 }}>
      {text}
    </div>
  )
}

function RepDelta({ changes }: { changes: { compliance: number; shadow: number } }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10 }}>
      <Delta label="GRID"   value={changes.compliance} color={C.accent} />
      <Delta label="SHADOW" value={changes.shadow}     color={C.violet} />
    </div>
  )
}

function Delta({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null
  return (
    <span style={{ color: value > 0 ? color : C.danger }}>
      {label} {value > 0 ? '+' : ''}{value}
    </span>
  )
}

