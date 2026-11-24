import { Document, Image, Page, Text, View } from "@react-pdf/renderer"
import type { Style } from "@react-pdf/types"

import type { ResolvedImage } from "@/lib/pdf/resolve-images"
import { getPdfFontName } from "@/lib/templates/fonts"
import { interpolateText } from "@/lib/templates/variables"
import type {
  DesignElement,
  ImageElement,
  RectElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"

type TemplateDocumentProps = {
  design: TemplateDesign
  values: Record<string, string>
  images: Map<string, ResolvedImage>
  title: string
}

const VERTICAL_ALIGN: Record<TextElement["verticalAlign"], Style["justifyContent"]> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
}

function boxStyle(element: DesignElement): Style {
  return {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
  }
}

function TextBlock({
  element,
  values,
}: {
  element: TextElement
  values: Record<string, string>
}) {
  const content = interpolateText(element.text, values)

  return (
    <View
      style={{
        ...boxStyle(element),
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: VERTICAL_ALIGN[element.verticalAlign],
      }}
    >
      {content.length > 0 ? (
        <Text
          style={{
            fontFamily: getPdfFontName(element.fontFamily, element.bold, element.italic),
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
        ...boxStyle(element),
        objectFit: element.fit,
        borderRadius: element.radius,
      }}
    />
  )
}

function RectBlock({ element }: { element: RectElement }) {
  const style: Style = {
    ...boxStyle(element),
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

export function TemplateDocument({ design, values, images, title }: TemplateDocumentProps) {
  return (
    <Document title={title} producer="flowkanvas" creator="flowkanvas">
      <Page size={[design.width, design.height]} style={{ backgroundColor: design.background }}>
        {design.elements.map((element) => {
          switch (element.type) {
            case "text":
              return <TextBlock key={element.id} element={element} values={values} />
            case "image":
              return (
                <ImageBlock key={element.id} element={element} image={images.get(element.id)} />
              )
            case "rect":
              return <RectBlock key={element.id} element={element} />
            default:
              return null
          }
        })}
      </Page>
    </Document>
  )
}
