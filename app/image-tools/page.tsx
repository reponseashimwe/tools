import Link from "next/link"

const tools = [
  {
    title: "Base64 → PNG",
    description:
      "Paste a Base64 string, preview the image, crop it interactively, then export as PNG or Base64.",
    href: "/image-tools/base64-to-png",
    badge: "Converter",
  },
]

export default function ImageToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Image Tools
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">Image Utilities</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Browser-side image processing — no uploads, no server.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-600/15 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-500/20">
                {tool.badge}
              </span>
            </div>
            <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              {tool.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
