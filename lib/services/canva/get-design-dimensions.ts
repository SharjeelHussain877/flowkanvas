import { canvaApiGet } from "@/lib/canva/api-client"
import type { CanvaDimensions } from "@/lib/canva/format-size"

type CanvaDesignPage = {
  index: number
  dimensions?: CanvaDimensions
}

type CanvaGetDesignPagesResponse = {
  items: CanvaDesignPage[]
}

export async function getCanvaDesignDimensions(
  userId: string,
  designId: string
): Promise<CanvaDimensions | null> {
  const response = await canvaApiGet<CanvaGetDesignPagesResponse>(
    userId,
    `/designs/${designId}/pages`,
    {
      offset: 1,
      limit: 1,
    }
  )

  const firstPage = response.items[0]
  return firstPage?.dimensions ?? null
}

async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  concurrency = 6
): Promise<R[]> {
  const results: R[] = []

  for (let index = 0; index < items.length; index += concurrency) {
    const batch = items.slice(index, index + concurrency)
    const batchResults = await Promise.all(batch.map(mapper))
    results.push(...batchResults)
  }

  return results
}

export async function getCanvaDesignDimensionsMap(
  userId: string,
  designIds: string[]
): Promise<Map<string, CanvaDimensions | null>> {
  const entries = await mapWithConcurrency(designIds, async (designId) => {
    try {
      const dimensions = await getCanvaDesignDimensions(userId, designId)
      return [designId, dimensions] as const
    } catch {
      return [designId, null] as const
    }
  })

  return new Map(entries)
}
