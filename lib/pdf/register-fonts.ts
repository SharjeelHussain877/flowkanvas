import { Font } from "@react-pdf/renderer"

import { toCustomFontFamily } from "@/lib/templates/fonts"
import type { FontRecord } from "@/schemas/fonts/font"

/** react-pdf appends sources on every register call, so each file is registered once per process. */
const registeredSources = new Set<string>()

/** Registers uploaded fonts with react-pdf and returns the family ids now available. */
export function registerCustomFonts(fonts: FontRecord[]): Set<string> {
  const families = new Set<string>()

  for (const font of fonts) {
    const family = toCustomFontFamily(font.name)
    families.add(family)

    const key = `${font.id}|${font.url}`

    if (registeredSources.has(key)) {
      continue
    }

    Font.register({
      family,
      src: font.url,
      fontWeight: font.weight,
      fontStyle: font.style,
    })

    registeredSources.add(key)
  }

  return families
}
