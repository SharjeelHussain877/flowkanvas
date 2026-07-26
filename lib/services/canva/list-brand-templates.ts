import { canvaApiGet } from "@/lib/canva/api-client"
import type { CanvaListBrandTemplatesResponse } from "@/lib/canva/types"

type ListCanvaBrandTemplatesOptions = {
  limit?: number
  sortBy?: "modified_descending" | "modified_ascending" | "title_descending" | "title_ascending" | "relevance"
  ownership?: "any" | "owned" | "shared"
}

export async function listCanvaBrandTemplates(
  userId: string,
  options: ListCanvaBrandTemplatesOptions = {}
) {
  const response = await canvaApiGet<CanvaListBrandTemplatesResponse>(
    userId,
    "/brand-templates",
    {
      limit: options.limit ?? 100,
      sort_by: options.sortBy ?? "modified_descending",
      ownership: options.ownership ?? "any",
    }
  )

  return response.items
}
