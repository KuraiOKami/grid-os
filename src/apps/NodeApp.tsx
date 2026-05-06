// ── NodeApp.tsx ────────────────────────────────────────────────────────────
// NODE — in-world social media platform.
// Tabs: Feed | Frequency (trending) | Following | Profile
// Player can post Signals, uplink (♥), relay (↺), follow accounts.

import { useState, useRef, useEffect } from 'react'
import { useNodeStore, NPC_ACCOUNTS, Signal, NodeAccount } from '@/store/nodeStore'
import { FACTIONS } from '@/lib/factions'

const C = {
  bg:      '#0a0a0f',
  surface: '#111118',
  surf2:   '#16161f',
  surf3:   '#1c1c26',
  border:  '#2a2a3a',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  faint:   '#3a3a4a',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
}

type Tab = 'feed' | 'frequency' | 'following' | 'profile'

const PLAYER_ACCOUNT: NodeAccount = {
  id:      'player',
  handle:  'you',
  display: 'CITIZEN #4471',
  type:    'citizen',
  avatar:  'U',
  bio:     'New to the Grid.',
  subs:    0,
}

function getAccount(id: string): NodeAccount {
  if (id === 'player') return PLAYER_ACCOUNT
  return NPC_ACCOUNTS.find(a => a.id === id) ?? {
    id, handle: 'unknown', display: '???', type: 'citizen', avatar: '?', bio: '', subs: 0,
  }
}

function fmtTime(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function accountBadge(acc: NodeAccount) {
  if (acc.type === 'verified') return <span style={{ color: C.accent, fontSize: 10 }}> [V]</span>
  if (acc.type === 'anon')     return <span style={{ color: C.violet, fontSize: 10 }}> [ANON]</span>
  if (acc.type === 'bot')      return <span style={{ color: C.warn,   fontSize: 10 }}> [BOT]</span>
  return null
}

function factionColor(acc: NodeAccount) {
  if (!acc.faction) return C.muted
  return FACTIONS[acc.faction]?.color ?? C.muted
}

export default function NodeApp() {
  const [tab, setTab] = useState<Tab>('feed')

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12, color: C.text, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px 0',
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 'bold', color: C.accent }}>NODE</span>
          <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>
            // your signal. your frequency.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['feed', 'frequency', 'following', 'profile'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 11,
                padding: '6px 14px 8px',
                color: tab === t ? C.accent : C.muted,
                borderBottom: tab === t ? `2px solid ${C.accent}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'feed'      && <FeedTab />}
        {tab === 'frequency' && <FrequencyTab />}
        {tab === 'following' && <FollowingTab />}
        {tab === 'profile'   && <ProfileTab />}
      </div>
    </div>
  )
}

// ── Feed Tab ───────────────────────────────────────────────────────────────────
function FeedTab() {
  const signals    = useNodeStore(s => s.signals)
  const drafting   = useNodeStore(s => s.drafting)
  const draftBody  = useNodeStore(s => s.draftBody)
  const setDraft   = useNodeStore(s => s.setDraft)
  const setDrafting = useNodeStore(s => s.setDrafting)
  const postSignal = useNodeStore(s => s.postSignal)
  const textRef    = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (drafting && textRef.current) textRef.current.focus()
  }, [drafting])

  const sorted = [...signals].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.ts - a.ts
  })

  const handlePost = () => {
    const body = draftBody.trim()
    if (!body) return
    const tagMatches = body.match(/#(\w+)/g) ?? []
    const tags = tagMatches.map(t => t.slice(1))
    postSignal(body, tags)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Compose area */}
      {drafting ? (
        <div style={{
          padding: 12, borderBottom: `1px solid ${C.border}`,
          background: C.surf2, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Avatar acc={PLAYER_ACCOUNT} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                ref={textRef}
                value={draftBody}
                onChange={e => setDraft(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder="What's your signal? Use #tags and @handles..."
                style={{
                  width: '100%', resize: 'none',
                  background: C.surf3, border: `1px solid ${C.border}`,
                  borderRadius: 4, padding: '8px 10px',
                  color: C.text, fontFamily: 'inherit', fontSize: 12,
                  outline: 'none', lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: draftBody.length > 250 ? C.danger : C.faint }}>
                  {draftBody.length}/280
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setDrafting(false); setDraft('') }} style={btnStyle(C.muted, 'ghost')}>
                    cancel
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={!draftBody.trim()}
                    style={btnStyle(C.accent, 'fill')}
                  >
                    SIGNAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '8px 14px', borderBottom: `1px solid ${C.border}`,
          background: C.surf2, flexShrink: 0,
        }}>
          <button
            onClick={() => setDrafting(true)}
            style={{
              width: '100%', textAlign: 'left',
              background: C.surf3, border: `1px solid ${C.faint}`,
              borderRadius: 4, padding: '8px 12px',
              color: C.faint, fontFamily: 'inherit', fontSize: 12,
              cursor: 'text',
            }}
          >
            What’s your signal?
          </button>
        </div>
      )}

      {/* Signal list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map(sig => (
          <SignalCard key={sig.id} signal={sig} />
        ))}
      </div>
    </div>
  )
}

// ── Signal Card ─────────────────────────────────────────────────────────────────
function SignalCard({ signal }: { signal: Signal }) {
  const uplink  = useNodeStore(s => s.uplink)
  const relay   = useNodeStore(s => s.relay)
  const uplinked = useNodeStore(s => s.uplinked)
  const relayed  = useNodeStore(s => s.relayed)
  const acc      = getAccount(signal.authorId)
  const isUp     = uplinked.includes(signal.id)
  const isRelay  = relayed.includes(signal.id)

  // Render body: highlight #tags and @handles
  const renderBody = (body: string) => {
    const parts = body.split(/(#\w+|@\w+)/g)
    return parts.map((p, i) => {
      if (p.startsWith('#')) return <span key={i} style={{ color: C.accent }}>{p}</span>
      if (p.startsWith('@')) return <span key={i} style={{ color: C.violet }}>{p}</span>
      return p
    })
  }

  return (
    <div style={{
      padding: '12px 14px',
      borderBottom: `1px solid ${C.border}`,
      background: signal.pinned ? `${C.surf2}` : 'transparent',
      borderLeft: signal.pinned ? `2px solid ${C.accent}33` : 'none',
    }}>
      {signal.pinned && (
        <div style={{ fontSize: 9, color: C.muted, marginBottom: 6, letterSpacing: '0.1em' }}>
          ▲ PINNED ─ NEXUS BROADCAST
        </div>
      )}
      {signal.relayOf && (
        <div style={{ fontSize: 9, color: C.violet, marginBottom: 6 }}>
          ↺ relayed by {acc.display}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Avatar acc={acc} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: factionColor(acc), fontSize: 12 }}>
              {acc.display}
            </span>
            {accountBadge(acc)}
            <span style={{ color: C.faint, fontSize: 10 }}>@{acc.handle}</span>
            <span style={{ color: C.faint, fontSize: 10 }}>·</span>
            <span style={{ color: C.faint, fontSize: 10 }}>{fmtTime(signal.ts)}</span>
          </div>

          {/* Body */}
          <div style={{
            marginTop: 6, lineHeight: 1.6, color: C.text,
            wordBreak: 'break-word', whiteSpace: 'pre-wrap',
          }}>
            {renderBody(signal.body)}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            <ActionBtn
              label={fmtNum(signal.uplinks)}
              icon="♥"
              active={isUp}
              activeColor={C.danger}
              onClick={() => uplink(signal.id)}
            />
            <ActionBtn
              label={fmtNum(signal.relays)}
              icon="↺"
              active={isRelay}
              activeColor={C.violet}
              onClick={() => relay(signal.id)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Frequency Tab (trending) ──────────────────────────────────────────────────────
function FrequencyTab() {
  const signals = useNodeStore(s => s.signals)

  // Count tag frequency
  const tagCounts: Record<string, number> = {}
  signals.forEach(sig => {
    sig.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + sig.uplinks + sig.relays
    })
  })
  const ranked = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
  const max = ranked[0]?.[1] ?? 1

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em', marginBottom: 14 }}>
        FREQUENCY ─ TRENDING SIGNALS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ranked.map(([tag, score], i) => {
          const pct = (score / max) * 100
          const pulse = pct > 70
          return (
            <div key={tag}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.accent, fontSize: 12 }}>#{tag}</span>
                <span style={{ color: C.muted, fontSize: 10 }}>
                  {fmtNum(score)} interactions
                </span>
              </div>
              <div style={{
                height: 4, background: C.faint, borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: pulse ? C.danger : C.accent,
                  borderRadius: 2,
                  animation: pulse ? 'freqPulse 1.2s ease-in-out infinite' : 'none',
                }} />
              </div>
              <style>{`
                @keyframes freqPulse {
                  0%, 100% { opacity: 1; }
                  50%       { opacity: 0.5; }
                }
              `}</style>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Following Tab ─────────────────────────────────────────────────────────────
function FollowingTab() {
  const following  = useNodeStore(s => s.following)
  const follow     = useNodeStore(s => s.follow)
  const unfollow   = useNodeStore(s => s.unfollow)

  const notFollowing = NPC_ACCOUNTS.filter(a => !following.includes(a.id))

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {following.length > 0 && (
        <>
          <div style={{
            padding: '10px 14px 4px',
            fontSize: 9, color: C.faint, letterSpacing: '0.12em',
          }}>
            SUBSCRIBED
          </div>
          {following.map(id => {
            const acc = getAccount(id)
            return (
              <AccountRow
                key={id} acc={acc}
                followed={true}
                onToggle={() => unfollow(id)}
              />
            )
          })}
          <div style={{ height: 1, background: C.border, margin: '8px 0' }} />
        </>
      )}
      <div style={{
        padding: '10px 14px 4px',
        fontSize: 9, color: C.faint, letterSpacing: '0.12em',
      }}>
        SUGGESTED
      </div>
      {notFollowing.map(acc => (
        <AccountRow
          key={acc.id} acc={acc}
          followed={false}
          onToggle={() => follow(acc.id)}
        />
      ))}
    </div>
  )
}

function AccountRow({ acc, followed, onToggle }: {
  acc: NodeAccount; followed: boolean; onToggle: () => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <Avatar acc={acc} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontWeight: 'bold', color: factionColor(acc), fontSize: 12 }}>
            {acc.display}
          </span>
          {accountBadge(acc)}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>@{acc.handle}</div>
        <div style={{
          fontSize: 10, color: C.faint,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {acc.bio}
        </div>
      </div>
      <div style={{ fontSize: 10, color: C.faint, flexShrink: 0 }}>
        {fmtNum(acc.subs)} subs
      </div>
      <button onClick={onToggle} style={btnStyle(followed ? C.muted : C.accent, followed ? 'outline' : 'fill')}>
        {followed ? 'unsubscribe' : 'subscribe'}
      </button>
    </div>
  )
}

// ── Profile Tab ─────────────────────────────────────────────────────────────────
function ProfileTab() {
  const signals = useNodeStore(s => s.signals)
  const myPosts = signals.filter(s => s.isPlayer)
  const totalUplinks = myPosts.reduce((n, s) => n + s.uplinks, 0)
  const totalRelays  = myPosts.reduce((n, s) => n + s.relays,  0)

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Profile header */}
      <div style={{
        padding: 16, background: C.surf2,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 8,
            background: C.surf3, border: `1px solid ${C.accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: C.accent, fontWeight: 'bold',
          }}>
            U
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: C.text }}>CITIZEN #4471</div>
            <div style={{ fontSize: 10, color: C.muted }}>@you</div>
            <div style={{ fontSize: 10, color: C.faint, marginTop: 4 }}>New to the Grid.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 11 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: C.text, fontWeight: 'bold' }}>{myPosts.length}</div>
            <div style={{ color: C.faint, fontSize: 9 }}>SIGNALS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: C.text, fontWeight: 'bold' }}>{totalUplinks}</div>
            <div style={{ color: C.faint, fontSize: 9 }}>UPLINKS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: C.text, fontWeight: 'bold' }}>{totalRelays}</div>
            <div style={{ color: C.faint, fontSize: 9 }}>RELAYS</div>
          </div>
        </div>
      </div>

      {/* My signals */}
      {myPosts.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 20px', gap: 10, color: C.faint,
        }}>
          <div style={{ fontSize: 24 }}>[ ]</div>
          <div style={{ fontSize: 12 }}>No signals yet.</div>
          <div style={{ fontSize: 10 }}>Go to the Feed tab and broadcast your first signal.</div>
        </div>
      ) : (
        myPosts.map(sig => <SignalCard key={sig.id} signal={sig} />)
      )}
    </div>
  )
}

// ── Shared small components ──────────────────────────────────────────────────────────
function Avatar({ acc }: { acc: NodeAccount }) {
  const color = acc.faction ? FACTIONS[acc.faction]?.color ?? C.muted : C.muted
  return (
    <div style={{
      width: 36, height: 36, flexShrink: 0, borderRadius: 6,
      background: C.surf3,
      border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 'bold', color,
    }}>
      {acc.avatar}
    </div>
  )
}

function ActionBtn({ label, icon, active, activeColor, onClick }: {
  label: string; icon: string; active: boolean
  activeColor: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 11,
        color: active ? activeColor : C.muted,
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '2px 0', transition: 'color 0.15s',
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </button>
  )
}

function btnStyle(color: string, variant: 'fill' | 'outline' | 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: 'inherit', fontSize: 10, cursor: 'pointer',
    borderRadius: 4, padding: '4px 10px', transition: 'all 0.15s',
  }
  if (variant === 'fill')    return { ...base, background: color, color: '#0a0a0f', border: `1px solid ${color}`, fontWeight: 'bold' }
  if (variant === 'outline') return { ...base, background: 'none', color, border: `1px solid ${color}33` }
  return { ...base, background: 'none', color, border: 'none' }
}
