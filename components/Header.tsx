'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useCallback } from "react"
import { useTheme } from "@/components/ThemeProvider"

/* ── Nav data ── */
const NAV = [
  {
    id: "image-tools",
    label: "Image Tools",
    href: "/image-tools",
    description: "Browser-side image processing — no uploads, no server.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    tools: [
      {
        label: "Base64 → PNG",
        href: "/image-tools/base64-to-png",
        badge: "Converter",
        description: "Convert Base64 strings to PNG, crop interactively, export.",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
          </svg>
        ),
      },
      {
        label: "PNG → Base64",
        href: "/image-tools/png-to-base64",
        badge: "Converter",
        description: "Upload any image, optionally crop, then copy as data URI or raw Base64.",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "pdf-tools",
    label: "PDF Tools",
    href: "/pdf-tools",
    description: "Convert, create, and manipulate PDFs entirely in-browser.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    tools: [
      {
        label: "Word → PDF",
        href: "/pdf-tools/word-to-pdf",
        badge: "Converter",
        description: "Convert multiple DOCX files to PDF at once, in the browser.",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "markdown-tools",
    label: "Markdown Tools",
    href: "/markdown-tools",
    description: "Preview and manage Markdown documents entirely in-browser.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    tools: [
      {
        label: "Markdown Previewer",
        href: "/markdown-tools/previewer",
        badge: "Previewer",
        description: "Upload or paste Markdown, live preview, title from first line, optional browser memory.",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        ),
      },
    ],
  },
]

/* ── Theme Toggle ── */
function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      {theme === "dark" ? (
        /* Sun — click to go light */
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        /* Moon — click to go dark */
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  )
}

/* ── Header ── */
export default function Header() {
  const pathname = usePathname()
  const [openId, setOpenId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenId(id)
  }, [])

  const handleLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenId(null), 120)
  }, [])

  const openCategory = NAV.find(n => n.id === openId) ?? null

  return (
    <header className="relative sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
      {/* ── Main bar ── */}
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-base font-bold tracking-tight text-gray-900 dark:text-white shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white shadow-sm">
            D
          </span>
          <span>DevTools</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <button
                key={item.id}
                onMouseEnter={() => handleEnter(item.id)}
                onMouseLeave={handleLeave}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors select-none cursor-pointer ${
                  active
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {item.label}
                <svg
                  className={`h-3.5 w-3.5 opacity-50 transition-transform duration-150 ${openId === item.id ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Desktop Mega-panel ── */}
      {openCategory && (
        <div
          className="absolute left-0 right-0 top-full z-50 hidden md:block border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl"
          onMouseEnter={() => handleEnter(openCategory.id)}
          onMouseLeave={handleLeave}
        >
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="grid grid-cols-[220px_1fr] gap-8">
              {/* Category sidebar */}
              <div className="flex flex-col gap-2 border-r border-gray-100 dark:border-gray-800 pr-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20 mb-1">
                  {openCategory.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{openCategory.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{openCategory.description}</p>
                <span className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {openCategory.tools.length} tool{openCategory.tools.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Tools grid */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 content-start">
                {openCategory.tools.map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setOpenId(null)}
                    className="group flex items-start gap-3 rounded-xl border border-transparent p-3 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                      {tool.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {tool.label}
                        </span>
                        <span className="rounded-full bg-indigo-50 dark:bg-indigo-600/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20">
                          {tool.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          {NAV.map(item => (
            <div key={item.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="text-indigo-600 dark:text-indigo-400">{item.icon}</div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</span>
              </div>
              <div className="pb-2 px-4 space-y-1">
                {item.tools.map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <span className="text-indigo-500 dark:text-indigo-400">{tool.icon}</span>
                    {tool.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
