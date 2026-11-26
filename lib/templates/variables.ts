import { getAllElements } from "@/lib/templates/design"
import {
  TEMPLATE_VARIABLE_PATTERN,
  type TemplateDesign,
} from "@/schemas/templates/design"
import type { TemplateVariables } from "@/schemas/templates/template"

function extractTextVariables(text: string): string[] {
  const names = new Set<string>()

  for (const match of text.matchAll(TEMPLATE_VARIABLE_PATTERN)) {
    if (match[1]) {
      names.add(match[1])
    }
  }

  return [...names]
}

/**
 * Variables used by a design across all pages, in order of first appearance.
 * `conditions` lists names that only drive visibility (not printed anywhere).
 */
export function extractTemplateVariables(design: TemplateDesign): TemplateVariables {
  const text = new Set<string>()
  const images = new Set<string>()
  const conditionNames = new Set<string>()

  for (const element of getAllElements(design)) {
    if (element.type === "text" || element.type === "qrcode" || element.type === "barcode") {
      const source = element.type === "text" ? element.text : element.value

      for (const name of extractTextVariables(source)) {
        text.add(name)
      }
    }

    if (element.type === "image" && element.variable) {
      images.add(element.variable)
    }

    if (element.condition) {
      conditionNames.add(element.condition.variable)
    }
  }

  const conditions = [...conditionNames].filter((name) => !text.has(name) && !images.has(name))

  return { text: [...text], images: [...images], conditions }
}

export function interpolateText(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(TEMPLATE_VARIABLE_PATTERN, (_match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name] : ""
  )
}

/** Splits text into literal and variable parts for highlighted previews. */
export function tokenizeText(
  text: string
): Array<{ kind: "literal"; value: string } | { kind: "variable"; name: string; raw: string }> {
  const parts: Array<
    { kind: "literal"; value: string } | { kind: "variable"; name: string; raw: string }
  > = []
  let lastIndex = 0

  for (const match of text.matchAll(TEMPLATE_VARIABLE_PATTERN)) {
    const index = match.index ?? 0

    if (index > lastIndex) {
      parts.push({ kind: "literal", value: text.slice(lastIndex, index) })
    }

    parts.push({ kind: "variable", name: match[1], raw: match[0] })
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ kind: "literal", value: text.slice(lastIndex) })
  }

  return parts
}

export function buildExamplePayload(variables: TemplateVariables) {
  const payload: Record<string, string> = {}

  for (const name of variables.text) {
    payload[name] = `Your ${name.replace(/_/g, " ")}`
  }

  for (const name of variables.images) {
    payload[name] = "https://example.com/image.png"
  }

  for (const name of variables.conditions) {
    payload[name] = "yes"
  }

  return payload
}

export function countVariables(variables: TemplateVariables): number {
  return variables.text.length + variables.images.length + variables.conditions.length
}
