"use client"

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"
import type { FontsListResponse } from "@/schemas/fonts/font"

/** The user's uploaded fonts; shared by the editor, previews and the fonts dialog. */
export function useFontsQuery() {
  return useQuery({
    queryKey: queryKeys.fonts.list(),
    queryFn: () => apiClient<FontsListResponse>("/api/fonts"),
    select: (response) => response.data,
    staleTime: 60_000,
  })
}
