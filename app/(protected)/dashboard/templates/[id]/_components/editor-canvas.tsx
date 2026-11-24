"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"

import type { ElementPatch } from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import {
  DesignElementView,
  DesignPage,
  textStyle,
} from "@/components/templates/design-renderer"
import type {
  DesignElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"
import { cn } from "@/lib/utils"

const MIN_SIZE = 8
const FIT_PADDING = 64
const MIN_ZOOM = 0.05
const MAX_ZOOM = 4

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

const HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"]

const HANDLE_CURSORS: Record<ResizeHandle, CSSProperties["cursor"]> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
}

type DragSession = {
  kind: "move" | "resize"
  id: string
  handle?: ResizeHandle
  startX: number
  startY: number
  origin: { x: number; y: number; width: number; height: number }
  scale: number
}

export type EditorCanvasProps = {
  design: TemplateDesign
  selectedId: string | null
  /** Explicit zoom, or null to fit the page in view. */
  zoom: number | null
  onEffectiveZoom: (zoom: number) => void
  editingId: string | null
  onEditingChange: (id: string | null) => void
  onSelect: (id: string | null) => void
  onUpdateElement: (id: string, patch: ElementPatch, transient?: boolean) => void
  onBeginTransaction: () => void
  onEndTransaction: () => void
}

export function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

function computeResize(session: DragSession, dx: number, dy: number) {
  const { origin, handle } = session
  let { x, y, width, height } = origin

  if (handle?.includes("e")) {
    width = Math.max(MIN_SIZE, origin.width + dx)
  }

  if (handle?.includes("w")) {
    width = Math.max(MIN_SIZE, origin.width - dx)
    x = origin.x + (origin.width - width)
  }

  if (handle?.includes("s")) {
    height = Math.max(MIN_SIZE, origin.height + dy)
  }

  if (handle?.includes("n")) {
    height = Math.max(MIN_SIZE, origin.height - dy)
    y = origin.y + (origin.height - height)
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  }
}

function handlePosition(handle: ResizeHandle, size: number): CSSProperties {
  const offset = -size / 2
  const style: CSSProperties = { position: "absolute", width: size, height: size }

  if (handle.includes("n")) style.top = offset
  if (handle.includes("s")) style.bottom = offset
  if (handle.includes("w")) style.left = offset
  if (handle.includes("e")) style.right = offset

  if (handle === "n" || handle === "s") {
    style.left = `calc(50% - ${size / 2}px)`
  }

  if (handle === "e" || handle === "w") {
    style.top = `calc(50% - ${size / 2}px)`
  }

  return style
}

type EditableTextProps = {
  element: TextElement
  onCommit: (text: string) => void
  onDone: () => void
}

function EditableText({ element, onCommit, onDone }: EditableTextProps) {
  const [value, setValue] = useState(element.text)
  const committed = useRef(false)

  function finish() {
    if (committed.current) {
      return
    }

    committed.current = true

    if (value !== element.text) {
      onCommit(value)
    }

    onDone()
  }

  return (
    <textarea
      autoFocus
      value={value}
      spellCheck={false}
      onChange={(event) => setValue(event.target.value)}
      onBlur={finish}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation()

        if (event.key === "Escape" || ((event.metaKey || event.ctrlKey) && event.key === "Enter")) {
          event.preventDefault()
          finish()
        }
      }}
      onFocus={(event) => event.currentTarget.select()}
      style={{
        ...textStyle(element),
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        padding: 0,
        border: "none",
        outline: "none",
        resize: "none",
        background: "transparent",
        overflow: "hidden",
      }}
    />
  )
}

export function EditorCanvas({
  design,
  selectedId,
  zoom,
  onEffectiveZoom,
  editingId,
  onEditingChange,
  onSelect,
  onUpdateElement,
  onBeginTransaction,
  onEndTransaction,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fitZoom, setFitZoom] = useState(1)
  const sessionRef = useRef<DragSession | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const callbacksRef = useRef({ onUpdateElement, onEndTransaction })

  useEffect(() => {
    callbacksRef.current = { onUpdateElement, onEndTransaction }
  }, [onUpdateElement, onEndTransaction])

  const effectiveZoom = clampZoom(zoom ?? fitZoom)

  useLayoutEffect(() => {
    const node = containerRef.current

    if (!node) {
      return
    }

    const update = () => {
      const rect = node.getBoundingClientRect()
      const next = Math.min(
        (rect.width - FIT_PADDING) / design.width,
        (rect.height - FIT_PADDING) / design.height
      )
      setFitZoom(Number.isFinite(next) && next > 0 ? clampZoom(next) : 1)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => observer.disconnect()
  }, [design.width, design.height])

  useEffect(() => {
    onEffectiveZoom(effectiveZoom)
  }, [effectiveZoom, onEffectiveZoom])

  useEffect(() => () => cleanupRef.current?.(), [])

  function beginSession(
    event: ReactPointerEvent,
    element: DesignElement,
    kind: DragSession["kind"],
    handle?: ResizeHandle
  ) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (editingId && editingId !== element.id) {
      onEditingChange(null)
    }

    onSelect(element.id)

    sessionRef.current = {
      kind,
      id: element.id,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: element.x, y: element.y, width: element.width, height: element.height },
      scale: effectiveZoom,
    }

    onBeginTransaction()

    const onMove = (moveEvent: PointerEvent) => {
      const session = sessionRef.current

      if (!session) {
        return
      }

      const dx = (moveEvent.clientX - session.startX) / session.scale
      const dy = (moveEvent.clientY - session.startY) / session.scale

      if (session.kind === "move") {
        callbacksRef.current.onUpdateElement(
          session.id,
          {
            x: Math.round(session.origin.x + dx),
            y: Math.round(session.origin.y + dy),
          },
          true
        )
        return
      }

      callbacksRef.current.onUpdateElement(session.id, computeResize(session, dx, dy), true)
    }

    const onUp = () => cleanupRef.current?.()

    cleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      cleanupRef.current = null

      if (sessionRef.current) {
        sessionRef.current = null
        callbacksRef.current.onEndTransaction()
      }
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
  }

  const handleSize = 10 / effectiveZoom
  const outlineWidth = 1.5 / effectiveZoom

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle,var(--brand-slate)_0.6px,transparent_0.6px)] bg-[length:16px_16px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onSelect(null)
          onEditingChange(null)
        }
      }}
    >
      <div className="flex min-h-full min-w-max p-8">
        <div
          className="m-auto"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              onSelect(null)
              onEditingChange(null)
            }
          }}
        >
          <DesignPage
            design={design}
            scale={effectiveZoom}
            className="shadow-lg ring-1 ring-black/5"
            onBackgroundPointerDown={() => {
              onSelect(null)
              onEditingChange(null)
            }}
            renderElement={(element) => {
              const isSelected = element.id === selectedId
              const isEditing = element.id === editingId && element.type === "text"

              return (
                <div
                  key={element.id}
                  data-element-id={element.id}
                  role="presentation"
                  className={cn(
                    "absolute select-none",
                    !isSelected && "hover:[box-shadow:0_0_0_1px_var(--brand-teal)]"
                  )}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    cursor: isEditing ? "text" : "move",
                    touchAction: "none",
                    boxShadow: isSelected
                      ? `0 0 0 ${outlineWidth}px var(--brand-teal)`
                      : undefined,
                  }}
                  onPointerDown={(event) => {
                    if (!isEditing) {
                      beginSession(event, element, "move")
                    }
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation()

                    if (element.type === "text") {
                      onEditingChange(element.id)
                    }
                  }}
                >
                  {isEditing ? (
                    <EditableText
                      element={element as TextElement}
                      onCommit={(text) => onUpdateElement(element.id, { text })}
                      onDone={() => onEditingChange(null)}
                    />
                  ) : (
                    <div className="pointer-events-none absolute inset-0">
                      <DesignElementView element={element} fill highlightVariables />
                    </div>
                  )}

                  {isSelected && !isEditing
                    ? HANDLES.map((handle) => (
                        <div
                          key={handle}
                          role="presentation"
                          aria-label={`Resize ${handle}`}
                          style={{
                            ...handlePosition(handle, handleSize),
                            cursor: HANDLE_CURSORS[handle],
                            borderWidth: outlineWidth,
                            borderRadius: handleSize / 4,
                          }}
                          className="z-10 border-solid border-brand-teal bg-white"
                          onPointerDown={(event) => beginSession(event, element, "resize", handle)}
                        />
                      ))
                    : null}
                </div>
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}
