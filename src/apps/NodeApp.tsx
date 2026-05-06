// ── NodeApp.tsx ────────────────────────────────────────────────────────────
// NODE — in-world social media platform.
// Tabs: Feed | Frequency | Scripts | Following | Profile
// Idle system: deployable scripts earn influence passively.
// NPC ticker posts new signals every ~45s while the app is open.

import { useState, useRef, useEffect } from 'react'
import { useNodeStore, NPC_ACCOUNTS, SCRIPT_DEFS, TICK_MS, Signal, NodeAccount } from '@/store/nodeStore'
import { useRepStore } from '@/store/reputationStore'
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

type Tab = 'feed' | 'frequency' | 'scripts' | 'following' | 'profile'

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

function fmtUptime(deployedAt: number) {
  const s = Math.floor((Date.now() - deployedAt) / 1000)
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

function accountBadge(acc: NodeAccount) {
  if (acc.type === 'verified') return <span style={{ color: C.accent,  fontSize: 10 }}> [V]</span>
  if (acc.type === 'anon')     return <span style={{ color: C.violet,  fontSize: 10 }}> [ANON]</span>
  if (acc.type === 'bot')      return <span style={{ color: C.warn,    fontSize: 10 }}> [BOT]</span>
  return null
}

function factionColor(acc: NodeAccount) {
  if (!acc.faction) return C.muted
  return FACTIONS[acc.faction]?.color ?? C.muted
}

// ── Root Component ──────────────────────────────────────────────────────────────

export default function NodeApp() {
  const [tab, setTab]     = useState<Tab>('feed')
  const tick    = useNodeStore(s => s.tick)
  const tickNPC = useNodeStore(s => s.tickNPC)
  const inbox   = useNodeStore(s => s.inbox)
  const scripts = useNodeStore(s => s.scripts)

  // Run script tick every 5s (the action only yields when 30s has elapsed per script)
  // Run NPC ticker every 45s
  useEffect(() => {
    tick()  // apply any offline progress immediately on mount
    const scriptInterval = setInterval(tick,    5_000)
    const npcInterval    = setInterval(tickNPC, 45_000)
    return () => { clearInterval(scriptInterval); clearInterval(npcInterval) }
  }, [])

  const unreadCount   = inbox.filter(m => !m.read).length
  const runningCount  = scripts.length

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'feed',      label: 'FEED' },
    { id: 'frequency', label: 'FREQ' },
    { id: 'scripts',   label: 'SCRIPTS', badge: runningCount },
    { id: 'following', label: 'FOLLOW' },
    { id: 'profile',   label: 'PROFILE', badge: unreadCount },
  ]

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
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 10,
                padding: '6px 12px 8px',
                color: tab === t.id ? C.accent : C.muted,
                borderBottom: tab === t.id ? `2px solid ${C.accent}` : '2px solid transparent',
                transition: 'all 0.15s', position: 'relative',
              }}
            >
              {t.label}
              {(t.badge ?? 0) > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 14, height: 14, borderRadius: '50%',
                  background: t.id === 'scripts' ? C.success : C.danger,
                  color: '#0a0a0f', fontSize: 8, fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 2px',
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'feed'      && <FeedTab />}
        {tab === 'frequency' && <FrequencyTab />}
        {tab === 'scripts'   && <ScriptsTab />}
        {tab === 'following' && <FollowingTab />}
        {tab === 'profile'   && <ProfileTab />}
      </div>
    </div>
  )
}

// ── Feed Tab ───────────────────────────────────────────────────────────────────

function FeedTab() {
  const signals     = useNodeStore(s => s.signals)
  const drafting    = useNodeStore(s => s.drafting)
  const draftBody   = useNodeStore(s => s.draftBody)
  const setDraft    = useNodeStore(s => s.setDraft)
  const setDrafting = useNodeStore(s => s.setDrafting)
  const postSignal  = useNodeStore(s => s.postSignal)
  const textRef     = useRef<HTMLTextAreaElement>(null)

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
      {drafting ? (
        <div style={{ padding: 12, borderBottom: `1px solid ${C.border}`, background: C.surf2, flexShrink: 0 }}>
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
                  <button onClick={handlePost} disabled={!draftBody.trim()} style={btnStyle(C.accent, 'fill')}>
                    SIGNAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.surf2, flexShrink: 0 }}>
          <button
            onClick={() => setDrafting(true)}
            style={{
              width: '100%', textAlign: 'left',
              background: C.surf3, border: `1px solid ${C.faint}`,
              borderRadius: 4, padding: '8px 12px',
              color: C.faint, fontFamily: 'inherit', fontSize: 12, cursor: 'text',
            }}
          >
            What's your signal?
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map(sig => <SignalCard key={sig.id} signal={sig} />)}
      </div>
    </div>
  )
}

// ── Signal Card ────────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }) {
  const uplink   = useNodeStore(s => s.uplink)
  const relay    = useNodeStore(s => s.relay)
  const uplinked = useNodeStore(s => s.uplinked)
  const relayed  = useNodeStore(s => s.relayed)
  const acc      = getAccount(signal.authorId)
  const isUp     = uplinked.includes(signal.id)
  const isRelay  = relayed.includes(signal.id)

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
      padding: '12px 14px', borderBottom: `1px solid ${C.border}`,
      background: signal.pinned ? C.surf2 : 'transparent',
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: factionColor(acc), fontSize: 12 }}>{acc.display}</span>
            {accountBadge(acc)}
            <span style={{ color: C.faint, fontSize: 10 }}>@{acc.handle}</span>
            <span style={{ color: C.faint, fontSize: 10 }}>·</span>
            <span style={{ color: C.faint, fontSize: 10 }}>{fmtTime(signal.ts)}</span>
          </div>
          <div style={{ marginTop: 6, lineHeight: 1.6, color: C.text, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {renderBody(signal.body)}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            <ActionBtn label={fmtNum(signal.uplinks)} icon="♥" active={isUp}    activeColor={C.danger} onClick={() => uplink(signal.id)} />
            <ActionBtn label={fmtNum(signal.relays)}  icon="↺" active={isRelay} activeColor={C.violet} onClick={() => relay(signal.id)}  />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Frequency Tab ──────────────────────────────────────────────────────────────

function FrequencyTab() {
  const signals = useNodeStore(s => s.signals)

  const tagCounts: Record<string, number> = {}
  signals.forEach(sig => {
    sig.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] ?? 0) + sig.uplinks + sig.relays })
  })
  const ranked = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12)
  const max = ranked[0]?.[1] ?? 1

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em', marginBottom: 14 }}>
        FREQUENCY ─ TRENDING SIGNALS
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ranked.map(([tag, score]) => {
          const pct   = (score / max) * 100
          const pulse = pct > 70
          return (
            <div key={tag}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: C.accent, fontSize: 12 }}>#{tag}</span>
                <span style={{ color: C.muted, fontSize: 10 }}>{fmtNum(score)} interactions</span>
              </div>
              <div style={{ height: 4, background: C.faint, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: pulse ? C.danger : C.accent, borderRadius: 2,
                  animation: pulse ? 'freqPulse 1.2s ease-in-out infinite' : 'none',
                }} />
              </div>
              <style>{`@keyframes freqPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Scripts Tab ────────────────────────────────────────────────────────────────

function ScriptsTab() {
  const influence    = useNodeStore(s => s.influence)
  const scripts      = useNodeStore(s => s.scripts)
  const deployScript = useNodeStore(s => s.deployScript)
  const stopScript   = useNodeStore(s => s.stopScript)
  const shadow       = useRepStore(s => s.shadow)

  // Local clock for live countdowns — ticks every second
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Influence rate per minute from all running scripts
  const ratePerMin = scripts.reduce((acc, s) => {
    const def = SCRIPT_DEFS.find(d => d.id === s.defId)
    return acc + (def ? (def.yieldPerTick / TICK_MS) * 60_000 : 0)
  }, 0)

  const CATEGORY_COLOR: Record<string, string> = {
    network:       C.accent,
    surveillance:  C.warn,
    underground:   C.violet,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Influence header */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surf2, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em', marginBottom: 4 }}>
            SCRIPTS // idle automation
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: C.success }}>
              {influence.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: C.success }}>⬡ influence</span>
            {ratePerMin > 0 && (
              <span style={{ fontSize: 10, color: C.muted }}>
                +{ratePerMin.toFixed(1)}/min
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 9, color: C.faint, textAlign: 'right', lineHeight: 1.6 }}>
          {scripts.length} running<br />
          {SCRIPT_DEFS.length - scripts.length} idle
        </div>
      </div>

      {/* Script list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {SCRIPT_DEFS.map(def => {
          const running  = scripts.find(s => s.defId === def.id)
          const canAfford = influence >= def.costInfluence
          const meetsRep  = (def.minShadow ?? 0) <= shadow
          const canDeploy = canAfford && meetsRep && !running
          const catColor  = CATEGORY_COLOR[def.category]

          // Countdown to next yield
          let countdown = ''
          if (running) {
            const elapsed  = now - running.lastTickAt
            const remaining = Math.max(0, TICK_MS - elapsed)
            const secs = Math.ceil(remaining / 1000)
            countdown = secs < 60 ? `${secs}s` : `${Math.ceil(secs / 60)}m`
          }

          return (
            <div key={def.id} style={{
              borderBottom: `1px solid ${C.border}`,
              background: running ? `${catColor}07` : 'transparent',
              borderLeft: running ? `2px solid ${catColor}66` : '2px solid transparent',
            }}>
              {/* Script header */}
              <div style={{
                padding: '12px 14px 8px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: catColor, fontSize: 10, letterSpacing: '0.08em' }}>{def.tag}</span>
                    <span style={{ color: running ? C.text : C.muted, fontWeight: running ? 'bold' : 'normal' }}>
                      {def.name}
                    </span>
                    <span style={{
                      fontSize: 9, letterSpacing: '0.1em',
                      color: running ? C.success : C.faint,
                    }}>
                      {running ? '● RUNNING' : '◌ IDLE'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 6 }}>
                    {def.desc}
                  </div>

                  {/* Requirements / stats */}
                  {running ? (
                    <div style={{ display: 'flex', gap: 14, fontSize: 10, color: C.faint, flexWrap: 'wrap' }}>
                      <span>uptime: <span style={{ color: C.muted }}>{fmtUptime(running.deployedAt)}</span></span>
                      <span>yield: <span style={{ color: C.success }}>{running.totalYield.toFixed(1)} ⬡</span></span>
                      <span>next: <span style={{ color: C.accent }}>{countdown}</span></span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, fontSize: 10, flexWrap: 'wrap' }}>
                      {def.costInfluence > 0 && (
                        <span style={{ color: canAfford ? C.faint : C.danger }}>
                          cost: {def.costInfluence} ⬡
                          {!canAfford && <span style={{ color: C.danger }}> (need {def.costInfluence - influence} more)</span>}
                        </span>
                      )}
                      {def.costInfluence === 0 && (
                        <span style={{ color: C.faint }}>free to deploy</span>
                      )}
                      {def.minShadow && (
                        <span style={{ color: meetsRep ? C.faint : C.danger }}>
                          shadow ≥ {def.minShadow} {!meetsRep && `(yours: ${shadow})`}
                        </span>
                      )}
                      <span style={{ color: catColor, fontSize: 9 }}>{def.category}</span>
                    </div>
                  )}
                </div>

                {/* Deploy / Stop button */}
                <div style={{ flexShrink: 0 }}>
                  {running ? (
                    <button onClick={() => stopScript(def.id)} style={btnStyle(C.danger, 'outline')}>
                      STOP
                    </button>
                  ) : (
                    <button
                      onClick={() => canDeploy && deployScript(def.id, shadow)}
                      disabled={!canDeploy}
                      style={btnStyle(canDeploy ? C.success : C.faint, canDeploy ? 'fill' : 'outline')}
                    >
                      DEPLOY
                    </button>
                  )}
                </div>
              </div>

              {/* Log output — only when running */}
              {running && running.log.length > 0 && (
                <div style={{
                  margin: '0 14px 12px',
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 4, padding: '8px 10px',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}>
                  {running.log.map((line, i) => (
                    <div key={i} style={{
                      fontSize: 10, color: i === 0 ? C.muted : C.faint,
                      fontFamily: 'inherit',
                    }}>
                      <span style={{ color: C.faint }}>{'>'} </span>{line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Bottom padding */}
        <div style={{ height: 20 }} />
      </div>
    </div>
  )
}

// ── Following Tab ──────────────────────────────────────────────────────────────

function FollowingTab() {
  const following   = useNodeStore(s => s.following)
  const follow      = useNodeStore(s => s.follow)
  const unfollow    = useNodeStore(s => s.unfollow)
  const notFollowing = NPC_ACCOUNTS.filter(a => !following.includes(a.id))

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {following.length > 0 && (
        <>
          <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.faint, letterSpacing: '0.12em' }}>
            SUBSCRIBED
          </div>
          {following.map(id => (
            <AccountRow key={id} acc={getAccount(id)} followed={true} onToggle={() => unfollow(id)} />
          ))}
          <div style={{ height: 1, background: C.border, margin: '8px 0' }} />
        </>
      )}
      <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.faint, letterSpacing: '0.12em' }}>
        SUGGESTED
      </div>
      {notFollowing.map(acc => (
        <AccountRow key={acc.id} acc={acc} followed={false} onToggle={() => follow(acc.id)} />
      ))}
    </div>
  )
}

function AccountRow({ acc, followed, onToggle }: { acc: NodeAccount; followed: boolean; onToggle: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px', borderBottom: `1px solid ${C.border}`,
    }}>
      <Avatar acc={acc} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontWeight: 'bold', color: factionColor(acc), fontSize: 12 }}>{acc.display}</span>
          {accountBadge(acc)}
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>@{acc.handle}</div>
        <div style={{ fontSize: 10, color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {acc.bio}
        </div>
      </div>
      <div style={{ fontSize: 10, color: C.faint, flexShrink: 0 }}>{fmtNum(acc.subs)} subs</div>
      <button onClick={onToggle} style={btnStyle(followed ? C.muted : C.accent, followed ? 'outline' : 'fill')}>
        {followed ? 'unsubscribe' : 'subscribe'}
      </button>
    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────────

function ProfileTab() {
  const signals      = useNodeStore(s => s.signals)
  const influence    = useNodeStore(s => s.influence)
  const inbox        = useNodeStore(s => s.inbox)
  const markAllRead  = useNodeStore(s => s.markAllRead)

  const myPosts      = signals.filter(s => s.isPlayer)
  const totalUplinks = myPosts.reduce((n, s) => n + s.uplinks, 0)
  const totalRelays  = myPosts.reduce((n, s) => n + s.relays,  0)
  const unread       = inbox.filter(m => !m.read).length

  const INBOX_TYPE_COLOR: Record<string, string> = {
    reply:   C.accent,
    mention: C.violet,
    alert:   C.warn,
    system:  C.muted,
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Profile header */}
      <div style={{ padding: 16, background: C.surf2, borderBottom: `1px solid ${C.border}` }}>
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
          <Stat label="SIGNALS"   value={myPosts.length} />
          <Stat label="UPLINKS"   value={totalUplinks}   />
          <Stat label="RELAYS"    value={totalRelays}     />
          <Stat label="INFLUENCE" value={influence.toFixed(1)} color={C.success} suffix=" ⬡" />
        </div>
      </div>

      {/* Inbox */}
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          padding: '10px 14px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 9, color: C.faint, letterSpacing: '0.12em' }}>
            INBOX {unread > 0 && <span style={{ color: C.danger }}>({unread} unread)</span>}
          </span>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ ...btnStyle(C.faint, 'ghost'), fontSize: 9 }}>
              mark all read
            </button>
          )}
        </div>
        {inbox.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: 11, color: C.faint }}>
            No messages yet. Post a signal to start getting reactions.
          </div>
        ) : (
          inbox.slice(0, 20).map(msg => {
            const acc   = getAccount(msg.fromId)
            const color = INBOX_TYPE_COLOR[msg.type] ?? C.muted
            return (
              <div key={msg.id} style={{
                padding: '10px 14px',
                borderTop: `1px solid ${C.border}`,
                background: msg.read ? 'transparent' : `${color}08`,
                borderLeft: msg.read ? 'none' : `2px solid ${color}55`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 8, color, letterSpacing: '0.1em',
                    border: `1px solid ${color}44`, borderRadius: 2, padding: '1px 4px',
                  }}>
                    {msg.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: factionColor(acc), fontWeight: 'bold' }}>
                    {acc.display}
                  </span>
                  <span style={{ fontSize: 9, color: C.faint }}>· {fmtTime(msg.ts)}</span>
                  {!msg.read && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, marginLeft: 'auto' }} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{msg.body}</div>
              </div>
            )
          })
        )}
      </div>

      {/* My signals */}
      <div style={{ padding: '10px 14px 4px', fontSize: 9, color: C.faint, letterSpacing: '0.12em' }}>
        YOUR SIGNALS
      </div>
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

// ── Shared small components ────────────────────────────────────────────────────

function Avatar({ acc }: { acc: NodeAccount }) {
  const color = acc.faction ? FACTIONS[acc.faction]?.color ?? C.muted : C.muted
  return (
    <div style={{
      width: 36, height: 36, flexShrink: 0, borderRadius: 6,
      background: C.surf3, border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 'bold', color,
    }}>
      {acc.avatar}
    </div>
  )
}

function Stat({ label, value, color, suffix }: { label: string; value: string | number; color?: string; suffix?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: color ?? C.text, fontWeight: 'bold' }}>{value}{suffix}</div>
      <div style={{ color: C.faint, fontSize: 9 }}>{label}</div>
    </div>
  )
}

function ActionBtn({ label, icon, active, activeColor, onClick }: {
  label: string; icon: string; active: boolean; activeColor: string; onClick: () => void
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
