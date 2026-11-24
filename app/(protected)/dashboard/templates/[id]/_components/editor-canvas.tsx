"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"

import type {
  ElementPatch,
  ElementPatchEntry,
} from "@/app/(protected)/dashboard/templates/[id]/_components/use-editor-state"
import {
  ConditionBadge,
  DesignElementView,
  DesignPage,
  textStyle,
} from "@/components/templates/design-renderer"
import {
  boxesIntersect,
  expandGroupSelection,
  getBounds,
  type Box,
} from "@/lib/templates/design"
import {
  collectSnapTargets,
  snapMove,
  snapResize,
  type SnapGuide,
  type SnapTargets,
} from "@/lib/templates/snap"
import type {
  DesignElement,
  DesignPage as DesignPageData,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"
import { cn } from "@/lib/utils"

const MIN_SIZE = 8
const FIT_PADDING = 64
const MIN_ZOOM = 0.05
const MAX_ZOOM = 4
const SNAP_THRESHOLD_PX = 6
const DRAG_THRESHOLD_PX = 3

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
  ids: string[]
  handle?: ResizeHandle
  startX: number
  startY: number
  /** Bounding box of the selection when the drag started. */
  origin: Box
  /** Each element's box when the drag started. */
  originElements: Map<string, Box>
  scale: number
  targets: SnapTargets
  moved: boolean
}

type MarqueeSession = {
  startX: number
  startY: number
  additive: boolean
}

export type SelectOptions = { toggle?: boolean }

export type EditorCanvasProps = {
  design: TemplateDesign
  page: DesignPageData
  selectedIds: string[]
  /** Explicit zoom, or null to fit the page in view. */
  zoom: number | null
  onEffectiveZoom: (zoom: number) => void
  editingId: string | null
  onEditingChange: (id: string | null) => void
  onSelect: (ids: string[], options?: SelectOptions) => void
  onUpdateElement: (id: string, patch: ElementPatch, transient?: boolean) => void
  onPatchElements: (patches: ElementPatchEntry[], transient?: boolean) => void
  onBeginTransaction: () => void
  onEndTransaction: () => void
}

export function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

function resizeBox(origin: Box, handle: ResizeHandle, dx: number, dy: number): Box {
  let { x, y, width, height } = origin

  if (handle.includes("e")) {
    width = Math.max(MIN_SIZE, origin.width + dx)
  }

  if (handle.includes("w")) {
    width = Math.max(MIN_SIZE, origin.width - dx)
    x = origin.x + (origin.width - width)
  }

  if (handle.includes("s")) {
    height = Math.max(MIN_SIZE, origin.height + dy)
  }

  if (handle.includes("n")) {
    height = Math.max(MIN_SIZE, origin.height - dy)
    y = origin.y + (origin.height - height)
  }

  return { x, y, width, height }
}

function roundBox(box: Box): Box {
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
  }
}

/** Maps every element of a selection into the resized bounding box, keeping relative placement. */
function scaleElementsInto(origin: Box, next: Box, originElements: Map<string, Box>): ElementPatchEntry[] {
  const sx = origin.width > 0 ? next.width / origin.width : 1
  const sy = origin.height > 0 ? next.height / origin.height : 1

  return [...originElements.entries()].map(([id, box]) => ({
    id,
    patch: roundBox({
      x: next.x + (box.x - origin.x) * sx,
      y: next.y + (box.y - origin.y) * sy,
      width: Math.max(1, box.width * sx),
      height: Math.max(1, box.height * sy),
    }),
  }))
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
  page,
  selectedIds,
  zoom,
  onEffectiveZoom,
  editingId,
  onEditingChange,
  onSelect,
  onUpdateElement,
  onPatchElements,
  onBeginTransaction,
  onEndTransaction,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [fitZoom, setFitZoom] = useState(1)
  const [guides, setGuides] = useState<SnapGuide[]>([])
  const [marquee, setMarquee] = useState<Box | null>(null)
  const sessionRef = useRef<DragSession | null>(null)
  const marqueeRef = useRef<MarqueeSession | null>(null)
  const marqueeBoxRef = useRef<Box | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const callbacksRef = useRef({ onPatchElements, onEndTransaction, onSelect })

  useEffect(() => {
    callbacksRef.current = { onPatchElements, onEndTransaction, onSelect }
  }, [onPatchElements, onEndTransaction, onSelect])

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

  const selectedElements = page.elements.filter((element) => selectedIds.includes(element.id))
  const selectionBounds = getBounds(selectedElements)
  const isMultiSelection = selectedElements.length > 1

  /** Returns the ids a drag should act on, or null when the click only changed the selection. */
  function selectElement(element: DesignElement, event: ReactPointerEvent): string[] | null {
    const groupIds = expandGroupSelection(page, [element.id])

    if (event.shiftKey) {
      const alreadySelected = groupIds.every((id) => selectedIds.includes(id))

      if (alreadySelected) {
        onSelect(selectedIds.filter((id) => !groupIds.includes(id)))
        return null
      }

      const ids = [...selectedIds, ...groupIds.filter((id) => !selectedIds.includes(id))]
      onSelect(ids)
      return ids
    }

    if (selectedIds.includes(element.id)) {
      return selectedIds
    }

    onSelect(groupIds)
    return groupIds
  }

  function attachWindowListeners(
    onMove: (event: PointerEvent) => void,
    onUp: (event: Event) => void
  ) {
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      cleanupRef.current = null
    }

    cleanupRef.current = cleanup
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)

    return cleanup
  }

  function beginSession(
    event: ReactPointerEvent,
    element: DesignElement | null,
    kind: DragSession["kind"],
    handle?: ResizeHandle
  ) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (editingId && editingId !== element?.id) {
      onEditingChange(null)
    }

    let ids = selectedIds

    if (element) {
      const next = selectElement(element, event)

      if (!next) {
        return
      }

      ids = next
    }

    const elements = page.elements.filter((item) => ids.includes(item.id))
    const origin = getBounds(elements)

    if (!origin || elements.length === 0) {
      return
    }

    sessionRef.current = {
      kind,
      ids,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      origin,
      originElements: new Map(
        elements.map((item) => [
          item.id,
          { x: item.x, y: item.y, width: item.width, height: item.height },
        ])
      ),
      scale: effectiveZoom,
      targets: collectSnapTargets(page, new Set(ids), design.width, design.height),
      moved: false,
    }

    onBeginTransaction()

    const onMove = (moveEvent: PointerEvent) => {
      const session = sessionRef.current

      if (!session) {
        return
      }

      const dx = (moveEvent.clientX - session.startX) / session.scale
      const dy = (moveEvent.clientY - session.startY) / session.scale

      if (!session.moved && Math.hypot(dx * session.scale, dy * session.scale) < DRAG_THRESHOLD_PX) {
        return
      }

      session.moved = true
      const threshold = moveEvent.altKey ? 0 : SNAP_THRESHOLD_PX / session.scale

      if (session.kind === "move") {
        const moved = { ...session.origin, x: session.origin.x + dx, y: session.origin.y + dy }
        const snapped = threshold > 0 ? snapMove(moved, session.targets, threshold) : { ...moved, guides: [] }
        const shiftX = Math.round(snapped.x) - session.origin.x
        const shiftY = Math.round(snapped.y) - session.origin.y

        setGuides(snapped.guides)
        callbacksRef.current.onPatchElements(
          [...session.originElements.entries()].map(([id, box]) => ({
            id,
            patch: { x: box.x + shiftX, y: box.y + shiftY },
          })),
          true
        )
        return
      }

      const resized = resizeBox(session.origin, session.handle ?? "se", dx, dy)
      const snapped =
        threshold > 0
          ? snapResize(resized, session.handle ?? "se", session.targets, threshold, MIN_SIZE)
          : { ...resized, guides: [] }

      setGuides(snapped.guides)

      if (session.ids.length === 1) {
        callbacksRef.current.onPatchElements(
          [{ id: session.ids[0], patch: roundBox(snapped) }],
          true
        )
        return
      }

      callbacksRef.current.onPatchElements(
        scaleElementsInto(session.origin, snapped, session.originElements),
        true
      )
    }

    const onUp = () => {
      cleanup()
      setGuides([])

      if (sessionRef.current) {
        sessionRef.current = null
        callbacksRef.current.onEndTransaction()
      }
    }

    const cleanup = attachWindowListeners(onMove, onUp)
  }

  function beginMarquee(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return
    }

    const pageNode = pageRef.current

    if (!pageNode) {
      return
    }

    onEditingChange(null)

    const rect = pageNode.getBoundingClientRect()
    const scale = effectiveZoom
    const startX = (event.clientX - rect.left) / scale
    const startY = (event.clientY - rect.top) / scale

    marqueeRef.current = { startX, startY, additive: event.shiftKey }

    if (!event.shiftKey) {
      onSelect([])
    }

    let moved = false

    const onMove = (moveEvent: PointerEvent) => {
      const session = marqueeRef.current

      if (!session) {
        return
      }

      const currentX = (moveEvent.clientX - rect.left) / scale
      const currentY = (moveEvent.clientY - rect.top) / scale

      if (!moved && Math.hypot(moveEvent.clientX - event.clientX, moveEvent.clientY - event.clientY) < DRAG_THRESHOLD_PX) {
        return
      }

      moved = true
      const box = {
        x: Math.min(session.startX, currentX),
        y: Math.min(session.startY, currentY),
        width: Math.abs(currentX - session.startX),
        height: Math.abs(currentY - session.startY),
      }
      marqueeBoxRef.current = box
      setMarquee(box)
    }

    const onUp = (upEvent: Event) => {
      cleanup()
      const session = marqueeRef.current
      const box = marqueeBoxRef.current
      marqueeRef.current = null
      marqueeBoxRef.current = null
      setMarquee(null)

      if (box && session && moved) {
        const hits = page.elements
          .filter((element) => boxesIntersect(box, element))
          .map((element) => element.id)
        const expanded = expandGroupSelection(page, hits)
        const additive =
          session.additive || (upEvent instanceof PointerEvent && upEvent.shiftKey)

        callbacksRef.current.onSelect(
          additive ? [...new Set([...selectedIds, ...expanded])] : expanded
        )
      }
    }

    const cleanup = attachWindowListeners(onMove, onUp)
  }

  const handleSize = 10 / effectiveZoom
  const outlineWidth = 1.5 / effectiveZoom
  const guideWidth = 1 / effectiveZoom

  const renderHandles = (target: DesignElement | Box | null, forBounds: boolean) => {
    if (!target) {
      return null
    }

    return HANDLES.map((handle) => (
      <div
        key={handle}
        role="presentation"
        aria-label={`Resize ${handle}`}
        style={{
          ...handlePosition(handle, handleSize),
          cursor: HANDLE_CURSORS[handle],
          borderWidth: outlineWidth,
          borderRadius: handleSize / 4,
          pointerEvents: "auto",
        }}
        className="z-10 border-solid border-brand-teal bg-white"
        onPointerDown={(event) =>
          beginSession(event, forBounds ? null : (target as DesignElement), "resize", handle)
        }
      />
    ))
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-0 min-w-0 flex-1 overflow-auto bg-[radial-gradient(circle,var(--brand-slate)_0.6px,transparent_0.6px)] bg-[length:16px_16px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onSelect([])
          onEditingChange(null)
        }
      }}
    >
      <div className="flex min-h-full min-w-max p-8">
        <div
          className="m-auto"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              onSelect([])
              onEditingChange(null)
            }
          }}
        >
          <div ref={pageRef}>
            <DesignPage
              design={design}
              page={page}
              scale={effectiveZoom}
              className="shadow-lg ring-1 ring-black/5"
              onBackgroundPointerDown={beginMarquee}
              renderElement={(element) => {
                const isSelected = selectedIds.includes(element.id)
                const isEditing = element.id === editingId && element.type === "text"
                const showOwnHandles = isSelected && !isEditing && !isMultiSelection

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
                        onSelect([element.id])
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

                    <ConditionBadge element={element} scale={effectiveZoom} />
                    {showOwnHandles ? renderHandles(element, false) : null}
                  </div>
                )
              }}
            >
              {isMultiSelection && selectionBounds ? (
                <div
                  role="presentation"
                  className="pointer-events-none absolute"
                  style={{
                    left: selectionBounds.x,
                    top: selectionBounds.y,
                    width: selectionBounds.width,
                    height: selectionBounds.height,
                    boxShadow: `0 0 0 ${outlineWidth}px var(--brand-teal)`,
                    outline: `${outlineWidth}px dashed var(--brand-teal)`,
                    outlineOffset: outlineWidth * 2,
                  }}
                >
                  {renderHandles(selectionBounds, true)}
                </div>
              ) : null}

              {guides.map((guide) => (
                <div
                  key={`${guide.axis}-${guide.position}`}
                  className="pointer-events-none absolute bg-rose-500"
                  style={
                    guide.axis === "x"
                      ? { left: guide.position - guideWidth / 2, top: 0, width: guideWidth, height: design.height }
                      : { top: guide.position - guideWidth / 2, left: 0, height: guideWidth, width: design.width }
                  }
                />
              ))}

              {marquee ? (
                <div
                  className="pointer-events-none absolute border border-brand-teal bg-brand-teal/10"
                  style={{
                    left: marquee.x,
                    top: marquee.y,
                    width: marquee.width,
                    height: marquee.height,
                    borderWidth: guideWidth,
                  }}
                />
              ) : null}
            </DesignPage>
          </div>
        </div>
      </div>
    </div>
  )
}
