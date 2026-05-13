import WordToPdfTool from "@/components/pdf-tools/WordToPdfTool"
import Link from "next/link"

export const metadata = {
  title: "Word → PDF — DevTools",
  description: "Convert multiple DOCX files to PDF right in your browser — no upload, no server.",
}

export default function WordToPdfPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-rose-500 dark:text-rose-400 font-medium">PDF Tools</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 dark:text-gray-300">Word → PDF</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-600/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-500/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <span className="rounded-full bg-rose-50 dark:bg-rose-600/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-500/20">
            Converter
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Word → PDF Converter</h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Drop one or many <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-xs font-mono">.docx</code> files,
          hit <strong className="text-gray-700 dark:text-gray-300">Convert</strong>, and download individual PDFs or a single ZIP — all processed locally.
        </p>
      </div>

      <WordToPdfTool />
    </div>
  )
}
