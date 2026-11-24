import {
  Document,
  Ellipse,
  Image,
  Line,
  Page,
  Path,
  Rect,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"
import type { ReactNode } from "react"

import { barcodePathData, encodeBarcode, layoutBarcode } from "@/lib/barcodes"
import type { ResolvedImage } from "@/lib/pdf/resolve-images"
import { renderPdfIconNodes } from "@/lib/pdf/svg-nodes"
import { resolvePdfFont } from "@/lib/templates/fonts"
import { iconCatalog } from "@/lib/templates/icon-catalog"
import { createQrMatrix, layoutQr, qrPathData } from "@/lib/templates/qr"
import { interpolateText } from "@/lib/templates/variables"
import type {
  BarcodeElement,
  DesignElement,
  EllipseElement,
  IconElement,
  ImageElement,
  LineElement,
  QrCodeElement,
  RectElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"

type TemplateDocumentProps = {
  /** Design with hidden (conditional) elements already removed. */
  design: TemplateDesign
  values: Record<string, string>
  images: Map<string, ResolvedImage>
  title: string
  /** Custom font family ids registered with react-pdf. */
  customFamilies: ReadonlySet<string>
}

type RenderContext = Pick<TemplateDocumentProps, "values" | "images" | "customFamilies">

const VERTICAL_ALIGN: Record<TextElement["verticalAlign"], Style["justifyContent"]> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
}

/** The element's own box, positioned inside its clipping frame. */
function innerBox(element: DesignElement): Style {
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: element.width,
    height: element.height,
  }
}

/**
 * Clips an element to the page. react-pdf paginates content that runs past the page
 * bottom (text gains pages, SVG loops forever), so anything that overflows is wrapped
 * in a frame that only spans the visible part.
 */
function ElementFrame({
  element,
  design,
  children,
}: {
  element: DesignElement
  design: TemplateDesign
  children: ReactNode
}) {
  const width = Math.min(element.width, design.width - element.x)
  const height = Math.min(element.height, design.height - element.y)

  if (width <= 0 || height <= 0) {
    return null
  }

  return (
    <View
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width,
        height,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  )
}

function TextBlock({
  element,
  values,
  customFamilies,
}: {
  element: TextElement
  values: Record<string, string>
  customFamilies: ReadonlySet<string>
}) {
  const content = interpolateText(element.text, values)
  const font = resolvePdfFont(element.fontFamily, element.bold, element.italic, customFamilies)

  return (
    <View
      style={{
        ...innerBox(element),
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: VERTICAL_ALIGN[element.verticalAlign],
      }}
    >
      {content.length > 0 ? (
        <Text
          style={{
            fontFamily: font.fontFamily,
            fontWeight: font.fontWeight,
            fontStyle: font.fontStyle,
            fontSize: element.fontSize,
            lineHeight: element.lineHeight,
            color: element.color,
            textAlign: element.align,
          }}
        >
          {content}
        </Text>
      ) : null}
    </View>
  )
}

function ImageBlock({
  element,
  image,
}: {
  element: ImageElement
  image: ResolvedImage | undefined
}) {
  if (!image) {
    return null
  }

  return (
    /* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */
    <Image
      src={{ data: image.data, format: image.format }}
      style={{
        ...innerBox(element),
        objectFit: element.fit,
        borderRadius: element.radius,
      }}
    />
  )
}

function RectBlock({ element }: { element: RectElement }) {
  const style: Style = {
    ...innerBox(element),
    borderRadius: element.radius,
  }

  if (element.fill) {
    style.backgroundColor = element.fill
  }

  if (element.stroke && element.strokeWidth > 0) {
    style.borderWidth = element.strokeWidth
    style.borderColor = element.stroke
    style.borderStyle = "solid"
  }

  return <View style={style} />
}

function EllipseBlock({ element }: { element: EllipseElement }) {
  const strokeWidth = element.stroke ? element.strokeWidth : 0
  const inset = strokeWidth / 2

  return (
    <Svg
      width={element.width}
      height={element.height}
      viewBox={`0 0 ${element.width} ${element.height}`}
    >
      <Ellipse
        cx={element.width / 2}
        cy={element.height / 2}
        rx={Math.max(0, element.width / 2 - inset)}
        ry={Math.max(0, element.height / 2 - inset)}
        fill={element.fill || "none"}
        stroke={element.stroke || "none"}
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}

function lineEndpoints(element: LineElement) {
  const { width: w, height: h } = element

  switch (element.orientation) {
    case "vertical":
      return { x1: w / 2, y1: 0, x2: w / 2, y2: h }
    case "diagonal-down":
      return { x1: 0, y1: 0, x2: w, y2: h }
    case "diagonal-up":
      return { x1: 0, y1: h, x2: w, y2: 0 }
    default:
      return { x1: 0, y1: h / 2, x2: w, y2: h / 2 }
  }
}

function LineBlock({ element }: { element: LineElement }) {
  const points = lineEndpoints(element)

  return (
    <Svg
      width={element.width}
      height={element.height}
      viewBox={`0 0 ${element.width} ${element.height}`}
    >
      <Line
        {...points}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        strokeDasharray={element.dash > 0 ? `${element.dash} ${element.dash}` : undefined}
      />
    </Svg>
  )
}

function IconBlock({ element }: { element: IconElement }) {
  const node = iconCatalog[element.name]

  if (!node) {
    return null
  }

  return (
    <Svg
      width={element.width}
      height={element.height}
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
    >
      {renderPdfIconNodes(node, element.color, element.strokeWidth)}
    </Svg>
  )
}

function QrCodeBlock({
  element,
  values,
}: {
  element: QrCodeElement
  values: Record<string, string>
}) {
  const matrix = createQrMatrix(interpolateText(element.value, values), element.errorCorrection)

  if (!matrix) {
    return null
  }

  const layout = layoutQr(matrix, element.width, element.height)
  const bgX = (element.width - layout.span) / 2
  const bgY = (element.height - layout.span) / 2

  return (
    <Svg
      width={element.width}
      height={element.height}
      viewBox={`0 0 ${element.width} ${element.height}`}
    >
      {element.background ? (
        <Rect x={bgX} y={bgY} width={layout.span} height={layout.span} fill={element.background} />
      ) : null}
      <Path d={qrPathData(matrix, layout)} fill={element.color} />
    </Svg>
  )
}

function BarcodeBlock({
  element,
  values,
}: {
  element: BarcodeElement
  values: Record<string, string>
}) {
  const encoding = encodeBarcode(element.format, interpolateText(element.value, values))

  if (!encoding) {
    return null
  }

  const layout = layoutBarcode(encoding, element.width, element.height, element.showText)
  const style: Style = innerBox(element)

  if (element.background) {
    style.backgroundColor = element.background
  }

  return (
    <View style={style}>
      <Svg
        width={element.width}
        height={layout.barsHeight}
        viewBox={`0 0 ${element.width} ${layout.barsHeight}`}
      >
        <Path d={barcodePathData(encoding, layout)} fill={element.color} />
      </Svg>
      {element.showText ? (
        <Text
          style={{
            position: "absolute",
            left: 0,
            top: layout.barsHeight,
            width: element.width,
            textAlign: "center",
            fontFamily: "Helvetica",
            fontSize: layout.fontSize,
            color: element.color,
          }}
        >
          {encoding.text}
        </Text>
      ) : null}
    </View>
  )
}

function renderBlock(element: DesignElement, context: RenderContext): ReactNode {
  switch (element.type) {
    case "text":
      return (
        <TextBlock
          element={element}
          values={context.values}
          customFamilies={context.customFamilies}
        />
      )
    case "image":
      return <ImageBlock element={element} image={context.images.get(element.id)} />
    case "rect":
      return <RectBlock element={element} />
    case "ellipse":
      return <EllipseBlock element={element} />
    case "line":
      return <LineBlock element={element} />
    case "icon":
      return <IconBlock element={element} />
    case "qrcode":
      return <QrCodeBlock element={element} values={context.values} />
    case "barcode":
      return <BarcodeBlock element={element} values={context.values} />
    default:
      return null
  }
}

export function TemplateDocument({
  design,
  values,
  images,
  title,
  customFamilies,
}: TemplateDocumentProps) {
  const context: RenderContext = { values, images, customFamilies }

  return (
    <Document title={title} producer="flowkanvas" creator="flowkanvas">
      {design.pages.map((page) => (
        <Page
          key={page.id}
          size={[design.width, design.height]}
          style={{ backgroundColor: page.background }}
        >
          {page.elements.map((element) => (
            <ElementFrame key={element.id} element={element} design={design}>
              {renderBlock(element, context)}
            </ElementFrame>
          ))}
        </Page>
      ))}
    </Document>
  )
}
