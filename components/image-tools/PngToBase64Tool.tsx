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

type OutputFormat = "datauri" | "raw"

export default function PngToBase64Tool() {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [cropEnabled, setCropEnabled] = useState(false)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("datauri")
  const [output, setOutput] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [dragging, setDragging] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    setFileName(file.name)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setOutput("")

    const reader = new FileReader()
    reader.onload = e => setImgSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerDefaultCrop(width, height))
  }, [])

  const getBase64 = useCallback((): string | null => {
    if (!imgRef.current || !imgSrc) return null

    let dataUri: string
    if (cropEnabled && completedCrop?.width && completedCrop?.height) {
      const canvas = drawCroppedCanvas(imgRef.current, completedCrop)
      dataUri = canvas.toDataURL("image/png")
    } else {
      const canvas = document.createElement("canvas")
      canvas.width = imgRef.current.naturalWidth
      canvas.height = imgRef.current.naturalHeight
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(imgRef.current, 0, 0)
      dataUri = canvas.toDataURL("image/png")
    }

    return outputFormat === "raw" ? dataUri.split(",")[1] : dataUri
  }, [imgSrc, cropEnabled, completedCrop, outputFormat])

  const generate = useCallback(() => {
    const b64 = getBase64()
    if (b64) setOutput(b64)
  }, [getBase64])

  const copyOutput = useCallback(async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const reset = () => {
    setImgSrc(null)
    setFileName("")
    setCrop(undefined)
    setCompletedCrop(undefined)
    setOutput("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const canGenerate = !!imgSrc && (!cropEnabled || (!!completedCrop?.width && !!completedCrop?.height))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      {/* ── Left: Controls ── */}
      <div className="flex flex-col gap-4">

        {/* Upload */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Image Input
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          {!imgSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-10 transition-colors ${
                dragging
                  ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <svg className="h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Drop image here or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-600">PNG, JPG, WEBP, GIF…</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                </svg>
                <span className="truncate text-xs text-gray-600 dark:text-gray-300">{fileName}</span>
              </div>
              <button
                onClick={reset}
                className="ml-2 shrink-0 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Options */}
        {imgSrc && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Options</h2>

            {/* Output format */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Output format</p>
              <div className="flex gap-2">
                {(["datauri", "raw"] as OutputFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => { setOutputFormat(fmt); setOutput("") }}
                    className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      outputFormat === fmt
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    {fmt === "datauri" ? "data: URI" : "Raw Base64"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-600">
                {outputFormat === "datauri"
                  ? "data:image/png;base64,…  — ready for <img src>"
                  : "Plain base64 string without the data: prefix"}
              </p>
            </div>

            {/* Crop toggle */}
            <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
              <span
                onClick={() => { setCropEnabled(v => !v); setOutput("") }}
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
              Apply crop before encoding
            </label>

            <button
              onClick={generate}
              disabled={!canGenerate}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generate Base64
            </button>

            {cropEnabled && !completedCrop?.width && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Draw a crop selection on the image first.
              </p>
            )}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Base64 Output
              </label>
              <span className="text-[11px] text-gray-400 dark:text-gray-600">
                {(output.length / 1024).toFixed(1)} KB
              </span>
            </div>
            <textarea
              readOnly
              value={output}
              className="h-36 w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-3 py-2.5 font-mono text-xs text-gray-700 dark:text-gray-300 outline-none"
              spellCheck={false}
            />
            <button
              onClick={copyOutput}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-white transition-colors"
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
                  Copy to Clipboard
                </>
              )}
            </button>
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
