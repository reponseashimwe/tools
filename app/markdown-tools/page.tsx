import Link from "next/link"

export const metadata = {
  title: "Markdown Tools — DevTools",
  description: "Browser-native Markdown utilities — preview, convert, and manage Markdown files locally.",
}

const tools = [
  {
    href: "/markdown-tools/previewer",
    title: "Markdown Previewer",
    description: "Upload or paste Markdown, get a live preview. Title auto-extracted from the first line. Optionally store documents in browser memory.",
    badge: "Previewer",
    tags: ["Markdown", "Preview", "LocalStorage"],
  },
]

export default function MarkdownToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 dark:text-gray-300">Markdown Tools</span>
      </nav>

      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20 shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Markdown Tools</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Browser-native Markdown utilities — everything stays local.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all duration-200 hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-900/30 hover:-translate-y-0.5"
          >
            <div className="mb-3">
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20">
                {tool.badge}
              </span>
            </div>
            <h2 className="mb-1.5 text-base font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
              {tool.title}
            </h2>
            <p className="flex-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{tool.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tool.tags.map(tag => (
                <span key={tag} className="rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
            <span className="absolute bottom-4 right-4 text-gray-300 dark:text-gray-700 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
