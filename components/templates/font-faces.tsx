"use client"

import { useFontsQuery } from "@/lib/query/hooks/use-fonts"
import { buildFontFaceCss } from "@/lib/templates/fonts"

/** Loads the user's uploaded fonts into the page so previews match the PDF. */
export function FontFaces() {
  const fontsQuery = useFontsQuery()
  const css = fontsQuery.data ? buildFontFaceCss(fontsQuery.data) : ""

  if (!css) {
    return null
  }

  return <style data-template-fonts>{css}</style>
}
