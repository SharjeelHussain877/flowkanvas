export const MAX_ASSET_BYTES = 5 * 1024 * 1024

/** An image in the user's asset library (storage bucket `template-assets`). */
export type AssetRecord = {
  /** Object file name inside the user's library folder; used for delete. */
  id: string
  /** Original file name shown in the library. */
  name: string
  url: string
  size: number
  contentType: string
  created_at: string
}

export type AssetsListResponse = {
  data: AssetRecord[]
}

export type AssetApiResponse = {
  data: AssetRecord
}

export type DeleteAssetApiResponse = {
  data: { id: string }
}
