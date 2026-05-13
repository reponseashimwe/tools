'use client'

import { useState, useRef, useCallback, useId } from "react"

/* ── Types ── */
type Status = "idle" | "converting" | "done" | "error"

interface FileEntry {
  id: string
  file: File
  status: Status
  blob: Blob | null
  error: string | null
}

/* ── Helpers ── */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function baseName(name: string): string {
  return name.replace(/\.(docx?)$/i, "")
}

/* ── PDF renderer: DOCX → HTML (mammoth) → jsPDF text layout ──
   Avoids html2canvas entirely so there's no blank-canvas issue from
   off-screen elements.  Produces a real text-based PDF. ── */
async function convertDocxToPdfBlob(file: File): Promise<Blob> {
  const [mammothMod, { jsPDF }] = await Promise.all([
    import("mammoth"),
    import("jspdf"),
  ])
  // mammoth may ship as CJS wrapped by bundler, handle both shapes
  const mammoth = (mammothMod as any).default ?? mammothMod

  const arrayBuffer = await file.arrayBuffer()
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer })

  // Parse the HTML with DOMParser (always available in a browser)
  const dom = new DOMParser().parseFromString(html, "text/html")

  // ── PDF canvas setup ──
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const PW = pdf.internal.pageSize.getWidth()   // 210 mm
  const PH = pdf.internal.pageSize.getHeight()  // 297 mm
  const ML = 20, MR = 20, MT = 22, MB = 22
  const TW = PW - ML - MR   // usable text width (170 mm)

  let y = MT

  function ensureSpace(h: number) {
    if (y + h > PH - MB) { pdf.addPage(); y = MT }
  }

  /** Add wrapped text with consistent line-height. Returns new y. */
  function addBlock(
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" | "italic" | "bolditalic",
    indent = 0,
    afterGap = 2,
  ) {
    if (!text.trim()) return
    pdf.setFontSize(fontSize)
    pdf.setFont("helvetica", fontStyle)
    const lh = fontSize * 0.38      // ~proportional line height in mm
    const lines: string[] = pdf.splitTextToSize(text, TW - indent)
    for (const line of lines) {
      ensureSpace(lh + 0.5)
      pdf.text(line, ML + indent, y)
      y += lh + 0.5
    }
    y += afterGap
  }

  function processNode(el: Element) {
    const tag = el.tagName.toLowerCase()
    const text = (el.textContent ?? "").trim()

    switch (tag) {
      case "h1": addBlock(text, 20, "bold",   0, 4); break
      case "h2": addBlock(text, 16, "bold",   0, 3); break
      case "h3": addBlock(text, 13, "bold",   0, 2); break
      case "h4":
      case "h5":
      case "h6": addBlock(text, 12, "bolditalic", 0, 2); break

      case "p":
        // Walk child nodes so we can honour inline <strong>/<em>
        renderInlineParagraph(el)
        y += 2
        break

      case "ul":
      case "ol":
        el.querySelectorAll(":scope > li").forEach((li, i) => {
          const bullet = tag === "ol" ? `${i + 1}.` : "\u2022"
          const liText = (li.textContent ?? "").trim()
          if (!liText) return
          pdf.setFontSize(11)
          pdf.setFont("helvetica", "normal")
          const lh = 11 * 0.38 + 0.5
          const lines: string[] = pdf.splitTextToSize(liText, TW - 10)
          lines.forEach((line, j) => {
            ensureSpace(lh)
            if (j === 0) pdf.text(bullet, ML + 2, y)
            pdf.text(line, ML + 9, y)
            y += lh
          })
        })
        y += 2
        break

      case "table":
        renderTable(el)
        y += 4
        break

      case "hr":
        ensureSpace(6)
        pdf.setDrawColor(180, 180, 180)
        pdf.line(ML, y, ML + TW, y)
        y += 6
        break
    }
  }

  /** Render inline nodes (<strong>, <em>, text) without word-wrap merging. */
  function renderInlineParagraph(p: Element) {
    // Collect runs
    const runs: { text: string; bold: boolean; italic: boolean }[] = []
    p.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) {
        const t = n.textContent ?? ""
        if (t) runs.push({ text: t, bold: false, italic: false })
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const tag = (n as Element).tagName.toLowerCase()
        runs.push({
          text: (n.textContent ?? ""),
          bold:   tag === "strong" || tag === "b",
          italic: tag === "em"     || tag === "i",
        })
      }
    })

    // Merge into full text first for simple single-style paragraphs
    const allBold   = runs.every(r => r.bold)
    const allItalic = runs.every(r => r.italic)
    const allNormal = runs.every(r => !r.bold && !r.italic)

    if (allNormal || allBold || allItalic) {
      const style = allBold ? "bold" : allItalic ? "italic" : "normal"
      addBlock(runs.map(r => r.text).join(""), 11, style, 0, 0)
      return
    }

    // Mixed: naive inline layout — concatenate text, mark dominant style
    // (full inline layout engine is out of scope; fall back to full text)
    addBlock(p.textContent?.trim() ?? "", 11, "normal", 0, 0)
  }

  function renderTable(table: Element) {
    const rows = Array.from(table.querySelectorAll("tr"))
    if (!rows.length) return
    const maxCols = Math.max(...rows.map(r => r.querySelectorAll("td,th").length))
    if (!maxCols) return
    const cellW = TW / maxCols
    const rowH  = 7

    rows.forEach(row => {
      const cells = row.querySelectorAll("td,th")
      const isHeader = row.querySelector("th") !== null
      ensureSpace(rowH + 1)
      pdf.setFontSize(9)
      if (isHeader) {
        pdf.setFont("helvetica", "bold")
        pdf.setFillColor(242, 242, 242)
        pdf.rect(ML, y - rowH + 1.5, TW, rowH, "F")
      } else {
        pdf.setFont("helvetica", "normal")
      }
      cells.forEach((cell, ci) => {
        const cellText = (cell.textContent ?? "").trim().substring(0, 80)
        pdf.text(cellText, ML + ci * cellW + 1.5, y)
      })
      pdf.setDrawColor(210, 210, 210)
      pdf.line(ML, y + 1.5, ML + TW, y + 1.5)
      y += rowH
    })
  }

  // ── Walk every top-level element in the extracted HTML body ──
  Array.from(dom.body.children).forEach(processNode)

  if (pdf.getNumberOfPages() === 1 && y <= MT + 5) {
    // Nothing was written — add a fallback message
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "italic")
    pdf.text("(No readable text content found in this document.)", ML, MT + 10)
  }

  return pdf.output("blob")
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/* ── Drop-zone component ── */
function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const accept = (fileList: FileList | null) => {
    if (!fileList) return
    const docx = Array.from(fileList).filter(f =>
      /\.(docx?)$/i.test(f.name)
    )
    if (docx.length) onFiles(docx)
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files) }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all ${
        dragging
          ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
          : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600/60 hover:bg-gray-50 dark:hover:bg-gray-800/40"
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept=".doc,.docx"
        multiple
        className="sr-only"
        onChange={e => accept(e.target.files)}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-500 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Drop <span className="text-indigo-600 dark:text-indigo-400">.docx</span> files here
        </p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          or click to browse — multiple files accepted
        </p>
      </div>
    </label>
  )
}

/* ── Status badge ── */
function StatusBadge({ status, error }: { status: Status; error: string | null }) {
  if (status === "idle")
    return <span className="text-xs text-gray-400 dark:text-gray-500">Pending</span>

  if (status === "converting")
    return (
      <span className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
        Converting…
      </span>
    )

  if (status === "done")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Done
      </span>
    )

  return (
    <span className="text-xs font-medium text-red-500" title={error ?? undefined}>
      Failed
    </span>
  )
}

/* ── Main component ── */
export default function WordToPdfTool() {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [converting, setConverting] = useState(false)
  const counter = useRef(0)

  const addFiles = useCallback((files: File[]) => {
    setEntries(prev => {
      const existingNames = new Set(prev.map(e => e.file.name))
      const newEntries: FileEntry[] = files
        .filter(f => !existingNames.has(f.name))
        .map(f => ({
          id: `fe-${counter.current++}`,
          file: f,
          status: "idle",
          blob: null,
          error: null,
        }))
      return [...prev, ...newEntries]
    })
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  const convertAll = useCallback(async () => {
    const pending = entries.filter(e => e.status === "idle")
    if (!pending.length) return
    setConverting(true)

    for (const entry of pending) {
      // Mark as converting
      setEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, status: "converting" } : e)
      )
      try {
        const blob = await convertDocxToPdfBlob(entry.file)
        setEntries(prev =>
          prev.map(e => e.id === entry.id ? { ...e, status: "done", blob } : e)
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Conversion failed"
        setEntries(prev =>
          prev.map(e => e.id === entry.id ? { ...e, status: "error", error: msg } : e)
        )
      }
    }
    setConverting(false)
  }, [entries])

  const downloadOne = useCallback((entry: FileEntry) => {
    if (entry.blob) downloadBlob(entry.blob, `${baseName(entry.file.name)}.pdf`)
  }, [])

  const downloadAllZip = useCallback(async () => {
    const done = entries.filter(e => e.status === "done" && e.blob)
    if (!done.length) return
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()
    done.forEach(e => zip.file(`${baseName(e.file.name)}.pdf`, e.blob!))
    const content = await zip.generateAsync({ type: "blob" })
    downloadBlob(content, "converted-pdfs.zip")
  }, [entries])

  const retryEntry = useCallback((id: string) => {
    setEntries(prev =>
      prev.map(e => e.id === id ? { ...e, status: "idle", blob: null, error: null } : e)
    )
  }, [])

  const clearAll = () => setEntries([])

  const pendingCount = entries.filter(e => e.status === "idle").length
  const doneCount = entries.filter(e => e.status === "done").length
  const hasEntries = entries.length > 0

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <DropZone onFiles={addFiles} />

      {/* File list */}
      {hasEntries && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-2.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {entries.length} file{entries.length !== 1 ? "s" : ""} queued
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map(entry => (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                {/* Doc icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-600/10 text-indigo-500 dark:text-indigo-400">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>

                {/* Name + size */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatBytes(entry.file.size)}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={entry.status} error={entry.error} />

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {entry.status === "done" && (
                    <button
                      onClick={() => downloadOne(entry)}
                      title="Download PDF"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                  {entry.status === "error" && (
                    <button
                      onClick={() => retryEntry(entry.id)}
                      title="Retry"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                  {(entry.status === "idle" || entry.status === "error") && (
                    <button
                      onClick={() => removeEntry(entry.id)}
                      title="Remove"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action bar */}
      {hasEntries && (
        <div className="flex flex-wrap gap-3">
          {pendingCount > 0 && (
            <button
              onClick={convertAll}
              disabled={converting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {converting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Converting…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                  </svg>
                  Convert {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                </>
              )}
            </button>
          )}

          {doneCount > 1 && (
            <button
              onClick={downloadAllZip}
              className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download all as ZIP ({doneCount})
            </button>
          )}

          {doneCount === 1 && (
            <button
              onClick={() => downloadOne(entries.find(e => e.status === "done")!)}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          )}
        </div>
      )}

      {/* Info note */}
      <p className="flex items-start gap-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        All conversion happens locally in your browser. Your files are never uploaded to any server.
        Complex formatting (images, tables, custom fonts) may render differently than the original document.
      </p>
    </div>
  )
}
