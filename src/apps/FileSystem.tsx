// ── FileSystem.tsx ────────────────────────────────────────────────────────────
// Graphical file manager. Two-pane: directory tree (left) + content (right).
// Shows file contents in a viewer. Supports new file, new folder, rename, delete.

import { useState } from 'react'
import { useFSStore, FSNode, pathStr } from '@/store/fsStore'

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
}

type Selection = { path: string[]; node: FSNode } | null

export default function FileSystem() {
  const cwd          = useFSStore(s => s.cwd)
  const setCwd       = useFSStore(s => s.setCwd)
  const listDir      = useFSStore(s => s.listDir)
  const readFile     = useFSStore(s => s.readFile)
  const mkdir        = useFSStore(s => s.mkdir)
  const writeFile    = useFSStore(s => s.writeFile)
  const rm           = useFSStore(s => s.rm)
  const resolvePath  = useFSStore(s => s.resolvePath)
  const getNode      = useFSStore(s => s.getNode)

  const [selected,   setSelected]   = useState<Selection>(null)
  const [showHidden, setShowHidden]  = useState(false)
  const [editing,    setEditing]     = useState(false)
  const [editBody,   setEditBody]    = useState('')
  const [newName,    setNewName]     = useState('')
  const [creating,   setCreating]    = useState<'file' | 'dir' | null>(null)
  const [error,      setError]       = useState('')

  const cwdStr  = pathStr(cwd)
  const entries = listDir(cwd, showHidden)

  function navigate(node: FSNode, path: string[]) {
    if (node.type === 'dir') {
      setCwd(path)
      setSelected(null)
      setEditing(false)
      setError('')
    } else {
      setSelected({ path, node })
      setEditing(false)
      setError('')
    }
  }

  function goUp() {
    if (cwd.length === 0) return
    setCwd(cwd.slice(0, -1))
    setSelected(null)
    setEditing(false)
  }

  function startEdit() {
    if (!selected || selected.node.type !== 'file') return
    setEditBody(selected.node.content ?? '')
    setEditing(true)
    setError('')
  }

  function saveEdit() {
    if (!selected) return
    const ok = writeFile(selected.path, editBody)
    if (!ok) { setError('Write failed — file may be locked.'); return }
    setEditing(false)
    // refresh selected
    const updated = getNode(selected.path)
    if (updated) setSelected({ ...selected, node: updated })
  }

  function deleteSelected() {
    if (!selected) return
    if (selected.node.locked) { setError('Cannot delete locked file.'); return }
    rm(selected.path, true)
    setSelected(null)
    setEditing(false)
  }

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const path = [...cwd, name]
    let ok = false
    if (creating === 'dir')  ok = mkdir(path)
    if (creating === 'file') ok = writeFile(path, '')
    if (!ok) setError(`Could not create — name may conflict or directory is locked.`)
    setCreating(null)
    setNewName('')
  }

  const fileContent = selected?.node.type === 'file'
    ? (readFile(selected.path) ?? '')
    : null

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12, color: C.text, overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        height: 38, display: 'flex', alignItems: 'center',
        padding: '0 10px', gap: 8,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <button onClick={goUp} disabled={cwd.length === 0} style={toolBtn(cwd.length > 0)}>[ ↑ UP ]</button>
        <span style={{ color: C.accent, fontSize: 11, flex: 1 }}>{cwdStr || '/'}</span>
        <button onClick={() => setShowHidden(v => !v)} style={toolBtn(true, showHidden)}>
          {showHidden ? 'hide .hidden' : 'show .hidden'}
        </button>
        <button onClick={() => { setCreating('dir');  setNewName('') }} style={toolBtn(true)}>+ folder</button>
        <button onClick={() => { setCreating('file'); setNewName('') }} style={toolBtn(true)}>+ file</button>
      </div>

      {/* Create dialog */}
      {creating && (
        <div style={{
          padding: '6px 12px', background: C.surf2,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <span style={{ color: C.muted, fontSize: 11 }}>
            New {creating}:
          </span>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(null) }}
            placeholder={creating === 'dir' ? 'folder-name' : 'file.txt'}
            style={{
              background: C.surf3, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: '4px 8px', color: C.accent,
              fontFamily: 'inherit', fontSize: 12, outline: 'none', flex: 1,
            }}
          />
          <button onClick={handleCreate} style={toolBtn(true, true)}>create</button>
          <button onClick={() => setCreating(null)} style={toolBtn(true)}>cancel</button>
        </div>
      )}

      {/* Error bar */}
      {error && (
        <div style={{
          padding: '4px 12px', background: `${C.danger}22`,
          borderBottom: `1px solid ${C.danger}44`,
          fontSize: 11, color: C.danger, flexShrink: 0,
          display: 'flex', justifyContent: 'space-between',
        }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* File list */}
        <div style={{
          width: 240, borderRight: `1px solid ${C.border}`,
          overflow: 'auto', flexShrink: 0,
        }}>
          {entries.length === 0 && (
            <div style={{ padding: 16, color: C.faint, fontSize: 11 }}>empty directory</div>
          )}
          {entries.map(node => {
            const nodePath = [...cwd, node.name]
            const isSelected = selected?.path.join('/') === nodePath.join('/')
            const isDir = node.type === 'dir'
            return (
              <button
                key={node.name}
                onClick={() => navigate(node, nodePath)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  padding: '7px 12px', fontFamily: 'inherit',
                  background: isSelected ? C.surf2 : 'none',
                  borderLeft: isSelected ? `2px solid ${C.accent}` : '2px solid transparent',
                  borderBottom: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.1s',
                }}
              >
                <span style={{ color: isDir ? C.warn : C.muted, fontSize: 14 }}>
                  {isDir ? '▶' : '—'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    color: node.hidden ? C.muted : (isDir ? C.warn : C.text),
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: 9, color: C.faint }}>
                    {isDir
                      ? `${(node.children?.length ?? 0)} items`
                      : `${node.meta?.size ?? 0}B`
                    }
                  </div>
                </div>
                {node.locked && <span style={{ color: C.danger, fontSize: 10 }}>[L]</span>}
              </button>
            )
          })}
        </div>

        {/* Right pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selected === null ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8, color: C.faint,
            }}>
              <div style={{ fontSize: 24 }}>/fs</div>
              <div style={{ fontSize: 11 }}>Select a file to view its contents.</div>
              <div style={{ fontSize: 10, color: C.faint }}>{cwdStr}</div>
            </div>
          ) : selected.node.type === 'dir' ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8, color: C.faint,
            }}>
              <div style={{ fontSize: 20, color: C.warn }}>▶ {selected.node.name}/</div>
              <div style={{ fontSize: 11 }}>Directory — double-click to navigate.</div>
            </div>
          ) : (
            <>
              {/* File header */}
              <div style={{
                padding: '10px 14px',
                background: C.surf2,
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 'bold' }}>
                    {selected.node.name}
                  </div>
                  <div style={{ fontSize: 10, color: C.faint }}>
                    {pathStr(selected.path)} · {selected.node.meta?.size ?? 0}B
                    {selected.node.locked && ' · LOCKED'}
                  </div>
                </div>
                {!selected.node.locked && (
                  editing ? (
                    <>
                      <button onClick={saveEdit} style={toolBtn(true, true)}>save</button>
                      <button onClick={() => setEditing(false)} style={toolBtn(true)}>cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={startEdit} style={toolBtn(true)}>edit</button>
                      <button onClick={deleteSelected} style={toolBtn(true, false, true)}>delete</button>
                    </>
                  )
                )}
              </div>

              {/* File body */}
              <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
                {editing ? (
                  <textarea
                    autoFocus
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    style={{
                      width: '100%', height: '100%', resize: 'none',
                      background: C.surf3, border: `1px solid ${C.border}`,
                      borderRadius: 4, padding: 10,
                      color: C.text, fontFamily: 'inherit', fontSize: 12,
                      lineHeight: 1.6, outline: 'none',
                    }}
                  />
                ) : (
                  <pre style={{
                    margin: 0, color: C.text, lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12,
                  }}>
                    {fileContent}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function toolBtn(
  enabled: boolean,
  active = false,
  danger = false
): React.CSSProperties {
  return {
    padding: '3px 10px', fontSize: 10, fontFamily: 'inherit',
    border: `1px solid ${danger ? '#ff3b5c44' : active ? '#00e5ff44' : '#2a2a3a'}`,
    borderRadius: 4, cursor: enabled ? 'pointer' : 'default',
    background: active ? '#00e5ff11' : danger ? '#ff3b5c11' : 'none',
    color: !enabled ? '#3a3a4a' : danger ? '#ff3b5c' : active ? '#00e5ff' : '#6b6b80',
    transition: 'all 0.12s',
  }
}
