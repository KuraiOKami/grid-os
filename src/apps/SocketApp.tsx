import { useState, useEffect, useRef } from 'react'
import { useSocketStore } from '@/store/socketStore'

const FACTION_COLOR: Record<string, string> = {
  synd:  'text-yellow-400',
  guild: 'text-violet-400',
  nexus: 'text-blue-400',
  iron:  'text-orange-400',
}

function fmtTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000)   return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export default function SocketApp() {
  const {
    contacts, conversations, activeContact,
    setActiveContact, sendMessage, markRead,
  } = useSocketStore()

  const [draft,   setDraft]   = useState('')
  const bottomRef             = useRef<HTMLDivElement>(null)

  const active   = contacts.find(c => c.id === activeContact)
  const msgs     = activeContact ? (conversations[activeContact] ?? []) : []
  const totalUnread = contacts.reduce((n, c) => n + c.unread, 0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length, activeContact])

  function openContact(id: string) {
    setActiveContact(id)
    markRead(id)
  }

  function handleSend() {
    const body = draft.trim()
    if (!body || !activeContact) return
    sendMessage(activeContact, body)
    setDraft('')
  }

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-200 font-mono text-xs select-none overflow-hidden">

      {/* Sidebar */}
      <div className="w-44 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-black text-emerald-400 tracking-widest">SOCKET</span>
          {totalUnread > 0 && (
            <span className="ml-auto bg-emerald-600 text-zinc-950 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="text-zinc-700 uppercase tracking-widest px-3 py-2 border-b border-zinc-800/50">Contacts</div>

        <div className="flex-1 overflow-y-auto">
          {contacts.map(c => (
            <button
              key={c.id}
              onClick={() => openContact(c.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/40 transition-colors ${
                activeContact === c.id ? 'bg-emerald-950/20 border-l-2 border-l-emerald-700' : 'hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  c.status === 'online' ? 'bg-emerald-500' : c.status === 'away' ? 'bg-yellow-500' : 'bg-zinc-600'
                }`} />
                <span className={`font-bold truncate flex-1 ${c.faction ? FACTION_COLOR[c.faction] ?? 'text-zinc-300' : 'text-zinc-300'}`}>
                  {c.handle}
                </span>
                {c.unread > 0 && (
                  <span className="bg-emerald-600 text-zinc-950 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                    {c.unread}
                  </span>
                )}
              </div>
              {c.bio && (
                <div className="text-zinc-600 mt-0.5 truncate pl-3">{c.bio}</div>
              )}
              {conversations[c.id]?.length > 0 && (
                <div className="text-zinc-700 mt-0.5 truncate pl-3">
                  {conversations[c.id].at(-1)?.body.slice(0, 28)}…
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="px-3 py-1.5 border-t border-zinc-800 text-zinc-700">
          E2E encrypted
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeContact ? (
          <div className="flex-1 flex items-center justify-center text-zinc-700">
            Select a contact to open a channel.
          </div>
        ) : (
          <>
            {/* Convo header */}
            <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${
                active?.status === 'online' ? 'bg-emerald-500' : active?.status === 'away' ? 'bg-yellow-500' : 'bg-zinc-600'
              }`} />
              <span className={`font-bold ${active?.faction ? FACTION_COLOR[active.faction] ?? 'text-zinc-300' : 'text-zinc-300'}`}>
                {active?.handle}
              </span>
              <span className="text-zinc-700 ml-1">{active?.status}</span>
              <span className="ml-auto text-zinc-700 text-xs">channel encrypted</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {msgs.length === 0 && (
                <div className="text-zinc-700 py-4 text-center">No messages yet. Send one to open the channel.</div>
              )}
              {msgs.map(msg => (
                <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.from === 'you' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded text-xs leading-relaxed ${
                    msg.from === 'you'
                      ? 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-200'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                  }`}>
                    {msg.body}
                  </div>
                  <div className="text-zinc-700 px-1">{fmtTime(msg.ts)}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Compose */}
            <div className="border-t border-zinc-800 px-3 py-2 flex gap-2 shrink-0 bg-zinc-900/40">
              <input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type message… (Enter to send)"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-800"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="px-3 py-1.5 border border-emerald-800 rounded text-xs text-emerald-400 hover:bg-emerald-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold"
              >
                SEND
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
