"use client"

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"
import type { AssetsListResponse } from "@/schemas/assets/asset"

/** The user's uploaded images (asset library). */
export function useAssetsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.assets.list(),
    queryFn: () => apiClient<AssetsListResponse>("/api/assets"),
    select: (response) => response.data,
    enabled,
    staleTime: 60_000,
  })
}
