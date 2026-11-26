import { getSupabaseUrl } from "@/lib/env"

/** Public URL of an object in a public storage bucket (no network call). */
export function storagePublicUrl(bucket: string, objectPath: string): string {
  const encoded = objectPath.split("/").map(encodeURIComponent).join("/")
  return `${getSupabaseUrl().replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encoded}`
}
