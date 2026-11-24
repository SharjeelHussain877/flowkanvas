import { useReducer } from "react"

import {
  alignElements,
  distributeElements,
  type AlignMode,
  type DistributeAxis,
} from "@/lib/templates/alignment"
import { findPage, getBounds, replacePage } from "@/lib/templates/design"
import { createEmptyPage, duplicateElements } from "@/lib/templates/element-defaults"
import { createElementId, createGroupId, createPageId } from "@/lib/templates/ids"
import type {
  BarcodeElement,
  DesignElement,
  DesignPage,
  EllipseElement,
  IconElement,
  ImageElement,
  LineElement,
  QrCodeElement,
  RectElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"
import { MAX_PAGES } from "@/schemas/templates/design"

const HISTORY_LIMIT = 100

type PatchOf<T> = Partial<Omit<T, "id" | "type">>

export type ElementPatch =
  | PatchOf<TextElement>
  | PatchOf<ImageElement>
  | PatchOf<RectElement>
  | PatchOf<EllipseElement>
  | PatchOf<LineElement>
  | PatchOf<IconElement>
  | PatchOf<QrCodeElement>
  | PatchOf<BarcodeElement>

export type ElementPatchEntry = { id: string; patch: ElementPatch }

export type DocumentPatch = Partial<Pick<TemplateDesign, "width" | "height">>
export type PagePatch = Partial<Pick<DesignPage, "background">>

export type ReorderDirection = "forward" | "backward" | "front" | "back"

export type EditorState = {
  design: TemplateDesign
  activePageId: string
  selectedIds: string[]
  past: TemplateDesign[]
  future: TemplateDesign[]
  /** Snapshot taken when a drag/typing session starts - pushed to history once at the end. */
  transaction: TemplateDesign | null
}

export type EditorAction =
  | { type: "select"; ids: string[] }
  | { type: "toggle-select"; id: string }
  | { type: "set-active-page"; id: string }
  | { type: "update-element"; id: string; patch: ElementPatch; transient?: boolean }
  | { type: "patch-elements"; patches: ElementPatchEntry[]; transient?: boolean }
  | { type: "translate-elements"; ids: string[]; dx: number; dy: number; transient?: boolean }
  | { type: "add-elements"; elements: DesignElement[] }
  | { type: "remove-elements"; ids: string[] }
  | { type: "duplicate-elements"; ids: string[] }
  | { type: "reorder-element"; id: string; direction: ReorderDirection }
  | { type: "align-elements"; ids: string[]; mode: AlignMode }
  | { type: "distribute-elements"; ids: string[]; axis: DistributeAxis }
  | { type: "group-elements"; ids: string[] }
  | { type: "ungroup-elements"; ids: string[] }
  | { type: "update-document"; patch: DocumentPatch }
  | { type: "update-page"; id: string; patch: PagePatch }
  | { type: "add-page" }
  | { type: "duplicate-page"; id: string }
  | { type: "remove-page"; id: string }
  | { type: "move-page"; id: string; direction: "left" | "right" }
  | { type: "begin-transaction" }
  | { type: "end-transaction" }
  | { type: "undo" }
  | { type: "redo" }

function pushHistory(state: EditorState, previous: TemplateDesign): EditorState {
  return {
    ...state,
    past: [...state.past.slice(-(HISTORY_LIMIT - 1)), previous],
    future: [],
  }
}

function commit(state: EditorState, design: TemplateDesign): EditorState {
  if (design === state.design) {
    return state
  }

  if (state.transaction) {
    return { ...state, design }
  }

  return { ...pushHistory(state, state.design), design }
}

function activePage(state: EditorState): DesignPage {
  return findPage(state.design, state.activePageId) ?? state.design.pages[0]
}

function updateActivePage(
  state: EditorState,
  update: (page: DesignPage) => DesignPage
): TemplateDesign {
  return replacePage(state.design, activePage(state).id, update)
}

function applyPatches(page: DesignPage, patches: ElementPatchEntry[]): DesignPage {
  const byId = new Map(patches.map((entry) => [entry.id, entry.patch]))

  if (byId.size === 0) {
    return page
  }

  return {
    ...page,
    elements: page.elements.map((element) => {
      const patch = byId.get(element.id)
      return patch ? ({ ...element, ...patch } as DesignElement) : element
    }),
  }
}

/** Keeps the selection pointing at elements that still exist on the active page. */
function reconcile(state: EditorState): EditorState {
  const page = findPage(state.design, state.activePageId) ?? state.design.pages[0]
  const ids = new Set(page.elements.map((element) => element.id))
  const selectedIds = state.selectedIds.filter((id) => ids.has(id))

  return {
    ...state,
    activePageId: page.id,
    selectedIds: selectedIds.length === state.selectedIds.length ? state.selectedIds : selectedIds,
  }
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select":
      return sameIds(state.selectedIds, action.ids) ? state : { ...state, selectedIds: action.ids }

    case "toggle-select":
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.id)
          ? state.selectedIds.filter((id) => id !== action.id)
          : [...state.selectedIds, action.id],
      }

    case "set-active-page":
      if (action.id === state.activePageId || !findPage(state.design, action.id)) {
        return state
      }

      return { ...state, activePageId: action.id, selectedIds: [] }

    case "update-element":
    case "patch-elements": {
      const patches =
        action.type === "update-element" ? [{ id: action.id, patch: action.patch }] : action.patches
      const design = updateActivePage(state, (page) => applyPatches(page, patches))

      if (action.transient) {
        return design === state.design ? state : { ...state, design }
      }

      return commit(state, design)
    }

    case "translate-elements": {
      const ids = new Set(action.ids)
      const design = updateActivePage(state, (page) => ({
        ...page,
        elements: page.elements.map((element) =>
          ids.has(element.id)
            ? { ...element, x: element.x + action.dx, y: element.y + action.dy }
            : element
        ),
      }))

      if (action.transient) {
        return design === state.design ? state : { ...state, design }
      }

      return commit(state, design)
    }

    case "add-elements": {
      if (action.elements.length === 0) {
        return state
      }

      const design = updateActivePage(state, (page) => ({
        ...page,
        elements: [...page.elements, ...action.elements],
      }))

      return { ...commit(state, design), selectedIds: action.elements.map((element) => element.id) }
    }

    case "remove-elements": {
      const ids = new Set(action.ids)
      const design = updateActivePage(state, (page) => {
        const elements = page.elements.filter((element) => !ids.has(element.id))
        return elements.length === page.elements.length ? page : { ...page, elements }
      })

      if (design === state.design) {
        return state
      }

      return reconcile(commit(state, design))
    }

    case "duplicate-elements": {
      const page = activePage(state)
      const sources = page.elements.filter((element) => action.ids.includes(element.id))

      if (sources.length === 0) {
        return state
      }

      const copies = duplicateElements(sources)
      const design = updateActivePage(state, (current) => ({
        ...current,
        elements: [...current.elements, ...copies],
      }))

      return { ...commit(state, design), selectedIds: copies.map((element) => element.id) }
    }

    case "reorder-element": {
      const design = updateActivePage(state, (page) => {
        const index = page.elements.findIndex((element) => element.id === action.id)

        if (index < 0) {
          return page
        }

        const elements = [...page.elements]
        const [item] = elements.splice(index, 1)
        const target =
          action.direction === "forward"
            ? Math.min(index + 1, elements.length)
            : action.direction === "backward"
              ? Math.max(index - 1, 0)
              : action.direction === "front"
                ? elements.length
                : 0

        elements.splice(target, 0, item)
        return { ...page, elements }
      })

      return commit(state, design)
    }

    case "align-elements": {
      const page = activePage(state)
      const targets = page.elements.filter((element) => action.ids.includes(element.id))

      if (targets.length === 0) {
        return state
      }

      const reference =
        targets.length === 1
          ? { x: 0, y: 0, width: state.design.width, height: state.design.height }
          : getBounds(targets)

      if (!reference) {
        return state
      }

      const patches = alignElements(targets, action.mode, reference)
      return commit(state, updateActivePage(state, (current) => applyPatches(current, patches)))
    }

    case "distribute-elements": {
      const page = activePage(state)
      const targets = page.elements.filter((element) => action.ids.includes(element.id))
      const patches = distributeElements(targets, action.axis)

      if (patches.length === 0) {
        return state
      }

      return commit(state, updateActivePage(state, (current) => applyPatches(current, patches)))
    }

    case "group-elements": {
      if (action.ids.length < 2) {
        return state
      }

      const groupId = createGroupId()
      const patches = action.ids.map((id) => ({ id, patch: { group: groupId } }))
      return commit(state, updateActivePage(state, (page) => applyPatches(page, patches)))
    }

    case "ungroup-elements": {
      const patches = action.ids.map((id) => ({ id, patch: { group: null } }))
      return commit(state, updateActivePage(state, (page) => applyPatches(page, patches)))
    }

    case "update-document":
      return commit(state, { ...state.design, ...action.patch })

    case "update-page":
      return commit(
        state,
        replacePage(state.design, action.id, (page) => ({ ...page, ...action.patch }))
      )

    case "add-page": {
      if (state.design.pages.length >= MAX_PAGES) {
        return state
      }

      const page = createEmptyPage(activePage(state).background)
      const index = state.design.pages.findIndex((item) => item.id === state.activePageId)
      const pages = [...state.design.pages]
      pages.splice(index + 1, 0, page)

      return { ...commit(state, { ...state.design, pages }), activePageId: page.id, selectedIds: [] }
    }

    case "duplicate-page": {
      const source = findPage(state.design, action.id)

      if (!source || state.design.pages.length >= MAX_PAGES) {
        return state
      }

      const copy: DesignPage = {
        id: createPageId(),
        background: source.background,
        elements: source.elements.map((element) => ({ ...element, id: createElementId() })),
      }
      const index = state.design.pages.indexOf(source)
      const pages = [...state.design.pages]
      pages.splice(index + 1, 0, copy)

      return { ...commit(state, { ...state.design, pages }), activePageId: copy.id, selectedIds: [] }
    }

    case "remove-page": {
      if (state.design.pages.length <= 1) {
        return state
      }

      const index = state.design.pages.findIndex((page) => page.id === action.id)

      if (index < 0) {
        return state
      }

      const pages = state.design.pages.filter((page) => page.id !== action.id)
      const nextActive =
        state.activePageId === action.id
          ? (pages[Math.min(index, pages.length - 1)]?.id ?? pages[0].id)
          : state.activePageId

      return {
        ...commit(state, { ...state.design, pages }),
        activePageId: nextActive,
        selectedIds: state.activePageId === action.id ? [] : state.selectedIds,
      }
    }

    case "move-page": {
      const index = state.design.pages.findIndex((page) => page.id === action.id)
      const target = action.direction === "left" ? index - 1 : index + 1

      if (index < 0 || target < 0 || target >= state.design.pages.length) {
        return state
      }

      const pages = [...state.design.pages]
      const [page] = pages.splice(index, 1)
      pages.splice(target, 0, page)

      return commit(state, { ...state.design, pages })
    }

    case "begin-transaction":
      return state.transaction ? state : { ...state, transaction: state.design }

    case "end-transaction": {
      if (!state.transaction) {
        return state
      }

      const snapshot = state.transaction
      const next = { ...state, transaction: null }

      return snapshot === state.design ? next : pushHistory(next, snapshot)
    }

    case "undo": {
      const previous = state.past[state.past.length - 1]

      if (!previous) {
        return state
      }

      return reconcile({
        ...state,
        design: previous,
        past: state.past.slice(0, -1),
        future: [state.design, ...state.future],
        transaction: null,
      })
    }

    case "redo": {
      const [next, ...future] = state.future

      if (!next) {
        return state
      }

      return reconcile({
        ...state,
        design: next,
        past: [...state.past, state.design],
        future,
        transaction: null,
      })
    }

    default:
      return state
  }
}

export function useEditorState(initialDesign: TemplateDesign) {
  return useReducer(editorReducer, initialDesign, (design): EditorState => ({
    design,
    activePageId: design.pages[0].id,
    selectedIds: [],
    past: [],
    future: [],
    transaction: null,
  }))
}
