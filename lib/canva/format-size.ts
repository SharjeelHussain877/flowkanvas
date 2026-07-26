export type CanvaDimensions = {
  width: number
  height: number
}

export function formatCanvaSize(dimensions: CanvaDimensions | null): string | null {
  if (!dimensions) {
    return null
  }

  const width = Math.round(dimensions.width)
  const height = Math.round(dimensions.height)

  return `${width.toLocaleString()} × ${height.toLocaleString()} px`
}

export function formatCanvaOrientation(dimensions: CanvaDimensions | null): string | null {
  if (!dimensions) {
    return null
  }

  if (dimensions.height > dimensions.width) {
    return "Portrait"
  }

  if (dimensions.width > dimensions.height) {
    return "Landscape"
  }

  return "Square"
}
