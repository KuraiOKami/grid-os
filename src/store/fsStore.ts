// ── fsStore.ts ────────────────────────────────────────────────────────────
// Virtual file system for GridOS.
// Tree of FSNode objects. Both FileSystem app and Terminal share this store.
// Supports: read, write, mkdir, rm, mv, cp, find.

import { create } from 'zustand'

export type NodeType = 'file' | 'dir'

export interface FSNode {
  name:      string
  type:      NodeType
  content?:  string       // files only
  children?: FSNode[]     // dirs only
  locked?:   boolean      // can't delete/edit without elevated access
  hidden?:   boolean      // not shown in normal ls, visible with ls -a
  meta?: {
    created:  number
    modified: number
    size:     number      // bytes (estimated from content length)
    owner:    string
  }
}

interface FSState {
  root:  FSNode
  cwd:   string[]          // current working directory as path segments

  // navigation
  setCwd:     (path: string[]) => void
  resolvePath: (raw: string) => string[]  // resolve relative or absolute path

  // read
  getNode:   (path: string[]) => FSNode | null
  listDir:   (path: string[], showHidden?: boolean) => FSNode[]
  readFile:  (path: string[]) => string | null

  // write
  writeFile: (path: string[], content: string) => boolean
  mkdir:     (path: string[]) => boolean
  rm:        (path: string[], recursive?: boolean) => boolean
  mv:        (src: string[], dst: string[]) => boolean
  cp:        (src: string[], dst: string[]) => boolean
}

function ts() { return Date.now() }
function meta(owner = 'citizen', content = '') {
  return { created: ts(), modified: ts(), size: content.length, owner }
}

function file(name: string, content: string, opts: Partial<FSNode> = {}): FSNode {
  return { name, type: 'file', content, meta: meta('citizen', content), ...opts }
}
function dir(name: string, children: FSNode[], opts: Partial<FSNode> = {}): FSNode {
  return { name, type: 'dir', children, meta: meta('citizen'), ...opts }
}

// ── Seed file system ────────────────────────────────────────────────────────────
const SEED_ROOT: FSNode = dir('/', [
  dir('home', [
    dir('citizen', [
      dir('documents', [
        file('welcome.txt',
`WELCOME TO GRID-OS v4.7

You are CITIZEN #4471. Your session is logged.
Your compliance score is being monitored.

This terminal gives you direct access to your local filesystem.
Type 'help' for a list of commands.

// If you are reading this, you already know too much.
`),
        file('notes.txt',
`-- personal notes --

todo:
- figure out the sector 7 thing
- check node feed
- don't file the report yet

?? who is vex??
`),
      ]),
      dir('scripts', [
        file('ping.sh',
`#!/bin/sh
# basic connectivity check
echo "pinging NEXUS gateway..."
sleep 1
echo "response: 12ms  [OK]"
`, { meta: meta('citizen', '') }),
        file('README.md',
`# scripts/

Put your automation scripts here.
All .sh files are executable by the terminal.
.enc files are encrypted — you need a key to read them.
`),
      ]),
      dir('downloads', []),
      file('.bash_history',
`ls
cd documents
cat welcome.txt
cd ..
pwd
`, { hidden: true }),
      file('.profile',
`# GridOS citizen profile
export USER=citizen4471
export SHELL=/bin/gsh
export PATH=/bin:/usr/bin:/home/citizen/scripts
alias cls="clear"
alias ll="ls -la"
`, { hidden: true }),
    ]),
  ]),
  dir('bin', [
    file('gsh',    '// GridOS shell binary', { locked: true }),
    file('ls',     '// list directory',       { locked: true }),
    file('cat',    '// print file contents',  { locked: true }),
    file('echo',   '// print string',         { locked: true }),
  ], { locked: true }),
  dir('etc', [
    file('motd',
`NEXUS AUTHORITY — GRID-OS v4.7
All activity on this system is monitored and logged.
Unauthorized access will be reported to NEXUS Enforcement.
Compliance window: 71:44:02 remaining.
`, { locked: true }),
    file('hosts',
`127.0.0.1       localhost
10.0.0.1        nexus-gateway.grid
10.0.0.2        node.grid
10.0.0.99       [REDACTED]
`, { locked: true }),
    dir('grid', [
      file('citizen.conf',
`[citizen]
id          = 4471
clearance   = standard
sector      = 7
flagged     = false
report_due  = true
`, { locked: true }),
    ], { locked: true }),
  ], { locked: true }),
  dir('tmp', [], { hidden: false }),
  dir('sys', [
    file('version',   'GRID-OS 4.7.1-stable', { locked: true }),
    file('uptime',    '// dynamic',            { locked: true }),
    file('processes', '// dynamic',            { locked: true }),
  ], { locked: true, hidden: true }),
  dir('vault', [
    file('CONTRACT_7741.enc',
`-- ENCRYPTED --
This file requires key: [REDACTED]
Do not attempt brute-force decryption.
Violations logged.
`, { locked: true }),
    file('README',
`This directory is write-protected.
Contents are faction-encrypted.
Ask the right people for the right keys.
`, { locked: true }),
  ], { locked: true, hidden: true }),
])

// ── Path helpers ────────────────────────────────────────────────────────────
function cloneTree(node: FSNode): FSNode {
  return {
    ...node,
    children: node.children?.map(cloneTree),
    meta: node.meta ? { ...node.meta } : undefined,
  }
}

function getNodeAt(root: FSNode, path: string[]): FSNode | null {
  if (path.length === 0) return root
  const [head, ...rest] = path
  const child = root.children?.find(c => c.name === head)
  if (!child) return null
  return getNodeAt(child, rest)
}

function setNodeAt(root: FSNode, path: string[], newNode: FSNode | null): FSNode {
  if (path.length === 0) return newNode ?? root
  const [head, ...rest] = path
  const children = (root.children ?? []).map(c => {
    if (c.name !== head) return c
    if (rest.length === 0) return newNode   // replace or delete
    return setNodeAt(c, rest, newNode)
  }).filter(Boolean) as FSNode[]
  // insert if not found and newNode is new leaf
  if (!root.children?.find(c => c.name === head) && path.length === 1 && newNode) {
    children.push(newNode)
  }
  return { ...root, children }
}

function normalizePath(segments: string[]): string[] {
  const out: string[] = []
  for (const seg of segments) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') { out.pop(); continue }
    out.push(seg)
  }
  return out
}

export const useFSStore = create<FSState>((set, get) => ({
  root: cloneTree(SEED_ROOT),
  cwd:  ['home', 'citizen'],

  setCwd: (path) => set({ cwd: normalizePath(path) }),

  resolvePath: (raw) => {
    if (raw.startsWith('/')) return normalizePath(raw.split('/').filter(Boolean))
    return normalizePath([...get().cwd, ...raw.split('/')])
  },

  getNode: (path) => getNodeAt(get().root, path),

  listDir: (path, showHidden = false) => {
    const node = getNodeAt(get().root, path)
    if (!node || node.type !== 'dir') return []
    return (node.children ?? []).filter(c => showHidden || !c.hidden)
  },

  readFile: (path) => {
    const node = getNodeAt(get().root, path)
    if (!node || node.type !== 'file') return null
    return node.content ?? ''
  },

  writeFile: (path, content) => {
    if (path.length === 0) return false
    const parentPath = path.slice(0, -1)
    const name = path[path.length - 1]
    const parent = getNodeAt(get().root, parentPath)
    if (!parent || parent.type !== 'dir' || parent.locked) return false
    const existing = parent.children?.find(c => c.name === name)
    if (existing?.locked) return false
    const newFile: FSNode = {
      name, type: 'file', content,
      meta: { created: existing?.meta?.created ?? ts(), modified: ts(), size: content.length, owner: 'citizen' },
    }
    set(s => ({ root: setNodeAt(cloneTree(s.root), path, newFile) }))
    return true
  },

  mkdir: (path) => {
    if (path.length === 0) return false
    const parentPath = path.slice(0, -1)
    const name = path[path.length - 1]
    const parent = getNodeAt(get().root, parentPath)
    if (!parent || parent.type !== 'dir' || parent.locked) return false
    if (parent.children?.find(c => c.name === name)) return false
    const newDir: FSNode = { name, type: 'dir', children: [], meta: meta('citizen') }
    set(s => ({ root: setNodeAt(cloneTree(s.root), path, newDir) }))
    return true
  },

  rm: (path, recursive = false) => {
    if (path.length === 0) return false
    const node = getNodeAt(get().root, path)
    if (!node || node.locked) return false
    if (node.type === 'dir' && (node.children?.length ?? 0) > 0 && !recursive) return false
    set(s => ({ root: setNodeAt(cloneTree(s.root), path, null) }))
    return true
  },

  mv: (src, dst) => {
    const { root } = get()
    const srcNode = getNodeAt(root, src)
    if (!srcNode || srcNode.locked) return false
    const dstParentPath = dst.slice(0, -1)
    const dstParent = getNodeAt(root, dstParentPath)
    if (!dstParent || dstParent.type !== 'dir' || dstParent.locked) return false
    const moved = { ...cloneTree(srcNode), name: dst[dst.length - 1] }
    let newRoot = setNodeAt(cloneTree(root), src, null)
    newRoot = setNodeAt(newRoot, dst, moved)
    set({ root: newRoot })
    return true
  },

  cp: (src, dst) => {
    const { root } = get()
    const srcNode = getNodeAt(root, src)
    if (!srcNode) return false
    const dstParentPath = dst.slice(0, -1)
    const dstParent = getNodeAt(root, dstParentPath)
    if (!dstParent || dstParent.type !== 'dir' || dstParent.locked) return false
    const copied = { ...cloneTree(srcNode), name: dst[dst.length - 1] }
    set(s => ({ root: setNodeAt(cloneTree(s.root), dst, copied) }))
    return true
  },
}))

// ── Utility: path segments → display string
export function pathStr(segments: string[]) {
  return '/' + segments.join('/')
}
