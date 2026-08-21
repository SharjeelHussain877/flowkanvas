import { canvaApiGet, canvaApiPost } from "@/lib/canva/api-client"
import { CanvaServiceError } from "@/lib/services/canva/errors"
import { getCanvaTemplateDetail } from "@/lib/services/canva/get-template-detail"
import type { CanvaTemplateKind } from "@/schemas/canva/templates"

type CanvaAutofillJob = {
  id: string
  status: "in_progress" | "success" | "failed"
  result?: {
    type?: string
    design?: {
      id: string
    }
  }
  error?: {
    code?: string
    message?: string
  }
}

type CanvaAutofillJobResponse = {
  job: CanvaAutofillJob
}

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

const POLL_MS = 800
const MAX_ATTEMPTS = 45

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toCanvaAutofillData(payload: Record<string, unknown>) {
  const data: Record<string, { type: string; text?: string; asset_id?: string }> =
    {}

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === "") {
      continue
    }

    if (typeof value === "object" && value !== null && "type" in value) {
      const typed = value as { type?: string; text?: unknown; asset_id?: unknown }
      if (typed.type === "image") {
        data[key] = { type: "image", asset_id: String(typed.asset_id ?? "") }
        continue
      }

      data[key] = {
        type: "text",
        text: String(typed.text ?? ""),
      }
      continue
    }

    data[key] = { type: "text", text: String(value) }
  }

  return data
}

function safeFilename(title: string) {
  const base = title.replace(/[^a-zA-Z0-9-_ ]+/g, "").trim() || "canva-template"
  return `${base.replace(/\s+/g, "-").slice(0, 60)}.pdf`
}

async function pollAutofillJob(userId: string, job: CanvaAutofillJob) {
  let current = job

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (current.status === "success" || current.status === "failed") {
      return current
    }

    await wait(POLL_MS)
    const polled = await canvaApiGet<CanvaAutofillJobResponse>(
      userId,
      `/autofills/${current.id}`
    )
    current = polled.job
  }

  throw new CanvaServiceError(
    "Canva autofill timed out. Try again.",
    504,
    "AUTOFILL_TIMEOUT"
  )
}

async function pollExportJob(userId: string, job: CanvaExportJob) {
  let current = job

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    if (current.status === "success" || current.status === "failed") {
      return current
    }

    await wait(POLL_MS)
    const polled = await canvaApiGet<CanvaExportJobResponse>(
      userId,
      `/exports/${current.id}`
    )
    current = polled.job
  }

  throw new CanvaServiceError(
    "Canva PDF export timed out. Try again.",
    504,
    "EXPORT_TIMEOUT"
  )
}

async function exportDesignPdf(userId: string, designId: string) {
  const created = await canvaApiPost<CanvaExportJobResponse>(userId, "/exports", {
    design_id: designId,
    format: {
      type: "pdf",
      export_quality: "regular",
    },
  })

  const job = await pollExportJob(userId, created.job)

  if (job.status !== "success" || !job.urls?.[0]) {
    throw new CanvaServiceError(
      job.error?.message ?? "Could not export PDF from Canva.",
      502,
      "EXPORT_FAILED"
    )
  }

  const response = await fetch(job.urls[0], { cache: "no-store" })

  if (!response.ok) {
    throw new CanvaServiceError(
      "Could not download the generated PDF.",
      502,
      "PDF_DOWNLOAD_FAILED"
    )
  }

  return response.arrayBuffer()
}

async function autofillTemplate(
  userId: string,
  templateId: string,
  kind: CanvaTemplateKind,
  data: Record<string, { type: string; text?: string; asset_id?: string }>,
  title: string
) {
  const body =
    kind === "brand_template"
      ? {
          type: "create_from_brand_template",
          brand_template_id: templateId,
          title,
          data,
        }
      : {
          type: "create_from_design",
          design_id: templateId,
          title,
          data,
        }

  const created = await canvaApiPost<CanvaAutofillJobResponse>(
    userId,
    "/autofills",
    body
  )
  const job = await pollAutofillJob(userId, created.job)

  if (job.status !== "success" || !job.result?.design?.id) {
    throw new CanvaServiceError(
      job.error?.message ?? "Canva could not fill this template.",
      422,
      "AUTOFILL_FAILED"
    )
  }

  return job.result.design.id
}

export type GenerateCanvaPdfResult = {
  bytes: ArrayBuffer
  filename: string
  warning: string | null
}

export async function generateCanvaPdf(input: {
  userId: string
  templateId: string
  kind?: string | null
  payload: Record<string, unknown>
}): Promise<GenerateCanvaPdfResult> {
  const template = await getCanvaTemplateDetail(
    input.templateId,
    input.kind,
    input.userId
  )
  const data = toCanvaAutofillData(input.payload)
  let designId = template.id
  let warning: string | null = null

  if (Object.keys(data).length > 0) {
    try {
      designId = await autofillTemplate(
        input.userId,
        template.id,
        template.kind,
        data,
        template.title
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Autofill failed"

      warning = `Could not fill Canva variables (${message}). The original design was exported instead. Brand templates with data fields work best.`
      designId = template.id
    }
  } else {
    warning =
      "No payload values were provided, so the original Canva design was exported."
  }

  const bytes = await exportDesignPdf(input.userId, designId)

  return {
    bytes,
    filename: safeFilename(template.title),
    warning,
  }
}
