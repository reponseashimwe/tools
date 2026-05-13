import PngToBase64Tool from "@/components/image-tools/PngToBase64Tool"
import Link from "next/link"

export const metadata = {
  title: "PNG → Base64 — DevTools",
  description: "Upload an image, optionally crop it, then export as a Base64 data URI or raw Base64 string.",
}

export default function PngToBase64Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-indigo-600 dark:text-indigo-400 font-medium">Image Tools</span>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-600 dark:text-gray-300">PNG → Base64</span>
      </nav>

      {/* Header */}
      <div className="mb-7 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20 shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PNG to Base64 Converter</h1>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-600/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/20">
              Converter
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload any image, optionally crop it, then copy the Base64 string as a data URI or raw Base64.
          </p>
        </div>
      </div>

      <PngToBase64Tool />
    </div>
  )
}
