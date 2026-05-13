'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { marked } from 'marked'

/* ── Types ── */
type ViewMode = 'editor' | 'split' | 'preview'

interface Doc {
  id: string
  title: string
  content: string
  savedAt: number
}

/* ── localStorage store ── */
const STORAGE_KEY = 'devtools:markdown-previewer:docs'

function readDocs(): Doc[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function writeDocs(docs: Doc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

const store = {
  list: (): Doc[] => readDocs(),
  create: (patch: Omit<Doc, 'id' | 'savedAt'>): Doc => {
    const doc: Doc = { id: crypto.randomUUID(), savedAt: Date.now(), ...patch }
    const docs = readDocs()
    docs.unshift(doc)
    writeDocs(docs)
    return doc
  },
  update: (id: string, patch: Partial<Omit<Doc, 'id'>>): Doc => {
    const docs = readDocs()
    const idx = docs.findIndex(d => d.id === id)
    if (idx < 0) throw new Error('Not found')
    docs[idx] = { ...docs[idx], ...patch, id, savedAt: Date.now() }
    writeDocs(docs)
    return docs[idx]
  },
  remove: (id: string) => {
    writeDocs(readDocs().filter(d => d.id !== id))
  },
}

function extractTitle(content: string): string {
  const first = content.split('\n')[0].trim()
  return first.replace(/^#+\s*/, '') || 'Untitled'
}

const PREVIEW_PROSE = 'prose dark:prose-invert prose-emerald max-w-none'
const PREVIEW_WRAP = 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100'

/* ── PDF export ── */
function exportToPdf(title: string, html: string) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${title}</title><style>
  @page { margin: 1.5cm 2cm; size: A4; }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1f2328;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  h1 { font-size: 1.9em; font-weight: 700; border-bottom: 2px solid #d0d7de; padding-bottom: 0.3em; margin: 0 0 0.6em; }
  h2 { font-size: 1.5em; font-weight: 700; border-bottom: 1px solid #d0d7de; padding-bottom: 0.2em; margin: 1.4em 0 0.4em; }
  h3 { font-size: 1.2em; font-weight: 600; margin: 1.2em 0 0.3em; }
  h4 { font-size: 1.05em; font-weight: 600; margin: 1em 0 0.2em; }
  h5, h6 { font-size: 1em; font-weight: 600; margin: 0.8em 0 0.2em; color: #57606a; }
  p { margin: 0 0 0.75em; }
  a { color: #0969da; text-decoration: underline; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  del { text-decoration: line-through; color: #57606a; }
  pre {
    font-family: 'Menlo', 'Consolas', 'Monaco', 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.82em;
    line-height: 1.5;
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    padding: 0.9em 1.1em;
    margin: 0.75em 0;
    overflow-x: auto;
    white-space: pre;
    word-break: normal;
  }
  code {
    font-family: 'Menlo', 'Consolas', 'Monaco', 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.875em;
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 4px;
    padding: 0.15em 0.4em;
    color: #d63384;
  }
  pre code { background: none; border: none; padding: 0; font-size: inherit; color: inherit; }
  blockquote {
    border-left: 4px solid #d0d7de;
    margin: 0.75em 0;
    padding: 0.4em 1em;
    color: #57606a;
    background: #f6f8fa;
    border-radius: 0 4px 4px 0;
  }
  blockquote p:last-child { margin-bottom: 0; }
  ul, ol { padding-left: 1.75em; margin: 0 0 0.75em; }
  li { margin: 0.25em 0; }
  li > p { margin-bottom: 0.25em; }
  table { border-collapse: collapse; width: 100%; margin: 0.75em 0; font-size: 0.95em; }
  th, td { border: 1px solid #d0d7de; padding: 0.45em 0.8em; text-align: left; }
  th { background: #f6f8fa; font-weight: 600; }
  tr:nth-child(even) td { background: #f9fafb; }
  img { max-width: 100%; height: auto; border-radius: 4px; }
  hr { border: none; border-top: 2px solid #d0d7de; margin: 1.5em 0; }
  @media print {
    pre { white-space: pre-wrap; }
    a { color: #0969da; }
    h1, h2, h3 { page-break-after: avoid; }
    pre, blockquote, table { page-break-inside: avoid; }
  }
</style></head><body>${html}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 500)
}

/* ══════════════════════════════════════════════════════
   LIBRARY VIEW
══════════════════════════════════════════════════════ */
function LibraryView({ docs, loading, onOpen, onNew, onDelete }: {
  docs: Doc[]
  loading: boolean
  onOpen: (doc: Doc) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(md|markdown|txt)$/i)) return
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      onOpen({ id: '', title: extractTitle(content), content, savedAt: 0 })
    }
    reader.readAsText(file)
  }, [onOpen])

  return (
    <div className="space-y-4">
      {/* Action row */}
      <div className="flex items-center justify-between gap-3">
        {/* Drop zone */}
        <div
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border border-dashed px-4 py-2.5 transition-all ${
            dragging
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-gray-50 dark:hover:bg-gray-900/50'
          }`}
        >
          <input ref={fileRef} type="file" accept=".md,.markdown,.txt" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400">Drop or click to open a <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 text-xs">.md</code> file</span>
        </div>

        <button
          onClick={onNew}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New
        </button>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-600">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 py-20 text-center">
          <svg className="h-10 w-10 text-gray-200 dark:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-gray-400 dark:text-gray-600">No documents yet — create one or drop a file above</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          {docs.map((doc, i) => (
            <button
              key={doc.id}
              onClick={() => onOpen(doc)}
              className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                i !== 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''
              } bg-white dark:bg-gray-900`}
            >
              <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>

              <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                {doc.title}
              </span>

              <span className="shrink-0 text-xs text-gray-400 dark:text-gray-600 tabular-nums">
                {new Date(doc.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>

              <button
                onClick={e => { e.stopPropagation(); onDelete(doc.id) }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
                aria-label="Delete"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   EDITOR VIEW  (fixed full-screen overlay)
══════════════════════════════════════════════════════ */
function EditorView({ doc, isNew, onBack, onSaved, onDelete }: {
  doc: Doc
  isNew: boolean
  onBack: () => void
  onSaved: (doc: Doc) => void
  onDelete: (id: string) => void
}) {
  const [content, setContent] = useState(doc.content)
  const [savedDoc, setSavedDoc] = useState<Doc | null>(isNew ? null : doc)
  const [keepInMemory, setKeepInMemory] = useState(!isNew)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [fontSize, setFontSize] = useState(16)
  const [splitPct, setSplitPct] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const isDragging = useRef(false)
  /* refs so the auto-save closure always sees current values without re-subscribing */
  const keepInMemoryRef = useRef(keepInMemory)
  const savedDocRef = useRef(savedDoc)
  keepInMemoryRef.current = keepInMemory
  savedDocRef.current = savedDoc

  const title = useMemo(() => extractTitle(content), [content])
  const renderedHtml = useMemo(() => content.trim() ? marked.parse(content) as string : '', [content])

  /* drag-to-resize */
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setSplitPct(Math.min(80, Math.max(20, pct)))
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => setContent(e.target?.result as string ?? '')
    reader.readAsText(file)
  }, [])

  function toggleMemory() {
    const next = !keepInMemory
    setKeepInMemory(next)
    keepInMemoryRef.current = next
    if (next) {
      const current = savedDocRef.current
      const updated = current
        ? store.update(current.id, { title, content })
        : store.create({ title, content })
      setSavedDoc(updated)
      savedDocRef.current = updated
      onSaved(updated)
    } else if (savedDocRef.current) {
      const id = savedDocRef.current.id
      setSavedDoc(null)
      savedDocRef.current = null
      store.remove(id)
      onDelete(id)
    }
  }

  /* Cmd/Ctrl+S */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 's') return
      e.preventDefault()
      if (keepInMemoryRef.current && savedDocRef.current) return
      setKeepInMemory(true)
      keepInMemoryRef.current = true
      const current = savedDocRef.current
      const updated = current
        ? store.update(current.id, { title, content })
        : store.create({ title, content })
      setSavedDoc(updated)
      savedDocRef.current = updated
      onSaved(updated)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title])

  const viewButtons: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: 'editor',
      label: 'Editor',
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
      ),
    },
    {
      mode: 'split',
      label: 'Split',
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15" />
        </svg>
      ),
    },
    {
      mode: 'preview',
      label: 'Preview',
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: 'var(--bg, #f9fafb)' }}>

      {/* ══ Header ══ */}
      <header className="flex shrink-0 items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 select-none">

        {/* Back */}
        <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="hidden sm:inline text-xs font-medium">Docs</span>
        </button>

        <span className="h-4 w-px shrink-0 bg-gray-200 dark:bg-gray-800" />

        {/* Title */}
        <span className="flex min-w-0 flex-1 items-center px-1 truncate">
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{title || 'Untitled'}</span>
        </span>

        <span className="h-4 w-px shrink-0 bg-gray-200 dark:bg-gray-800" />

        {/* View toggle */}
        <div className="flex shrink-0 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-0.5">
          {viewButtons.map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={label}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {icon}
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>

        <span className="h-4 w-px shrink-0 bg-gray-200 dark:bg-gray-800" />

        {/* Font size */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-0.5">
          <button
            onClick={() => setFontSize(s => Math.max(12, s - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
            title="Smaller"
          >A-</button>
          <span className="w-7 text-center text-xs tabular-nums text-gray-500 dark:text-gray-400">{fontSize}</span>
          <button
            onClick={() => setFontSize(s => Math.min(26, s + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
            title="Larger"
          >A+</button>
        </div>

        {/* Export PDF */}
        <button
          onClick={() => exportToPdf(title, renderedHtml)}
          disabled={!renderedHtml}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Export as PDF"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span className="hidden sm:inline">PDF</span>
        </button>

        {/* Save toggle */}
        <button
          onClick={toggleMemory}
          title={keepInMemory ? 'Saved to server — click to remove' : 'Save to server (⌘S)'}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            keepInMemory
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20'
              : 'border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${keepInMemory ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'}`} />
          <span className="hidden sm:inline">{keepInMemory ? 'Saved' : 'Save'}</span>
        </button>
      </header>

      {/* ══ Body ══ */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">

        {/* Editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div
            className="flex min-w-0 flex-col border-r border-gray-200 dark:border-gray-800"
            style={{ width: viewMode === 'editor' ? '100%' : `${splitPct}%` }}
          >
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={'# Title\n\nStart writing Markdown here...'}
              spellCheck={false}
              className="flex-1 resize-none bg-white dark:bg-gray-950 p-5 font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-700 focus:outline-none"
            />
          </div>
        )}

        {/* Drag divider */}
        {viewMode === 'split' && (
          <div
            onMouseDown={onDividerMouseDown}
            className="group relative w-1 shrink-0 cursor-col-resize bg-gray-200 dark:bg-gray-800 hover:bg-emerald-400 dark:hover:bg-emerald-600 transition-colors"
          >
            <div className="absolute inset-y-0 -left-2 -right-2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1">
              {[0,1,2].map(i => <span key={i} className="h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-600" />)}
            </div>
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex min-w-0 flex-col overflow-hidden ${PREVIEW_WRAP}`}
            style={{ width: viewMode === 'preview' ? '100%' : `${100 - splitPct}%` }}
          >
            <div className="flex-1 overflow-y-auto p-6 lg:p-10">
              {renderedHtml ? (
                <div
                  className={PREVIEW_PROSE}
                  style={{ fontSize: `${fontSize}px` }}
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center opacity-30">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <p className="text-sm">Start typing to see preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function MarkdownPreviewerTool() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    setDocs(store.list())
    setLoading(false)
  }, [])

  function handleNew() {
    setActiveDoc({ id: '', title: 'Untitled', content: '', savedAt: 0 })
    setIsNew(true)
  }

  function handleOpen(doc: Doc) {
    setActiveDoc(doc)
    setIsNew(doc.id === '')
  }

  function handleSaved(updated: Doc) {
    setDocs(prev => {
      const idx = prev.findIndex(d => d.id === updated.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = updated; return next
      }
      return [updated, ...prev]
    })
    setActiveDoc(updated)
    setIsNew(false)
  }

  function handleDelete(id: string) {
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  function handleBack() {
    setActiveDoc(null)
    setIsNew(false)
    setDocs(store.list())
  }

  return (
    <>
      {activeDoc ? (
        <EditorView
          doc={activeDoc}
          isNew={isNew}
          onBack={handleBack}
          onSaved={handleSaved}
          onDelete={handleDelete}
        />
      ) : (
        <LibraryView
          docs={docs}
          loading={loading}
          onOpen={handleOpen}
          onNew={handleNew}
          onDelete={id => {
            store.remove(id)
            handleDelete(id)
          }}
        />
      )}
    </>
  )
}
