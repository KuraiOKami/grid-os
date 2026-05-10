import { useState, useEffect } from 'react'
import { useFSStore } from '@/store/fsStore'

// Known encrypted files and their decrypted contents
const CIPHER_DB: Record<string, { cipher: string; strength: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL'; content: string }> = {
  'memo_441c.enc': {
    cipher: 'AES-256-GridLock',
    strength: 'MED',
    content: `GRIDOS INTERNAL — MEMO 441-C
CLASSIFICATION: RESTRICTED
TO: All Compliance Analysts

Effective immediately, all ROOT BLOOM-related node failures are to be
logged as "routine service decay" in public-facing incident reports.

Do NOT reference ROOT BLOOM by name in any external communication.
Do NOT file escalation tickets through standard channels.
Direct all anomalous decay events to queue 441 (internal only).

Analysts who deviate from this protocol will be flagged for review.

This memo self-destructs from the audit trail in 72 hours.
— Director Halsen, GridOS Integrity Division`,
  },
  'node_identity_redacted.enc': {
    cipher: 'GridCipher-v3',
    strength: 'LOW',
    content: `NODE IDENTITY RECORD — REDACTED COPY
Handle:   @PHX_LEAKS
Real ID:  [REDACTED — see civic.archive]
Faction:  PHANTOM CIRCUIT
Role:     Active leaker / signal amplifier
Status:   FLAGGED — compliance score 3/100

Associated domains: ghostlily.blog, civic.archive/flowering
Last known relay:   exit-node-9 → void-exit-2.net
Notes:    Subject is aware of surveillance. Do not approach directly.
          NEXUS enforcement has a standing warrant. Not yet served.`,
  },
}

interface CrackSession {
  file:     string
  progress: number
  done:     boolean
  success:  boolean
  output:   string
}

function findEncFiles(node: ReturnType<typeof useFSStore>['root'], path: string[] = []): string[] {
  const results: string[] = []
  if (node.type === 'file' && node.name.endsWith('.enc')) {
    results.push('/' + [...path, node.name].join('/'))
  }
  if (node.children) {
    for (const child of node.children) {
      results.push(...findEncFiles(child, [...path, node.name === '/' ? '' : node.name].filter(Boolean)))
    }
  }
  return results
}

export default function CipherApp() {
  const fs = useFSStore()

  const encFiles = findEncFiles(fs.root)

  const [selected,   setSelected]   = useState(encFiles[0] ?? '')
  const [mode,       setMode]       = useState<'dictionary' | 'pattern' | 'brute'>('dictionary')
  const [session,    setSession]    = useState<CrackSession | null>(null)
  const [log,        setLog]        = useState<{ file: string; success: boolean }[]>([])

  useEffect(() => {
    if (!selected && encFiles.length > 0) setSelected(encFiles[0])
  }, [encFiles.length])

  async function runCrack() {
    if (!selected || session?.progress !== undefined && !session.done) return

    const filename = selected.split('/').pop() ?? ''
    const known    = CIPHER_DB[filename]
    const strength = known?.strength ?? 'HIGH'
    const duration = { LOW: 3000, MED: 6000, HIGH: 10000, CRITICAL: 16000 }[strength]
    const succeed  = mode === 'brute' ? Math.random() > 0.2
                   : mode === 'pattern' ? Math.random() > 0.35
                   : Math.random() > 0.5

    setSession({ file: selected, progress: 0, done: false, success: false, output: '' })

    const steps = 40
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, duration / steps))
      setSession(s => s ? { ...s, progress: Math.round((i / steps) * 100) } : s)
    }

    if (succeed && known) {
      // Write cracked file to filesystem
      const crackedPath = selected.replace('.enc', '.dec').split('/').filter(Boolean)
      fs.writeFile(crackedPath, known.content)
      setSession(s => s ? { ...s, done: true, success: true, output: known.content } : s)
      setLog(prev => [{ file: filename, success: true }, ...prev])
    } else {
      setSession(s => s ? { ...s, done: true, success: false, output: '' } : s)
      setLog(prev => [{ file: filename, success: false }, ...prev])
    }
  }

  const busy = session && !session.done

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 font-mono text-xs select-none overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
        <span className="font-black text-violet-400 tracking-widest">CIPHER</span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-500 uppercase tracking-wider">Encryption Analysis Suite</span>
        <div className="ml-auto text-zinc-700">v2.1.0</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* File selector */}
        <div className="space-y-1.5">
          <div className="text-zinc-600 uppercase tracking-widest">Select File</div>
          {encFiles.length === 0 ? (
            <div className="text-zinc-600 py-3 text-center border border-dashed border-zinc-800 rounded">
              No .enc files found. Obtain them via Terminal exfil.
            </div>
          ) : (
            <select
              value={selected}
              onChange={e => { setSelected(e.target.value); setSession(null) }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-violet-300 focus:outline-none focus:border-violet-700"
            >
              {encFiles.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          {selected && CIPHER_DB[selected.split('/').pop() ?? ''] && (
            <div className="flex gap-4 text-xs mt-1 px-1">
              <span className="text-zinc-600">Cipher: <span className="text-zinc-400">{CIPHER_DB[selected.split('/').pop()!].cipher}</span></span>
              <span className="text-zinc-600">Strength: <span className={
                CIPHER_DB[selected.split('/').pop()!].strength === 'LOW' ? 'text-green-400'
                : CIPHER_DB[selected.split('/').pop()!].strength === 'MED' ? 'text-yellow-400'
                : CIPHER_DB[selected.split('/').pop()!].strength === 'HIGH' ? 'text-orange-400'
                : 'text-red-400'
              }>{CIPHER_DB[selected.split('/').pop()!].strength}</span></span>
            </div>
          )}
        </div>

        {/* Attack mode */}
        <div className="space-y-1.5">
          <div className="text-zinc-600 uppercase tracking-widest">Attack Mode</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['dictionary', 'pattern', 'brute'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-1.5 rounded border text-xs uppercase tracking-wider font-bold transition-colors ${
                  mode === m ? 'border-violet-600 text-violet-400 bg-violet-950/20' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="text-zinc-700 px-1">
            {mode === 'dictionary' ? 'Common wordlists. Fast, low success on strong ciphers.'
            : mode === 'pattern' ? 'Pattern analysis. Balanced speed and success rate.'
            : 'Full brute force. Slow but highest success rate.'}
          </div>
        </div>

        {/* Run button */}
        {!busy && (
          <button
            onClick={runCrack}
            disabled={!selected || encFiles.length === 0}
            className="w-full py-2 border border-violet-900/60 rounded text-violet-400 hover:border-violet-600 hover:bg-violet-950/20 transition-colors font-bold tracking-wider uppercase disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ▶ INITIATE CRACK
          </button>
        )}

        {/* Progress */}
        {session && !session.done && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-violet-700">
              <span className="animate-pulse">◉ Cracking {session.file.split('/').pop()}…</span>
              <span>{session.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-violet-600 h-1.5 rounded-full transition-all"
                style={{ width: `${session.progress}%` }}
              />
            </div>
            <div className="text-zinc-700 animate-pulse">
              {session.progress < 30 ? 'Probing cipher structure…'
              : session.progress < 60 ? 'Running attack vectors…'
              : session.progress < 85 ? 'Testing key candidates…'
              : 'Finalizing…'}
            </div>
          </div>
        )}

        {/* Result */}
        {session?.done && (
          <div className={`border rounded p-3 space-y-2 ${session.success ? 'border-green-900/40 bg-green-950/5' : 'border-red-900/40 bg-red-950/5'}`}>
            <div className={`font-bold text-xs tracking-wider ${session.success ? 'text-green-400' : 'text-red-400'}`}>
              {session.success ? '✓ DECRYPTION SUCCESSFUL' : '✗ CRACK FAILED'}
            </div>
            {session.success ? (
              <>
                <div className="text-zinc-500 text-xs">Decrypted file saved to filesystem (.dec)</div>
                <pre className="text-xs text-green-300/80 whitespace-pre-wrap leading-relaxed bg-zinc-900/80 rounded p-2 max-h-48 overflow-y-auto">{session.output}</pre>
                <button onClick={() => setSession(null)} className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-violet-500 hover:border-violet-900 transition-colors">
                  ↺ CRACK ANOTHER
                </button>
              </>
            ) : (
              <>
                <div className="text-zinc-500 text-xs">Cipher held. Try a different attack mode or upgrade wordlists.</div>
                <button onClick={() => setSession(null)} className="w-full py-1.5 border border-zinc-800 rounded text-xs text-zinc-600 hover:text-violet-500 hover:border-violet-900 transition-colors">
                  ↺ RETRY
                </button>
              </>
            )}
          </div>
        )}

        {/* Session log */}
        {log.length > 0 && (
          <div className="space-y-1">
            <div className="text-zinc-700 uppercase tracking-widest">Session Log</div>
            {log.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={entry.success ? 'text-green-500' : 'text-red-500'}>{entry.success ? '✓' : '✗'}</span>
                <span className="text-zinc-500">{entry.file}</span>
                <span className={`ml-auto ${entry.success ? 'text-green-700' : 'text-red-900'}`}>{entry.success ? 'CRACKED' : 'FAILED'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
        <span className="text-zinc-700">CIPHER // local processing // no network trace</span>
        <span className="text-zinc-700">{encFiles.length} file{encFiles.length !== 1 ? 's' : ''} indexed</span>
      </div>
    </div>
  )
}
