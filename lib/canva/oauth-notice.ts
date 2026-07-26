import { formatCanvaScopeMismatchMessage } from "@/lib/canva/scopes"

export type CanvaOAuthSearchParams = {
  canva?: string
  message?: string
}

export type CanvaConnectFlash = {
  type: "success" | "error"
  message: string
}

export function getCanvaConnectFlash(
  searchParams: CanvaOAuthSearchParams
): CanvaConnectFlash | null {
  if (searchParams.canva === "connected") {
    return {
      type: "success",
      message: "Canva connected successfully.",
    }
  }

  if (searchParams.canva === "error") {
    return {
      type: "error",
      message: formatCanvaScopeMismatchMessage(
        searchParams.message ?? "Could not connect Canva."
      ),
    }
  }

  return null
}
