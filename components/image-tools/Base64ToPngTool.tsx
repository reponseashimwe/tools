'use client'

import { useState, useRef, useCallback } from "react"
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

function centerDefaultCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, width / height, width, height),
    width,
    height
  )
}

function drawCroppedCanvas(image: HTMLImageElement, crop: PixelCrop): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = Math.floor(crop.width * scaleX)
  canvas.height = Math.floor(crop.height * scaleY)
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, canvas.width, canvas.height
  )
  return canvas
}

export default function Base64ToPngTool() {
  const [inputText, setInputText] = useState("")
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [cropEnabled, setCropEnabled] = useState(true)

  const imgRef = useRef<HTMLImageElement>(null)

  const loadImage = useCallback(() => {
    setError(null)
    setCrop(undefined)
    setCompletedCrop(undefined)

    let src = inputText.trim()
    if (!src) { setError("Please paste a Base64 string first."); return }

    if (!src.startsWith("data:")) {
      if (src.startsWith("iVBOR"))      src = `data:image/png;base64,${src}`
      else if (src.startsWith("/9j/"))  src = `data:image/jpeg;base64,${src}`
      else if (src.startsWith("R0lGO")) src = `data:image/gif;base64,${src}`
      else if (src.startsWith("UklGR")) src = `data:image/webp;base64,${src}`
      else                              src = `data:image/png;base64,${src}`
    }

    const testImg = new Image()
    testImg.onload = () => setImgSrc(src)
    testImg.onerror = () => setError("Invalid Base64 — could not decode a valid image.")
    testImg.src = src
  }, [inputText])

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerDefaultCrop(width, height))
  }, [])

  const getCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!imgRef.current) return null
    if (cropEnabled && completedCrop?.width && completedCrop?.height) {
      return drawCroppedCanvas(imgRef.current, completedCrop)
    }
    const canvas = document.createElement("canvas")
    canvas.width = imgRef.current.naturalWidth
    canvas.height = imgRef.current.naturalHeight
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(imgRef.current, 0, 0)
    return canvas
  }, [completedCrop, cropEnabled])

  const downloadPng = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "image.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }, [getCanvas])

  const copyBase64 = useCallback(async () => {
    const canvas = getCanvas()
    if (!canvas) return
    await navigator.clipboard.writeText(canvas.toDataURL("image/png"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [getCanvas])

  const reset = () => {
    setInputText(""); setImgSrc(null); setCrop(undefined)
    setCompletedCrop(undefined); setError(null)
  }

  const canExport = !!imgSrc && (!cropEnabled || (!!completedCrop?.width && !!completedCrop?.height))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      {/* ── Left: Input ── */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Base64 Input
          </label>
          <textarea
            className="h-52 w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 font-mono text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder={"Paste Base64 string here…\n\nAccepts:\n• Raw base64\n• data:image/png;base64,..."}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            spellCheck={false}
          />
          {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={loadImage}
              disabled={!inputText.trim()}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              Load Image
            </button>
            {imgSrc && (
              <button
                onClick={reset}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Export panel */}
        {imgSrc && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Export</h2>

            {/* Crop toggle */}
            <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
              <span
                onClick={() => setCropEnabled(v => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                  cropEnabled ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    cropEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
              Apply crop
            </label>

            <div className="flex flex-col gap-2">
              <button
                onClick={downloadPng}
                disabled={!canExport}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>

              <button
                onClick={copyBase64}
                disabled={!canExport}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-500 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Base64
                  </>
                )}
              </button>
            </div>

            {cropEnabled && !completedCrop?.width && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                Draw a crop selection on the image to export.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Preview + Crop ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        {!imgSrc ? (
          <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-sm">Image preview will appear here</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {cropEnabled ? "Drag to select crop area" : "Full image (no crop)"}
              </span>
              {completedCrop?.width && completedCrop?.height && cropEnabled && (
                <span className="rounded-lg bg-gray-100 dark:bg-gray-800 px-2 py-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)} px
                </span>
              )}
            </div>
            <div className="flex justify-center overflow-auto rounded-xl bg-gray-50 dark:bg-gray-950 p-2">
              <ReactCrop
                crop={cropEnabled ? crop : undefined}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                disabled={!cropEnabled}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Preview"
                  onLoad={onImageLoad}
                  className="max-h-[600px] max-w-full object-contain"
                />
              </ReactCrop>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
