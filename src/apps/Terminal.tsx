// ── Terminal.tsx ────────────────────────────────────────────────────────────
// GridOS terminal emulator. Shares fsStore with the FileSystem app.
// Commands: help, ls, cd, cat, pwd, mkdir, rm, cp, mv, touch, echo,
//           clear, whoami, uptime, ps, find, grep, history, exec

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useFSStore, pathStr, FSNode } from '@/store/fsStore'
import { useRepStore } from '@/store/reputationStore'

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

type LineType = 'input' | 'output' | 'error' | 'info' | 'success'

interface Line {
  id:    number
  type:  LineType
  text:  string
  prompt?: string   // shown before text for input lines
}

let _lid = 0
function line(type: LineType, text: string, prompt?: string): Line {
  return { id: _lid++, type, text, prompt }
}

const BOOT_LINES: Line[] = [
  line('info',    'GRID-OS v4.7.1 ─ GridShell (gsh)'),
  line('info',    'Type \'help\' for available commands.'),
  line('info',    '──────────────────────────────'),
]

const HELP_TEXT = `
commands:
  ls [-a]           list directory contents
  cd <path>         change directory  (cd .. goes up)
  pwd               print current path
  cat <file>        print file contents
  touch <file>      create empty file
  mkdir <dir>       create directory
  rm [-r] <path>    remove file or directory
  cp <src> <dst>    copy file
  mv <src> <dst>    move / rename
  find <name>       search for file by name
  grep <str> <file> search for string in file
  echo <text>       print text
  whoami            show citizen info
  uptime            show session uptime
  ps                show running processes
  history           show command history
  clear             clear terminal
  exec <script>     run a .sh script
`.trim()

const FAKE_PROCESSES = [
  { pid: 1,    name: 'init',          cpu: '0.0%', mem: '0.1%' },
  { pid: 44,   name: 'gsh',           cpu: '0.1%', mem: '0.4%' },
  { pid: 120,  name: 'nexus-monitor', cpu: '2.1%', mem: '1.2%' },
  { pid: 203,  name: 'mail-daemon',   cpu: '0.0%', mem: '0.3%' },
  { pid: 441,  name: 'node-sync',     cpu: '0.4%', mem: '0.8%' },
  { pid: 888,  name: '[REDACTED]',    cpu: '??.?%',mem: '??.?%' },
]

const START_TIME = Date.now()

export default function Terminal() {
  const [lines,   setLines]   = useState<Line[]>(BOOT_LINES)
  const [input,   setInput]   = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const fs          = useFSStore()
  const compliance  = useRepStore(s => s.compliance)

  const prompt = () => `citizen@grid:${pathStr(fs.cwd)}$`

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  function push(...newLines: Line[]) {
    setLines(prev => [...prev, ...newLines])
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(idx)
      setInput(history[idx] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(histIdx - 1, -1)
      setHistIdx(idx)
      setInput(idx === -1 ? '' : history[idx])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      autocomplete()
    }
  }

  function autocomplete() {
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
    push(line('input', raw, prompt()))
    setHistory(prev => [raw, ...prev])
    setHistIdx(-1)
    setInput('')
    runCommand(raw)
  }

  function runCommand(raw: string) {
    const [cmd, ...args] = raw.split(/\s+/)

    switch (cmd) {

      case 'help':
        push(line('output', HELP_TEXT))
        break

      case 'clear':
        setLines([])
        break

      case 'pwd':
        push(line('output', pathStr(fs.cwd) || '/'))
        break

      case 'whoami':
        push(line('output',
`citizen4471
clearance  : standard
sector     : 7
grid rep   : ${compliance}
flagged    : false
shell      : /bin/gsh`))
        break

      case 'uptime': {
        const ms  = Date.now() - START_TIME
        const sec = Math.floor(ms / 1000)
        const min = Math.floor(sec / 60)
        const hr  = Math.floor(min / 60)
        push(line('output', `session uptime: ${hr}h ${min % 60}m ${sec % 60}s`))
        break
      }

      case 'ps':
        push(line('output',
          'PID    NAME                CPU     MEM\n' +
          '────────────────────────────────────────
' +
          FAKE_PROCESSES.map(p =>
            `${String(p.pid).padEnd(6)} ${p.name.padEnd(20)}${p.cpu.padEnd(8)}${p.mem}`
          ).join('\n')
        ))
        break

      case 'ls': {
        const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al')
        const targetArg  = args.find(a => !a.startsWith('-'))
        const targetPath = targetArg ? fs.resolvePath(targetArg) : fs.cwd
        const entries    = fs.listDir(targetPath, showHidden)
        if (entries.length === 0) {
          push(line('output', '(empty)'))
        } else {
          const out = entries.map(e => {
            const name = e.type === 'dir' ? e.name + '/' : e.name
            const size = e.type === 'file' ? `${e.meta?.size ?? 0}B`.padStart(8) : '      --'
            const lock = e.locked ? ' [L]' : ''
            return `${size}  ${name}${lock}`
          }).join('\n')
          push(line('output', out))
        }
        break
      }

      case 'cd': {
        const target = args[0]
        if (!target || target === '~') {
          fs.setCwd(['home', 'citizen'])
          break
        }
        const newPath = fs.resolvePath(target)
        const node = fs.getNode(newPath)
        if (!node)            { push(line('error', `cd: no such directory: ${target}`)); break }
        if (node.type !== 'dir') { push(line('error', `cd: not a directory: ${target}`)); break }
        fs.setCwd(newPath)
        break
      }

      case 'cat': {
        if (!args[0]) { push(line('error', 'usage: cat <file>')); break }
        const path = fs.resolvePath(args[0])
        const node = fs.getNode(path)
        if (!node)                 { push(line('error', `cat: no such file: ${args[0]}`)); break }
        if (node.type === 'dir')   { push(line('error', `cat: ${args[0]}: is a directory`)); break }
        const content = fs.readFile(path) ?? ''
        push(line('output', content || '(empty file)'))
        break
      }

      case 'touch': {
        if (!args[0]) { push(line('error', 'usage: touch <file>')); break }
        const path = fs.resolvePath(args[0])
        const ok = fs.writeFile(path, '')
        if (!ok) push(line('error', `touch: cannot create: ${args[0]}`))
        break
      }

      case 'mkdir': {
        if (!args[0]) { push(line('error', 'usage: mkdir <dir>')); break }
        const path = fs.resolvePath(args[0])
        const ok = fs.mkdir(path)
        if (!ok) push(line('error', `mkdir: cannot create directory: ${args[0]}`))
        break
      }

      case 'rm': {
        const recursive = args.includes('-r') || args.includes('-rf')
        const target    = args.find(a => !a.startsWith('-'))
        if (!target) { push(line('error', 'usage: rm [-r] <path>')); break }
        const path = fs.resolvePath(target)
        const node = fs.getNode(path)
        if (!node) { push(line('error', `rm: no such file: ${target}`)); break }
        if (node.locked) { push(line('error', `rm: permission denied: ${target}`)); break }
        const ok = fs.rm(path, recursive)
        if (!ok) push(line('error', `rm: ${target}: directory not empty (use -r)`))
        break
      }

      case 'cp': {
        if (args.length < 2) { push(line('error', 'usage: cp <src> <dst>')); break }
        const src = fs.resolvePath(args[0])
        const dst = fs.resolvePath(args[1])
        const ok  = fs.cp(src, dst)
        if (!ok) push(line('error', `cp: failed to copy ${args[0]} to ${args[1]}`))
        break
      }

      case 'mv': {
        if (args.length < 2) { push(line('error', 'usage: mv <src> <dst>')); break }
        const src = fs.resolvePath(args[0])
        const dst = fs.resolvePath(args[1])
        const ok  = fs.mv(src, dst)
        if (!ok) push(line('error', `mv: failed to move ${args[0]} to ${args[1]}`))
        break
      }

      case 'echo':
        push(line('output', args.join(' ')))
        break

      case 'find': {
        if (!args[0]) { push(line('error', 'usage: find <name>')); break }
        const query = args[0].toLowerCase()
        const results: string[] = []
        function walk(node: FSNode, path: string[]) {
          if (node.name.toLowerCase().includes(query)) results.push(pathStr(path))
          node.children?.forEach(c => walk(c, [...path, c.name]))
        }
        walk(useFSStore.getState().root, [])
        push(line('output', results.length ? results.join('\n') : `find: no results for "${args[0]}"`))
        break
      }

      case 'grep': {
        if (args.length < 2) { push(line('error', 'usage: grep <string> <file>')); break }
        const query = args[0].toLowerCase()
        const path  = fs.resolvePath(args[1])
        const content = fs.readFile(path)
        if (content === null) { push(line('error', `grep: ${args[1]}: no such file`)); break }
        const matches = content.split('\n')
          .map((l, i) => ({ l, i }))
          .filter(({ l }) => l.toLowerCase().includes(query))
          .map(({ l, i }) => `${String(i + 1).padStart(4)}: ${l}`)
        push(line('output', matches.length ? matches.join('\n') : `grep: no matches for "${args[0]}"`))
        break
      }

      case 'history':
        push(line('output',
          history.length === 0
            ? '(no history)'
            : history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n')
        ))
        break

      case 'exec': {
        if (!args[0]) { push(line('error', 'usage: exec <script.sh>')); break }
        const path    = fs.resolvePath(args[0])
        const content = fs.readFile(path)
        if (content === null) { push(line('error', `exec: ${args[0]}: not found`)); break }
        if (!args[0].endsWith('.sh')) { push(line('error', `exec: ${args[0]}: not executable`)); break }
        // simulate execution: echo each non-comment line
        const scriptLines = content.split('\n').filter(l => !l.startsWith('#') && l.trim())
        push(line('info', `[exec] running ${args[0]}...`))
        scriptLines.forEach(sl => {
          if (sl.startsWith('echo ')) push(line('output', sl.slice(5)))
          else push(line('output', `> ${sl}`))
        })
        push(line('success', `[exec] done`))
        break
      }

      default:
        push(line('error', `gsh: command not found: ${cmd}`))
        push(line('output', "type 'help' for available commands"))
    }
  }

  function lineColor(type: LineType) {
    switch (type) {
      case 'error':   return C.danger
      case 'info':    return C.muted
      case 'success': return C.success
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
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', lineHeight: 1.6 }}>
        {lines.map(l => (
          <div key={l.id} style={{ marginBottom: 1 }}>
            {l.prompt && (
              <span style={{ color: C.success, userSelect: 'none' }}>{l.prompt} </span>
            )}
            <span style={{
              color: lineColor(l.type),
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {l.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderTop: `1px solid ${C.faint}`,
        padding: '6px 14px', gap: 8, flexShrink: 0,
        background: '#0d0d12',
      }}>
        <span style={{ color: C.success, whiteSpace: 'nowrap', userSelect: 'none', fontSize: 12 }}>
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
            color: C.accent, fontFamily: 'inherit', fontSize: 12,
            caretColor: C.accent,
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
