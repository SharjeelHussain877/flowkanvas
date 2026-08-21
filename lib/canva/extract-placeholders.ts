import { inflateRawSync } from "node:zlib"

const PLACEHOLDER_PATTERN = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g

function unescapePdfString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
}

function decodePdfHex(hex: string) {
  const clean = hex.replace(/\s+/g, "")
  if (clean.length < 2 || clean.length % 2 !== 0) {
    return ""
  }

  const bytes = Buffer.from(clean, "hex")
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return bytes.subarray(2).swap16().toString("utf16le")
  }

  if (bytes.length >= 2 && bytes.every((byte, index) => index % 2 === 0 && byte === 0)) {
    return bytes.swap16().toString("utf16le")
  }

  return bytes.toString("latin1")
}

function extractPdfLiteralText(pdfLatin1: string) {
  const parts: string[] = []
  const stringPattern = /\((?:\\.|[^\\)])*\)/g
  const hexPattern = /<([0-9A-Fa-f \t\r\n]+)>/g

  for (const match of pdfLatin1.matchAll(stringPattern)) {
    parts.push(unescapePdfString(match[0].slice(1, -1)))
  }

  for (const match of pdfLatin1.matchAll(hexPattern)) {
    parts.push(decodePdfHex(match[1]))
  }

  return parts.join("")
}

export function extractPlaceholderKeys(text: string): string[] {
  const keys = new Set<string>()
  const normalized = text.replace(/\u0000/g, "")

  for (const match of normalized.matchAll(PLACEHOLDER_PATTERN)) {
    const key = match[1]
    if (key) {
      keys.add(key)
    }
  }

  return [...keys].sort((left, right) => left.localeCompare(right))
}

export function extractPlaceholderKeysFromPdf(bytes: ArrayBuffer): string[] {
  const latin1 = Buffer.from(bytes).toString("latin1")
  const fromRaw = extractPlaceholderKeys(latin1.replace(/\u0000/g, ""))
  const fromStrings = extractPlaceholderKeys(extractPdfLiteralText(latin1))

  return [...new Set([...fromRaw, ...fromStrings])].sort((left, right) =>
    left.localeCompare(right)
  )
}

export function extractPlaceholderKeysFromZip(bytes: ArrayBuffer): string[] {
  const buffer = Buffer.from(bytes)
  const chunks: string[] = []
  let offset = 0

  while (offset < buffer.length - 30) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1
      continue
    }

    const method = buffer.readUInt16LE(offset + 8)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const dataStart = offset + 30 + nameLength + extraLength
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize)

    try {
      if (method === 0) {
        chunks.push(compressed.toString("utf8"))
      } else if (method === 8) {
        chunks.push(inflateRawSync(compressed).toString("utf8"))
      }
    } catch {
      // Skip unreadable zip entries.
    }

    offset = dataStart + compressedSize
  }

  return extractPlaceholderKeys(chunks.join("\n"))
}
