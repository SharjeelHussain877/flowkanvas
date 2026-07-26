import { canvaApiGet } from "@/lib/canva/api-client"
import type { CanvaListDesignsResponse } from "@/lib/canva/types"

type ListCanvaDesignsOptions = {
  limit?: number
  sortBy?: "modified_descending" | "modified_ascending" | "title_descending" | "title_ascending" | "relevance"
  ownership?: "any" | "owned" | "shared"
}

export async function listCanvaDesigns(
  userId: string,
  options: ListCanvaDesignsOptions = {}
) {
  const response = await canvaApiGet<CanvaListDesignsResponse>(userId, "/designs", {
    limit: options.limit ?? 100,
    sort_by: options.sortBy ?? "modified_descending",
    ownership: options.ownership ?? "any",
  })

  return response.items
}
