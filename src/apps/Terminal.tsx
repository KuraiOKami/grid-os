// ── Terminal.tsx ─────────────────────────────────────────────────────────────
// GridOS terminal emulator. Shares fsStore with the FileSystem app.
// Local commands: help, ls, cd, cat, pwd, mkdir, rm, cp, mv, touch, echo,
//                 clear, whoami, uptime, ps, find, grep, history, exec,
//                 scan, connect
// Hack session commands (when connected to a remote node):
//                 ls, cat, exfil, disconnect, clear

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useFSStore, pathStr, FSNode } from '@/store/fsStore'
import { useRepStore } from '@/store/reputationStore'
import { useWalletStore } from '@/store/walletStore'
import { useCareerStore } from '@/store/careerStore'
import { HACK_NODES, HackFile } from '@/data/hackNodes'
import { completeJob, acceptJob, getJob } from '@/store/jobStore'

const C = {
  bg:      '#0a0a0f',
  text:    '#c8c8d8',
  muted:   '#6b6b80',
  accent:  '#00e5ff',
  danger:  '#ff3b5c',
  warn:    '#ffaa00',
  success: '#00cc88',
  violet:  '#d6a2ff',
  faint:   '#3a3a4a',
}

type LineType = 'input' | 'output' | 'error' | 'info' | 'success' | 'warn'

interface Line {
  id:      number
  type:    LineType
  text:    string
  prompt?: string
}

interface HackSession {
  nodeId:      string
  nodeName:    string
  tier:        number
  files:       HackFile[]
  exfilled:    string[]
  jobId?:      string
  targetFile?: string
}

let _lid = 0
function mkLine(type: LineType, text: string, prompt?: string): Line {
  return { id: _lid++, type, text, prompt }
}

const BOOT_LINES: Line[] = [
  mkLine('info',   'GRID-OS v4.7.1  GridShell (gsh)'),
  mkLine('info',   "Type 'help' for available commands. Type 'scan' to find nearby nodes."),
  mkLine('info',   '──────────────────────────────────────'),
]

const HELP_LOCAL = [
  'local commands:',
  '  ls [-a]           list directory contents',
  '  cd <path>         change directory',
  '  pwd               print current path',
  '  cat <file>        print file contents',
  '  touch <file>      create empty file',
  '  mkdir <dir>       create directory',
  '  rm [-r] <path>    remove file or directory',
  '  cp <src> <dst>    copy file',
  '  mv <src> <dst>    move / rename',
  '  find <name>       search for file by name',
  '  grep <str> <file> search file for string',
  '  echo <text>       print text',
  '  whoami            show citizen info',
  '  uptime            show session uptime',
  '  ps                show running processes',
  '  history           show command history',
  '  clear             clear terminal',
  '  exec <script>     run a .sh script',
  '',
  'hacking:',
  '  scan              discover nearby nodes',
  '  connect <node-id> connect to a node',
].join('\n')

const HELP_HACK = [
  'remote shell commands:',
  '  ls                list files on node',
  '  cat <file>        read file contents',
  '  exfil <file>      extract file to local system',
  '  disconnect        close connection and return to local shell',
  '  clear             clear terminal',
].join('\n')

const TIER_STARS = ['☆☆☆☆☆', '★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★']

const FAKE_PROCESSES = [
  { pid: 1,   name: 'init',          cpu: '0.0%',  mem: '0.1%'  },
  { pid: 44,  name: 'gsh',           cpu: '0.1%',  mem: '0.4%'  },
  { pid: 120, name: 'nexus-monitor', cpu: '2.1%',  mem: '1.2%'  },
  { pid: 203, name: 'mail-daemon',   cpu: '0.0%',  mem: '0.3%'  },
  { pid: 441, name: 'node-sync',     cpu: '0.4%',  mem: '0.8%'  },
  { pid: 888, name: '[REDACTED]',    cpu: '??.?%', mem: '??.?%' },
]

const START_TIME = Date.now()

export default function Terminal() {
  const [lines,       setLines]       = useState<Line[]>(BOOT_LINES)
  const [input,       setInput]       = useState('')
  const [cmdHistory,  setCmdHistory]  = useState<string[]>([])
  const [histIdx,     setHistIdx]     = useState(-1)
  const [hackSession, setHackSession] = useState<HackSession | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const fs         = useFSStore()
  const compliance = useRepStore(s => s.compliance)

  // Keep a ref so timeout callbacks inside hack commands can read current session
  const sessionRef = useRef<HackSession | null>(null)
  sessionRef.current = hackSession

  const prompt = () =>
    hackSession
      ? `${hackSession.nodeId}$ `
      : `citizen@grid:${pathStr(fs.cwd)}$ `

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  function push(...newLines: Line[]) {
    setLines(prev => [...prev, ...newLines])
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, cmdHistory.length - 1)
      setHistIdx(idx)
      setInput(cmdHistory[idx] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : cmdHistory[idx])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      autocomplete()
    }
  }

  function autocomplete() {
    if (hackSession) return
    const parts = input.trim().split(/\s+/)
    if (parts.length < 2) return
    const partial = parts[parts.length - 1]
    const entries = fs.listDir(fs.cwd, true)
    const match = entries.find(e => e.name.startsWith(partial))
    if (match) {
      parts[parts.length - 1] = match.name + (match.type === 'dir' ? '/' : '')
      setInput(parts.join(' '))
    }
  }

  function submit() {
    const raw = input.trim()
    if (!raw) return
    push(mkLine('input', raw, prompt()))
    setCmdHistory(prev => [raw, ...prev])
    setHistIdx(-1)
    setInput('')
    if (hackSession) {
      runHackCommand(raw, hackSession)
    } else {
      runLocalCommand(raw)
    }
  }

  // ── Hack session commands ─────────────────────────────────────────────────

  function runHackCommand(raw: string, session: HackSession) {
    const [cmd, ...args] = raw.split(/\s+/)

    switch (cmd) {

      case 'help':
        push(mkLine('output', HELP_HACK))
        break

      case 'clear':
        setLines([])
        break

      case 'ls': {
        if (session.files.length === 0) {
          push(mkLine('output', '(empty)'))
        } else {
          const rows = session.files.map(f =>
            f.size.padStart(6) + '  ' + f.name +
            (session.exfilled.includes(f.name) ? '  [exfilled]' : '')
          )
          push(mkLine('output', rows.join('\n')))
        }
        break
      }

      case 'cat': {
        if (!args[0]) { push(mkLine('error', 'usage: cat <file>')); break }
        const file = session.files.find(f => f.name === args[0])
        if (!file) { push(mkLine('error', `cat: ${args[0]}: no such file`)); break }
        push(mkLine('output', file.content))
        break
      }

      case 'exfil': {
        if (!args[0]) { push(mkLine('error', 'usage: exfil <file>')); break }
        const filename = args[0]
        const file = session.files.find(f => f.name === filename)
        if (!file) { push(mkLine('error', `exfil: ${filename}: no such file`)); break }
        if (session.exfilled.includes(filename)) {
          push(mkLine('warn', `[!] ${filename} already exfilled this session.`))
          break
        }

        const isTarget = filename === session.targetFile && !!session.jobId

        push(mkLine('info', `[*] Initiating exfiltration of ${filename}...`))

        setTimeout(() => {
          push(mkLine('info', '[*] Routing through anonymous relay...'))
          setTimeout(() => {
            push(mkLine('output', '[*] ████████████████████ 100%'))
            setTimeout(() => {
              // Mark file as exfilled
              setHackSession(prev => prev
                ? { ...prev, exfilled: [...prev.exfilled, filename] }
                : prev
              )
              push(mkLine('success', `[+] ${filename} received (${file.size})`))

              if (isTarget) {
                const job = getJob(session.jobId!)
                // Auto-accept if somehow not yet accepted, then complete
                if (job && !job.accepted) acceptJob(job.id)
                completeJob(session.jobId!)
                useWalletStore.getState().credit(
                  session.files.length > 0 ? (job?.payAmount ?? 250) : 250,
                  `Hack payout: ${job?.title ?? 'contract'}`
                )
                useCareerStore.getState().addXP('hacker', 20)
                useRepStore.getState().applyEvent({ shadow: 2, compliance: -1 })

                push(
                  mkLine('success', `[+] Contract complete: "${job?.title ?? 'Hack Job'}"` ),
                  mkLine('success', `[+] ₳ ${job?.payAmount ?? 250} credited to wallet.`),
                  mkLine('success', '[+] Hacker XP +20'),
                  mkLine('success', '[+] Shadow +2 / Compliance -1'),
                  mkLine('warn',    '[!] Disconnect recommended — exposure timer active.'),
                )
              }
            }, 700)
          }, 500)
        }, 400)
        break
      }

      case 'disconnect': {
        const name = session.nodeName
        push(
          mkLine('info',    `[*] Closing connection to ${name}...`),
          mkLine('success', '[+] Session terminated. No trace logged.'),
        )
        setHackSession(null)
        break
      }

      default:
        push(mkLine('error', `${cmd}: not available on remote shell`))
        push(mkLine('info',  "    Available: ls, cat, exfil, disconnect, clear"))
        break
    }
  }

  // ── Local commands ────────────────────────────────────────────────────────

  function runLocalCommand(raw: string) {
    const [cmd, ...args] = raw.split(/\s+/)

    switch (cmd) {

      case 'help':
        push(mkLine('output', HELP_LOCAL))
        break

      case 'clear':
        setLines([])
        break

      case 'pwd':
        push(mkLine('output', pathStr(fs.cwd) || '/'))
        break

      case 'whoami':
        push(mkLine('output', [
          'citizen4471',
          'clearance  : standard',
          'sector     : 7',
          `grid rep   : ${compliance}`,
          'flagged    : false',
          'shell      : /bin/gsh',
        ].join('\n')))
        break

      case 'uptime': {
        const ms  = Date.now() - START_TIME
        const sec = Math.floor(ms / 1000)
        const min = Math.floor(sec / 60)
        const hr  = Math.floor(min / 60)
        push(mkLine('output', `session uptime: ${hr}h ${min % 60}m ${sec % 60}s`))
        break
      }

      case 'ps': {
        const header  = 'PID     NAME                  CPU     MEM'
        const divider = '──────  ────────────────────  ──────  ──────'
        const rows = FAKE_PROCESSES.map(p =>
          String(p.pid).padEnd(6) + '  ' +
          p.name.padEnd(20) + '  ' +
          p.cpu.padEnd(6) + '  ' +
          p.mem
        )
        push(mkLine('output', [header, divider, ...rows].join('\n')))
        break
      }

      case 'ls': {
        const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al')
        const targetArg  = args.find(a => !a.startsWith('-'))
        const targetPath = targetArg ? fs.resolvePath(targetArg) : fs.cwd
        const entries    = fs.listDir(targetPath, showHidden)
        if (entries.length === 0) {
          push(mkLine('output', '(empty)'))
        } else {
          const out = entries.map(e => {
            const name = e.type === 'dir' ? e.name + '/' : e.name
            const size = e.type === 'file' ? (String(e.meta?.size ?? 0) + 'B').padStart(8) : '      --'
            const lock = e.locked ? ' [L]' : ''
            return `${size}  ${name}${lock}`
          }).join('\n')
          push(mkLine('output', out))
        }
        break
      }

      case 'cd': {
        const target = args[0]
        if (!target || target === '~') { fs.setCwd(['home', 'citizen']); break }
        const newPath = fs.resolvePath(target)
        const node    = fs.getNode(newPath)
        if (!node)               { push(mkLine('error', `cd: no such directory: ${target}`)); break }
        if (node.type !== 'dir') { push(mkLine('error', `cd: not a directory: ${target}`));   break }
        fs.setCwd(newPath)
        break
      }

      case 'cat': {
        if (!args[0]) { push(mkLine('error', 'usage: cat <file>')); break }
        const path = fs.resolvePath(args[0])
        const node = fs.getNode(path)
        if (!node)               { push(mkLine('error', `cat: no such file: ${args[0]}`));   break }
        if (node.type === 'dir') { push(mkLine('error', `cat: ${args[0]}: is a directory`)); break }
        const content = fs.readFile(path) ?? ''
        push(mkLine('output', content || '(empty file)'))
        break
      }

      case 'touch': {
        if (!args[0]) { push(mkLine('error', 'usage: touch <file>')); break }
        const ok = fs.writeFile(fs.resolvePath(args[0]), '')
        if (!ok) push(mkLine('error', `touch: cannot create: ${args[0]}`))
        break
      }

      case 'mkdir': {
        if (!args[0]) { push(mkLine('error', 'usage: mkdir <dir>')); break }
        const ok = fs.mkdir(fs.resolvePath(args[0]))
        if (!ok) push(mkLine('error', `mkdir: cannot create directory: ${args[0]}`))
        break
      }

      case 'rm': {
        const recursive = args.includes('-r') || args.includes('-rf')
        const target    = args.find(a => !a.startsWith('-'))
        if (!target) { push(mkLine('error', 'usage: rm [-r] <path>')); break }
        const path = fs.resolvePath(target)
        const node = fs.getNode(path)
        if (!node)       { push(mkLine('error', `rm: no such file: ${target}`));       break }
        if (node.locked) { push(mkLine('error', `rm: permission denied: ${target}`));  break }
        const ok = fs.rm(path, recursive)
        if (!ok) push(mkLine('error', `rm: ${target}: directory not empty (use -r)`))
        break
      }

      case 'cp': {
        if (args.length < 2) { push(mkLine('error', 'usage: cp <src> <dst>')); break }
        const ok = fs.cp(fs.resolvePath(args[0]), fs.resolvePath(args[1]))
        if (!ok) push(mkLine('error', `cp: failed to copy ${args[0]} to ${args[1]}`))
        break
      }

      case 'mv': {
        if (args.length < 2) { push(mkLine('error', 'usage: mv <src> <dst>')); break }
        const ok = fs.mv(fs.resolvePath(args[0]), fs.resolvePath(args[1]))
        if (!ok) push(mkLine('error', `mv: failed to move ${args[0]} to ${args[1]}`))
        break
      }

      case 'echo':
        push(mkLine('output', args.join(' ')))
        break

      case 'find': {
        if (!args[0]) { push(mkLine('error', 'usage: find <name>')); break }
        const query   = args[0].toLowerCase()
        const results: string[] = []
        function walk(node: FSNode, path: string[]) {
          if (node.name.toLowerCase().includes(query)) results.push(pathStr(path))
          node.children?.forEach(c => walk(c, [...path, c.name]))
        }
        walk(useFSStore.getState().root, [])
        push(mkLine('output', results.length ? results.join('\n') : `find: no results for "${args[0]}"`))
        break
      }

      case 'grep': {
        if (args.length < 2) { push(mkLine('error', 'usage: grep <string> <file>')); break }
        const query   = args[0].toLowerCase()
        const content = fs.readFile(fs.resolvePath(args[1]))
        if (content === null) { push(mkLine('error', `grep: ${args[1]}: no such file`)); break }
        const matches = content.split('\n')
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.toLowerCase().includes(query))
          .map(({ l, i }) => `${String(i + 1).padStart(4)}: ${l}`)
        push(mkLine('output', matches.length ? matches.join('\n') : `grep: no matches for "${args[0]}"`))
        break
      }

      case 'history':
        push(mkLine('output',
          cmdHistory.length === 0
            ? '(no history)'
            : cmdHistory.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n')
        ))
        break

      case 'exec': {
        if (!args[0]) { push(mkLine('error', 'usage: exec <script.sh>')); break }
        const content = fs.readFile(fs.resolvePath(args[0]))
        if (content === null)         { push(mkLine('error', `exec: ${args[0]}: not found`));      break }
        if (!args[0].endsWith('.sh')) { push(mkLine('error', `exec: ${args[0]}: not executable`)); break }
        const scriptLines = content.split('\n').filter(l => !l.startsWith('#') && l.trim())
        push(mkLine('info', `[exec] running ${args[0]}...`))
        scriptLines.forEach(sl => {
          if (sl.startsWith('echo ')) push(mkLine('output', sl.slice(5)))
          else push(mkLine('output', `> ${sl}`))
        })
        push(mkLine('success', '[exec] done'))
        break
      }

      // ── Hacking ────────────────────────────────────────────────────────────

      case 'scan': {
        const header  = 'ID            NAME                       TIER     STATUS'
        const divider = '────────────  ─────────────────────────  ───────  ──────────────────────'
        const rows = HACK_NODES.map(n => {
          const tier   = n.tier === 0 ? 'NONE  ' : TIER_STARS[Math.min(n.tier, 5)].padEnd(6)
          const status = n.status.toUpperCase().padEnd(10)
          const note   = n.scanNote ? `  ← ${n.scanNote}` : ''
          return `${n.id.padEnd(12)}  ${n.name.padEnd(25)}  ${tier}   ${status}${note}`
        })

        push(mkLine('info',   '[*] Scanning local grid segment...'))
        push(mkLine('output', [header, divider, ...rows].join('\n')))

        const unsecured = HACK_NODES.filter(n => n.tier === 0)
        if (unsecured.length) {
          push(mkLine('info', `[!] Unsecured node detected: ${unsecured[0].id} — use 'connect ${unsecured[0].id}'`))
        }
        break
      }

      case 'connect': {
        const nodeId = args[0]
        if (!nodeId) { push(mkLine('error', 'usage: connect <node-id>')); break }

        const node = HACK_NODES.find(n => n.id === nodeId)
        if (!node) { push(mkLine('error', `connect: unknown node: ${nodeId}`)); break }

        if (node.status === 'ghost') {
          push(mkLine('error', `connect: ${nodeId} — no route to host`))
          push(mkLine('warn',  '[!] Ghost nodes require a known relay path. Investigate further.'))
          break
        }

        if (node.tier > 0) {
          push(mkLine('error',  `connect: ${node.name} — access requires Tier ${node.tier} breach sequence`))
          push(mkLine('warn',   `[!] Pattern-match breach coming in a future update. Try node r114 to start.`))
          break
        }

        // Tier 0 — unsecured
        push(
          mkLine('info',    `[*] Initiating connection to ${node.name}...`),
          mkLine('info',    '[*] Security check: NONE — node is unsecured.'),
          mkLine('success', '[+] Shell established.'),
          mkLine('output',  `    Remote: ${node.name}`),
          mkLine('output',  `    Type 'ls' to list files, 'exfil <file>' to extract, 'disconnect' to exit.`),
        )

        setHackSession({
          nodeId:     node.id,
          nodeName:   node.name,
          tier:       node.tier,
          files:      node.files,
          exfilled:   [],
          jobId:      node.jobId,
          targetFile: node.targetFile,
        })
        break
      }

      default:
        push(mkLine('error',  `gsh: command not found: ${cmd}`))
        push(mkLine('output', "type 'help' for available commands"))
        break
    }
  }

  function lineColor(type: LineType) {
    switch (type) {
      case 'error':   return C.danger
      case 'info':    return C.muted
      case 'success': return C.success
      case 'warn':    return C.warn
      case 'input':   return C.accent
      default:        return C.text
    }
  }

  return (
    <div
      style={{
        width: '100%', height: '100%',
        background: C.bg, display: 'flex', flexDirection: 'column',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        overflow: 'hidden',
        outline: hackSession ? `1px solid ${C.violet}22` : 'none',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Connection indicator */}
      {hackSession && (
        <div style={{
          padding: '4px 14px', fontSize: 10, letterSpacing: '0.1em',
          background: `${C.violet}18`, borderBottom: `1px solid ${C.violet}44`,
          color: C.violet, display: 'flex', gap: 12, alignItems: 'center',
          flexShrink: 0,
        }}>
          <span>● REMOTE SESSION</span>
          <span style={{ color: C.muted }}>{hackSession.nodeName}</span>
          <span style={{ marginLeft: 'auto', color: C.warn }}>
            type 'disconnect' to exit
          </span>
        </div>
      )}

      {/* Output */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', lineHeight: 1.6 }}>
        {lines.map(l => (
          <div key={l.id} style={{ marginBottom: 1 }}>
            {l.prompt && (
              <span style={{
                color: hackSession ? C.violet : C.success,
                userSelect: 'none',
              }}>
                {l.prompt}
              </span>
            )}
            <span style={{ color: lineColor(l.type), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {l.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderTop: `1px solid ${hackSession ? C.violet + '44' : C.faint}`,
        padding: '6px 14px', gap: 8, flexShrink: 0,
        background: '#0d0d12',
      }}>
        <span style={{
          color: hackSession ? C.violet : C.success,
          whiteSpace: 'nowrap', userSelect: 'none', fontSize: 12,
        }}>
          {prompt()}
        </span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); submit() }
            else handleKey(e)
          }}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: hackSession ? C.violet : C.accent,
            fontFamily: 'inherit', fontSize: 12,
            caretColor: hackSession ? C.violet : C.accent,
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  )
}
