// ── Terminal.tsx ─────────────────────────────────────────────────────────────
// GridOS terminal emulator. Shares fsStore with the FileSystem app.
// Local commands: help, ls, cd, cat, pwd, mkdir, rm, cp, mv, touch, echo,
//                 clear, whoami, uptime, ps, find, grep, history, exec,
//                 scan, connect
// Hack session commands (when connected to a remote node):
//                 ls, cat, exfil, disconnect, clear
// OPS session commands (when ops <target> is running):
//                 scan, probe [--module <name>], status, modules, exit

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useFSStore, pathStr, FSNode } from '@/store/fsStore'
import { useRepStore } from '@/store/reputationStore'
import { useWalletStore } from '@/store/walletStore'
import { useCareerStore } from '@/store/careerStore'
import { HACK_NODES, HackFile } from '@/data/hackNodes'
import { completeJob, acceptJob, getJob } from '@/store/jobStore'
import { useMapStore } from '@/store/mapStore'
import { getLocation } from '@/data/locations'
import { useOpsStore, getOpsNode } from '@/store/opsStore'
import { checkTriggers } from '@/store/triggerEngine'

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
  ops:     '#39ff14',   // OPS mode — neon green
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

interface OpsSession {
  target: string
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
  '',
  'intelligence:',
  '  ops <target>      launch OPS recon suite against a target',
].join('\n')

const HELP_HACK = [
  'remote shell commands:',
  '  ls                list files on node',
  '  cat <file>        read file contents',
  '  exfil <file>      extract file to local system',
  '  disconnect        close connection and return to local shell',
  '  clear             clear terminal',
].join('\n')

const HELP_OPS = [
  'OPS // Operational Penetration Suite',
  '─────────────────────────────────────',
  '  scan              run passive recon on target',
  '  probe             run active probe (prompts for module)',
  '  probe --module <name>',
  '                    run specific probe module directly',
  '  modules           list available probe modules for target',
  '  status            show current session status',
  '  exit              terminate OPS session',
  '',
  'workflow:',
  '  1. scan           → gather passive intel',
  '  2. probe          → extract deeper data',
  '  3. exit           → return to local shell',
  '  4. (use Terminal for exfil / connect operations)',
].join('\n')

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
  const [opsSession,  setOpsSession]  = useState<OpsSession | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  const fs         = useFSStore()
  const compliance = useRepStore(s => s.compliance)

  const sessionRef = useRef<HackSession | null>(null)
  sessionRef.current = hackSession

  const prompt = () => {
    if (hackSession) return `${hackSession.nodeId}$ `
    if (opsSession)  return `[OPS:${opsSession.target}]$ `
    return `citizen@grid:${pathStr(fs.cwd)}$ `
  }

  // Pick up target handed off from OPS panel
  useEffect(() => {
    const pending = useOpsStore.getState().pendingTarget
    if (pending) {
      useOpsStore.getState().setPendingTarget(null)
      setOpsSession({ target: pending })
      setLines(prev => [...prev,
        mkLine('info',    `[OPS] Session received — target: ${pending}`),
        mkLine('info',     '[OPS] Scan intel loaded. Run \'status\' to review.'),
        mkLine('info',     '[OPS] Run \'modules\' to see available probes. \'exit\' to return to local shell.'),
      ])
    }
  }, [])

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
    if (hackSession || opsSession) return
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
    } else if (opsSession) {
      runOpsCommand(raw, opsSession)
    } else {
      runLocalCommand(raw)
    }
  }

  // ── OPS session commands ──────────────────────────────────────────────────

  function runOpsCommand(raw: string, session: OpsSession) {
    // Parse flags like --module
    const parts  = raw.split(/\s+/)
    const cmd    = parts[0]
    const modIdx = parts.indexOf('--module')
    const modArg = modIdx !== -1 ? parts[modIdx + 1] : null
    const arg    = parts[1] && !parts[1].startsWith('--') ? parts[1] : null

    const ops     = useOpsStore.getState()
    const nodeData = getOpsNode(session.target)

    switch (cmd) {

      case 'help':
        push(mkLine('output', HELP_OPS))
        break

      case 'clear':
        setLines([])
        break

      case 'status': {
        const sr = ops.scanResult
        if (!sr) {
          push(mkLine('warn', '[OPS] No scan data yet. Run `scan` first.'))
          break
        }
        push(mkLine('output', [
          `TARGET       : ${sr.target}`,
          `PHASE        : ${ops.phase.toUpperCase()}`,
          `RESOLVED IP  : ${sr.resolvedIP}`,
          `NODE OWNER   : ${sr.nodeOwner}`,
          `FIREWALL     : ${sr.firewallGrade}`,
          `COMPLIANCE   : ${sr.compliance}`,
          `GHOST TRAFFIC: ${sr.ghostTraffic}%`,
          `PROBES RUN   : ${ops.probeResults.length}`,
        ].join('\n')))
        break
      }

      case 'modules': {
        if (!nodeData) {
          push(mkLine('error', `[OPS] No probe modules found for target: ${session.target}`))
          break
        }
        const mods = Object.keys(nodeData.probeModules)
        push(mkLine('output', [
          `Available probe modules for ${session.target}:`,
          ...mods.map(m => `  probe --module ${m}`),
        ].join('\n')))
        break
      }

      case 'scan': {
        if (!nodeData) {
          push(
            mkLine('warn',   `[OPS] ${session.target} — no node data on record.`),
            mkLine('output', '[OPS] Running generic fingerprint...'),
          )
          setTimeout(() => {
            const fallback = {
              target:        session.target,
              resolvedIP:    'UNRESOLVABLE',
              nodeOwner:     'UNKNOWN',
              firewallGrade: 'N/A',
              openPorts:     'UNKNOWN',
              compliance:    'NO DATA',
              ghostTraffic:  0,
              lastPing:      'TIMEOUT',
              behaviorFlags: [],
            }
            ops.setScan(fallback)
            push(
              mkLine('warn',  '[OPS] SCAN COMPLETE — no Grid record for this target.'),
              mkLine('info',  '[OPS] Browser panel updated.'),
            )
          }, 1200)
          break
        }

        push(
          mkLine('info',   `[OPS] Initiating passive scan on ${session.target}...`),
          mkLine('info',    '[OPS] Routing through anonymised relay...'),
        )
        ops.setPhase('scanning')

        setTimeout(() => {
          push(mkLine('info', '[OPS] Probing routing tables...'))
          setTimeout(() => {
            const result = {
              target:        nodeData.target,
              resolvedIP:    nodeData.resolvedIP,
              nodeOwner:     nodeData.nodeOwner,
              firewallGrade: nodeData.firewallGrade,
              openPorts:     nodeData.openPorts,
              compliance:    nodeData.compliance,
              ghostTraffic:  nodeData.ghostTraffic,
              lastPing:      nodeData.lastPing,
              behaviorFlags: nodeData.behaviorFlags,
            }
            ops.setScan(result)

            push(
              mkLine('success', '[OPS] SCAN COMPLETE'),
              mkLine('output',  `  RESOLVED IP   : ${result.resolvedIP}`),
              mkLine('output',  `  NODE OWNER    : ${result.nodeOwner}`),
              mkLine('output',  `  FIREWALL      : ${result.firewallGrade}`),
              mkLine('output',  `  OPEN PORTS    : ${result.openPorts}`),
              mkLine('output',  `  COMPLIANCE    : ${result.compliance}`),
              mkLine('output',  `  GHOST TRAFFIC : ${result.ghostTraffic}%`),
              mkLine('output',  `  LAST PING     : ${result.lastPing}`),
              ...result.behaviorFlags.map(f => mkLine('warn', `  FLAG          : ${f}`)),
              mkLine('info',   '[OPS] Browser panel updated. Run `modules` for available probes.'),
            )
          }, 900)
        }, 600)
        break
      }

      case 'probe': {
        if (!nodeData) {
          push(mkLine('error', `[OPS] No probe data for target: ${session.target}`))
          break
        }

        const availMods = Object.keys(nodeData.probeModules)

        // If no module specified, list them and prompt
        if (!modArg) {
          push(
            mkLine('warn',   '[OPS] Specify a probe module with --module <name>'),
            mkLine('output', `  Available: ${availMods.join(', ')}`),
            mkLine('info',   `  Example:   probe --module ${availMods[0] ?? 'whois'}`),
          )
          break
        }

        const modData = nodeData.probeModules[modArg]
        if (!modData) {
          push(mkLine('error', `[OPS] Unknown module: ${modArg}`))
          push(mkLine('info',  `  Available: ${availMods.join(', ')}`))
          break
        }

        push(
          mkLine('info',  `[OPS] Probing ${session.target} — module: ${modArg}`),
          mkLine('info',  '[OPS] Routing through relay... standing by...'),
        )
        ops.setPhase('probing')

        setTimeout(() => {
          ops.addProbe({ module: modArg, output: modData, ts: Date.now() })
          push(
            mkLine('success', `[OPS] PROBE COMPLETE — ${modArg.toUpperCase()}`),
            ...modData.map(line => mkLine('output', `  ${line}`)),
            mkLine('info',    '[OPS] Browser panel updated.'),
          )
          useCareerStore.getState().addXP('hacker', 2)
          useRepStore.getState().applyEvent({ shadow: 1, compliance: -1 })
        }, 800)
        break
      }

      case 'exit': {
        push(
          mkLine('info',    `[OPS] Closing session against ${session.target}...`),
          mkLine('success', '[OPS] Session terminated. Intel preserved in browser panel.'),
        )
        setOpsSession(null)
        // Don't clear opsStore — browser panel keeps the last scan visible
        break
      }

      default:
        push(mkLine('error', `${cmd}: not a valid OPS command`))
        push(mkLine('info',  "  Type 'help' for OPS commands, 'exit' to quit OPS."))
        break
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
              setHackSession(prev => prev
                ? { ...prev, exfilled: [...prev.exfilled, filename] }
                : prev
              )

              const fs = useFSStore.getState()
              fs.mkdir(['home', 'citizen', 'loot'])
              fs.writeFile(['home', 'citizen', 'loot', filename], file.content)
              useCareerStore.getState().addXP('hacker', 5)

              push(mkLine('success', `[+] ${filename} received (${file.size})`))
              push(mkLine('output',  `    saved → ~/loot/${filename}`))

              if (isTarget) {
                const job = getJob(session.jobId!)
                if (job && !job.accepted) acceptJob(job.id)
                completeJob(session.jobId!)
                checkTriggers({ type: 'job_complete', jobId: session.jobId! })
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

      // ── OPS launcher ───────────────────────────────────────────────────────

      case 'ops': {
        const target = args[0]
        if (!target) {
          push(mkLine('error', 'usage: ops <target>'))
          push(mkLine('info',  '  example: ops gridos.corp'))
          push(mkLine('info',  '  example: ops ghostlily.blog'))
          break
        }

        const ops = useOpsStore.getState()
        ops.startSession(target)
        setOpsSession({ target })

        push(
          mkLine('info',    ''),
          mkLine('info',    '  ██████╗ ██████╗ ███████╗'),
          mkLine('info',    '  ██╔══██╗██╔══██╗██╔════╝'),
          mkLine('info',    '  ██║  ██║██████╔╝███████╗'),
          mkLine('info',    '  ██║  ██║██╔═══╝ ╚════██║'),
          mkLine('info',    '  ██████╔╝██║     ███████║'),
          mkLine('info',    '  ╚═════╝ ╚═╝     ╚══════╝'),
          mkLine('info',    ''),
          mkLine('success', `  OPS v0.9.1 — TARGET: ${target}`),
          mkLine('warn',    '  // unregistered node // activity unlogged'),
          mkLine('info',    ''),
          mkLine('output',  "  Type 'scan' to run passive recon."),
          mkLine('output',  "  Type 'help' for all commands."),
          mkLine('output',  "  Type 'exit' to close OPS session."),
          mkLine('info',    '  [OPS panel in browser is now live — open it to see results]'),
          mkLine('info',    ''),
        )
        break
      }

      // ── Hacking ────────────────────────────────────────────────────────────

      case 'scan': {
        const locId   = useMapStore.getState().currentLocationId
        const loc     = getLocation(locId)

        push(mkLine('info', '[*] Scanning local network environment...'))
        push(mkLine('info', `[*] Location: ${loc?.name ?? locId} (${loc?.district ?? ''})`))

        if (!loc || loc.signals.length === 0) {
          push(mkLine('output', '[*] No scannable networks detected at this location.'))
          break
        }

        const hackable = loc.signals.filter(s => s.type === 'wifi' || s.type === 'device')
        if (hackable.length === 0) {
          push(mkLine('output', '[*] No hackable networks at this location. (Phones/BT visible in City Map)'))
          break
        }

        const header  = 'NAME                       TYPE    TIER  STATUS'
        const divider = '─────────────────────────  ──────  ────  ──────────────────────────'
        const rows = hackable.map(sig => {
          const tier   = `[${sig.tier}]`
          let status: string
          if (sig.secured)          status = 'FIREWALLED'
          else if (sig.hackNodeId)  status = `OPEN  → connect ${sig.hackNodeId}`
          else                      status = 'OPEN  (sniff via City Map)'
          return `${sig.name.padEnd(25)}  ${sig.type.toUpperCase().padEnd(6)}  ${tier.padEnd(4)}  ${status}`
        })

        push(mkLine('output', [header, divider, ...rows].join('\n')))

        const open = hackable.filter(s => !s.secured && s.hackNodeId)
        open.forEach(s => {
          push(mkLine('info', `[!] ${s.name} is accessible — use 'connect ${s.hackNodeId}'`))
        })
        const sniffOnly = hackable.filter(s => !s.secured && !s.hackNodeId)
        sniffOnly.forEach(s => {
          push(mkLine('output', `    ${s.name} — open network, sniff via City Map`))
        })
        const locked = hackable.filter(s => s.secured)
        locked.forEach(s => {
          push(mkLine('warn', `[!] ${s.name} — Tier ${s.tier} breach required`))
        })
        break
      }

      case 'connect': {
        const nodeId = args[0]
        if (!nodeId) { push(mkLine('error', 'usage: connect <node-id>')); break }

        const node = HACK_NODES.find(n => n.id === nodeId)
        if (!node) { push(mkLine('error', `connect: unknown node identifier: ${nodeId}`)); break }

        const locId = useMapStore.getState().currentLocationId
        const loc   = getLocation(locId)
        const reachable = loc?.signals.some(s => s.hackNodeId === nodeId) ?? false
        if (!reachable) {
          push(mkLine('error',  `connect: ${node.name} is not reachable from ${loc?.name ?? locId}`))
          push(mkLine('warn',   `[!] Travel to the node's physical location first. Check City Map.`))
          break
        }

        if (node.status === 'ghost') {
          push(mkLine('error', `connect: ${nodeId} — no route to host`))
          push(mkLine('warn',  '[!] Ghost nodes require a known relay path. Investigate further.'))
          break
        }

        if (node.tier > 0) {
          push(mkLine('error', `connect: ${node.name} — Tier ${node.tier} breach sequence required`))
          push(mkLine('warn',  '[!] Pattern-match breach system coming soon. Tier 0 nodes only for now.'))
          break
        }

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
      case 'input':   return opsSession ? C.ops : C.accent
      default:        return C.text
    }
  }

  const isOps  = !!opsSession
  const isHack = !!hackSession

  return (
    <div
      style={{
        width: '100%', height: '100%',
        background: C.bg, display: 'flex', flexDirection: 'column',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        overflow: 'hidden',
        outline: isHack ? `1px solid ${C.violet}22` : isOps ? `1px solid ${C.ops}18` : 'none',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hack session indicator */}
      {isHack && (
        <div style={{
          padding: '4px 14px', fontSize: 10, letterSpacing: '0.1em',
          background: `${C.violet}18`, borderBottom: `1px solid ${C.violet}44`,
          color: C.violet, display: 'flex', gap: 12, alignItems: 'center',
          flexShrink: 0,
        }}>
          <span>● REMOTE SESSION</span>
          <span style={{ color: C.muted }}>{hackSession!.nodeName}</span>
          <span style={{ marginLeft: 'auto', color: C.warn }}>type 'disconnect' to exit</span>
        </div>
      )}

      {/* OPS session indicator */}
      {isOps && (
        <div style={{
          padding: '4px 14px', fontSize: 10, letterSpacing: '0.1em',
          background: `${C.ops}10`, borderBottom: `1px solid ${C.ops}33`,
          color: C.ops, display: 'flex', gap: 12, alignItems: 'center',
          flexShrink: 0,
        }}>
          <span>◈ OPS SESSION</span>
          <span style={{ color: C.muted }}>TARGET: {opsSession!.target}</span>
          <span style={{ marginLeft: 'auto', color: C.muted }}>scan · probe · modules · exit</span>
        </div>
      )}

      {/* Output */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', lineHeight: 1.6 }}>
        {lines.map(l => (
          <div key={l.id} style={{ marginBottom: 1 }}>
            {l.prompt && (
              <span style={{
                color: isHack ? C.violet : isOps ? C.ops : C.success,
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
        borderTop: `1px solid ${
          isHack ? C.violet + '44' : isOps ? C.ops + '33' : C.faint
        }`,
        padding: '6px 14px', gap: 8, flexShrink: 0,
        background: '#0d0d12',
      }}>
        <span style={{
          color: isHack ? C.violet : isOps ? C.ops : C.success,
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
            color: isHack ? C.violet : isOps ? C.ops : C.accent,
            fontFamily: 'inherit', fontSize: 12,
            caretColor: isHack ? C.violet : isOps ? C.ops : C.accent,
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
