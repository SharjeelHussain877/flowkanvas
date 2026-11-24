export type PageSizePreset = {
  id: string
  label: string
  width: number
  height: number
  hint: string
}

/** Sizes are in points (1pt = 1/72in), the unit the PDF uses - shown as px in the editor. */
export const pageSizePresets: PageSizePreset[] = [
  { id: "a4-portrait", label: "A4 portrait", width: 595, height: 842, hint: "210 × 297 mm" },
  { id: "a4-landscape", label: "A4 landscape", width: 842, height: 595, hint: "297 × 210 mm" },
  { id: "letter-portrait", label: "US Letter", width: 612, height: 792, hint: "8.5 × 11 in" },
  { id: "letter-landscape", label: "US Letter landscape", width: 792, height: 612, hint: "11 × 8.5 in" },
  { id: "a5", label: "A5", width: 420, height: 595, hint: "148 × 210 mm" },
  { id: "certificate", label: "Certificate", width: 842, height: 595, hint: "A4 landscape" },
  { id: "business-card", label: "Business card", width: 252, height: 144, hint: "3.5 × 2 in" },
  { id: "square", label: "Square", width: 720, height: 720, hint: "Social post" },
  { id: "label", label: "Shipping label", width: 288, height: 432, hint: "4 × 6 in" },
]

export const CUSTOM_PRESET_ID = "custom"
export const defaultPageSizePreset = pageSizePresets[0]

export function findPresetBySize(width: number, height: number) {
  return pageSizePresets.find(
    (preset) => preset.width === width && preset.height === height
  )
}
