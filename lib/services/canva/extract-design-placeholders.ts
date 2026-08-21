import { canvaApiGet, canvaApiPost } from "@/lib/canva/api-client"
import {
  extractPlaceholderKeys,
  extractPlaceholderKeysFromPdf,
  extractPlaceholderKeysFromZip,
} from "@/lib/canva/extract-placeholders"
import type { CanvaDatasetField } from "@/schemas/canva/template-detail"

type CanvaExportJob = {
  id: string
  status: "in_progress" | "success" | "failed"
  urls?: string[]
  error?: {
    code?: string
    message?: string
  }
}

type CanvaExportJobResponse = {
  job: CanvaExportJob
}

const EXPORT_POLL_MS = 800
const EXPORT_MAX_ATTEMPTS = 45

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toFields(keys: string[]): CanvaDatasetField[] {
  return keys.map((key) => ({
    key,
    type: "text" as const,
  }))
}

async function downloadExportBytes(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`Could not download Canva export (${response.status})`)
  }

  return response.arrayBuffer()
}

async function waitForExportJob(
  userId: string,
  job: CanvaExportJob
): Promise<CanvaExportJob> {
  let current = job

  for (let attempt = 0; attempt < EXPORT_MAX_ATTEMPTS; attempt += 1) {
    if (current.status === "success" || current.status === "failed") {
      return current
    }

    await wait(EXPORT_POLL_MS)
    const polled = await canvaApiGet<CanvaExportJobResponse>(
      userId,
      `/exports/${current.id}`
    )
    current = polled.job
  }

  return current
}

async function exportDesign(
  userId: string,
  designId: string,
  format: Record<string, unknown>
) {
  const created = await canvaApiPost<CanvaExportJobResponse>(userId, "/exports", {
    design_id: designId,
    format,
  })

  return waitForExportJob(userId, created.job)
}

async function extractFromSuccessfulJob(
  job: CanvaExportJob,
  parser: (bytes: ArrayBuffer) => string[]
) {
  if (job.status !== "success" || !job.urls?.length) {
    return []
  }

  const keys = new Set<string>()

  for (const url of job.urls) {
    const bytes = await downloadExportBytes(url)
    for (const key of parser(bytes)) {
      keys.add(key)
    }
  }

  return [...keys]
}

export async function extractDesignPlaceholderFields(
  userId: string,
  designId: string
): Promise<CanvaDatasetField[]> {
  try {
    const pptxJob = await exportDesign(userId, designId, {
      type: "pptx",
      export_quality: "regular",
    })
    const pptxKeys = await extractFromSuccessfulJob(
      pptxJob,
      extractPlaceholderKeysFromZip
    )
    if (pptxKeys.length > 0) {
      return toFields(pptxKeys)
    }
  } catch (error) {
    console.error("[canva] pptx placeholder export failed", error)
  }

  try {
    const htmlJob = await exportDesign(userId, designId, {
      type: "html_standalone",
    })
    const htmlKeys = await extractFromSuccessfulJob(htmlJob, (bytes) =>
      extractPlaceholderKeys(Buffer.from(bytes).toString("utf8"))
    )
    if (htmlKeys.length > 0) {
      return toFields(htmlKeys)
    }
  } catch (error) {
    console.error("[canva] html placeholder export failed", error)
  }

  try {
    const pdfJob = await exportDesign(userId, designId, {
      type: "pdf",
      export_quality: "regular",
    })
    const pdfKeys = await extractFromSuccessfulJob(
      pdfJob,
      extractPlaceholderKeysFromPdf
    )
    if (pdfKeys.length > 0) {
      return toFields(pdfKeys)
    }
  } catch (error) {
    console.error("[canva] pdf placeholder export failed", error)
  }

  return []
}
