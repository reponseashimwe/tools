import MarkdownPreviewerTool from "@/components/markdown-tools/MarkdownPreviewerTool"
import Link from "next/link"

export const metadata = {
  title: "Markdown Previewer — DevTools",
  description: "Upload or paste Markdown, preview it live, and optionally keep documents in browser memory.",
}

export default function MarkdownPreviewerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/markdown-tools" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Markdown Tools</Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 dark:text-gray-300">Previewer</span>
      </nav>

      {/* Header */}
      <div className="mb-7 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20 shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Markdown Previewer</h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20">
              Previewer
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drop a <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-xs">.md</code> file or type Markdown — live preview, title auto-extracted from the first line, optionally stored in browser memory.
          </p>
        </div>
      </div>

      <MarkdownPreviewerTool />
    </div>
  )
}
