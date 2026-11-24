import { useReducer } from "react"

import { duplicateElement } from "@/lib/templates/element-defaults"
import type {
  DesignElement,
  ImageElement,
  RectElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"

const HISTORY_LIMIT = 100

export type ElementPatch =
  | Partial<Omit<TextElement, "id" | "type">>
  | Partial<Omit<ImageElement, "id" | "type">>
  | Partial<Omit<RectElement, "id" | "type">>

export type PagePatch = Partial<Pick<TemplateDesign, "width" | "height" | "background">>

export type ReorderDirection = "forward" | "backward" | "front" | "back"

export type EditorState = {
  design: TemplateDesign
  selectedId: string | null
  past: TemplateDesign[]
  future: TemplateDesign[]
  /** Snapshot taken when a drag/typing session starts - pushed to history once at the end. */
  transaction: TemplateDesign | null
}

export type EditorAction =
  | { type: "select"; id: string | null }
  | { type: "update-element"; id: string; patch: ElementPatch; transient?: boolean }
  | { type: "add-element"; element: DesignElement }
  | { type: "remove-element"; id: string }
  | { type: "duplicate-element"; id: string }
  | { type: "reorder-element"; id: string; direction: ReorderDirection }
  | { type: "update-page"; patch: PagePatch }
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

function withElements(design: TemplateDesign, elements: DesignElement[]): TemplateDesign {
  return { ...design, elements }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select":
      return state.selectedId === action.id ? state : { ...state, selectedId: action.id }

    case "update-element": {
      const elements = state.design.elements.map((element) =>
        element.id === action.id ? ({ ...element, ...action.patch } as DesignElement) : element
      )
      const design = withElements(state.design, elements)

      if (action.transient) {
        return { ...state, design }
      }

      return commit(state, design)
    }

    case "add-element": {
      const design = withElements(state.design, [...state.design.elements, action.element])
      return { ...commit(state, design), selectedId: action.element.id }
    }

    case "remove-element": {
      const elements = state.design.elements.filter((element) => element.id !== action.id)

      if (elements.length === state.design.elements.length) {
        return state
      }

      return {
        ...commit(state, withElements(state.design, elements)),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }
    }

    case "duplicate-element": {
      const source = state.design.elements.find((element) => element.id === action.id)

      if (!source) {
        return state
      }

      const copy = duplicateElement(source)
      const index = state.design.elements.indexOf(source)
      const elements = [...state.design.elements]
      elements.splice(index + 1, 0, copy)

      return { ...commit(state, withElements(state.design, elements)), selectedId: copy.id }
    }

    case "reorder-element": {
      const index = state.design.elements.findIndex((element) => element.id === action.id)

      if (index < 0) {
        return state
      }

      const elements = [...state.design.elements]
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
      return commit(state, withElements(state.design, elements))
    }

    case "update-page":
      return commit(state, { ...state.design, ...action.patch })

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

      return {
        ...state,
        design: previous,
        past: state.past.slice(0, -1),
        future: [state.design, ...state.future],
        transaction: null,
        selectedId: previous.elements.some((element) => element.id === state.selectedId)
          ? state.selectedId
          : null,
      }
    }

    case "redo": {
      const [next, ...future] = state.future

      if (!next) {
        return state
      }

      return {
        ...state,
        design: next,
        past: [...state.past, state.design],
        future,
        transaction: null,
        selectedId: next.elements.some((element) => element.id === state.selectedId)
          ? state.selectedId
          : null,
      }
    }

    default:
      return state
  }
}

export function useEditorState(initialDesign: TemplateDesign) {
  return useReducer(editorReducer, initialDesign, (design): EditorState => ({
    design,
    selectedId: null,
    past: [],
    future: [],
    transaction: null,
  }))
}
