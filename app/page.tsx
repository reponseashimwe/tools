import Link from "next/link"

/* ── Tool & category data ── */
const categories = [
  {
    id: "image-tools",
    title: "Image Tools",
    description: "Browser-side image processing — no uploads, no server.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    color: "violet",
    tools: [
      {
        href: "/image-tools/base64-to-png",
        title: "Base64 → PNG",
        description: "Paste a Base64 string, preview, crop interactively, then export as PNG or Base64.",
        badge: "Converter",
        tags: ["Base64", "PNG", "Crop"],
      },
      {
        href: "/image-tools/png-to-base64",
        title: "PNG → Base64",
        description: "Upload any image, optionally crop it, then copy as a data URI or raw Base64 string.",
        badge: "Converter",
        tags: ["PNG", "Base64", "Encode"],
      },
    ],
  },
  {
    id: "pdf-tools",
    title: "PDF Tools",
    description: "Convert, create, and manipulate PDF files entirely in-browser.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: "rose",
    tools: [
      {
        href: "/pdf-tools/word-to-pdf",
        title: "Word → PDF",
        description: "Convert one or many DOCX files to PDF at once — privately, right in your browser.",
        badge: "Converter",
        tags: ["DOCX", "Multi-file", "Batch"],
      },
    ],
  },
  {
    id: "markdown-tools",
    title: "Markdown Tools",
    description: "Preview and manage Markdown documents entirely in-browser.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: "emerald",
    tools: [
      {
        href: "/markdown-tools/previewer",
        title: "Markdown Previewer",
        description: "Upload or paste Markdown, preview live, auto-extract title from first line, and optionally keep in browser memory.",
        badge: "Previewer",
        tags: ["Markdown", "Preview", "LocalStorage"],
      },
    ],
  },
]

/* ── Accent config per category ── */
const accent: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
  violet: {
    bg:   "bg-indigo-50 dark:bg-indigo-600/10",
    text: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-200 dark:ring-indigo-500/20",
    dot:  "bg-indigo-500",
  },
  rose: {
    bg:   "bg-rose-50 dark:bg-rose-600/10",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-200 dark:ring-rose-500/20",
    dot:  "bg-rose-500",
  },
  emerald: {
    bg:   "bg-emerald-50 dark:bg-emerald-600/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-200 dark:ring-emerald-500/20",
    dot:  "bg-emerald-500",
  },
}

/* ── Stat items ── */
const stats = [
  { value: "100%", label: "Client-side" },
  { value: "0 KB", label: "Data uploaded" },
  { value: "∞", label: "Files processed" },
]

export default function Home() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            All tools run entirely in your browser
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your Browser-Native
            <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              Dev Toolbox
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 dark:text-gray-400">
            Fast, private utilities for everyday development tasks. No uploads,
            no accounts, no fuss.
          </p>

          {/* Stats */}
          <div className="mx-auto mt-10 flex max-w-xs items-center justify-center gap-8 sm:max-w-none sm:gap-16">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <div className="mx-auto max-w-7xl px-4 py-14 space-y-16">
        {categories.map(cat => {
          const a = accent[cat.color]
          return (
            <section key={cat.id} id={cat.id}>
              {/* Category header */}
              <div className="mb-6 flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring}`}>
                  {cat.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cat.title}</h2>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
                </div>
                <span className={`ml-auto mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${a.bg} ${a.text} ring-1 ${a.ring}`}>
                  {cat.tools.length} tool{cat.tools.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Tools grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.tools.map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-indigo-900/30 hover:-translate-y-0.5"
                  >
                    {/* Badge */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${a.bg} ${a.text} ${a.ring}`}>
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="mb-1.5 text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="flex-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {tool.description}
                    </p>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tool.tags.map(tag => (
                        <span
                          key={tag}
                          className="rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-500 dark:text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Arrow */}
                    <span className="absolute bottom-4 right-4 text-gray-300 dark:text-gray-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </Link>
                ))}

                {/* "More coming" placeholder */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-5 text-center opacity-60">
                  <svg className="h-6 w-6 text-gray-300 dark:text-gray-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-xs text-gray-400 dark:text-gray-600">More tools coming</span>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
