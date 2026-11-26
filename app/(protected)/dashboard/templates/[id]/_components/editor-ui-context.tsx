"use client"

import { createContext, useContext } from "react"

export type AssetsTab = "images" | "fonts"

export type OpenAssetsOptions = {
  /** When set, the picked image replaces this element's source instead of adding a new element. */
  replaceImageId?: string
}

type EditorUi = {
  openAssets: (tab: AssetsTab, options?: OpenAssetsOptions) => void
}

/** Lets deep panel controls open the editor's assets sheet without prop drilling. */
export const EditorUiContext = createContext<EditorUi>({ openAssets: () => {} })

export function useEditorUi(): EditorUi {
  return useContext(EditorUiContext)
}
