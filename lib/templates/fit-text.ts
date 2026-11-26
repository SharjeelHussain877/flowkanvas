export type MeasureText = (text: string, fontSize: number) => number

const MIN_AUTO_FIT_SIZE = 4

type FitParams = {
  text: string
  width: number
  height: number
  fontSize: number
  lineHeight: number
  measure: MeasureText
}

/**
 * Greedy word wrap. A word wider than the box either fails the fit (returns null) or,
 * with `breakLongWords`, counts the extra lines the renderer needs to break it.
 */
function countLines(
  text: string,
  width: number,
  fontSize: number,
  measure: MeasureText,
  breakLongWords = false
): number | null {
  let lines = 0

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean)

    if (words.length === 0) {
      lines += 1
      continue
    }

    let current = ""

    for (const word of words) {
      const wordWidth = measure(word, fontSize)

      if (wordWidth > width) {
        if (!breakLongWords) {
          return null
        }

        if (current) {
          lines += 1
          current = ""
        }

        lines += Math.max(1, Math.ceil(wordWidth / Math.max(1, width))) - 1
        current = word
        continue
      }

      const candidate = current ? `${current} ${word}` : word

      if (measure(candidate, fontSize) <= width) {
        current = candidate
        continue
      }

      lines += 1
      current = word
    }

    lines += 1
  }

  return lines
}

function fits(params: FitParams, fontSize: number): boolean {
  const lines = countLines(params.text, params.width, fontSize, params.measure)
  return lines !== null && lines * fontSize * params.lineHeight <= params.height + 0.01
}

/**
 * Largest font size (in 0.5px steps, never below MIN_AUTO_FIT_SIZE) at which the text
 * fits the box, so long variable values shrink instead of being cut off.
 */
/** Height the wrapped text needs at a given size (react-pdf multiplies lineHeight by fontSize). */
export function measureTextHeight(
  params: Omit<FitParams, "height" | "fontSize">,
  fontSize: number
): number {
  const lines = countLines(params.text, params.width, fontSize, params.measure, true) ?? 1
  return lines * fontSize * params.lineHeight
}

export function fitFontSize(params: FitParams): number {
  if (!params.text.trim() || params.fontSize <= MIN_AUTO_FIT_SIZE || fits(params, params.fontSize)) {
    return params.fontSize
  }

  let low = MIN_AUTO_FIT_SIZE
  let high = params.fontSize

  while (high - low > 0.5) {
    const middle = Math.round(((low + high) / 2) * 2) / 2

    if (fits(params, middle)) {
      low = middle
    } else {
      high = middle
    }
  }

  return low
}
