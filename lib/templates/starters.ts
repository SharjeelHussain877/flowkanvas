import {
  createBarcodeElement,
  createEllipseElement,
  createEmptyDesign,
  createIconElement,
  createImageElement,
  createLineElement,
  createQrCodeElement,
  createRectElement,
  createTextElement,
} from "@/lib/templates/element-defaults"
import { createGroupId } from "@/lib/templates/ids"
import type {
  DesignElement,
  TemplateDesign,
  TextElement,
} from "@/schemas/templates/design"

export type StarterTemplate = {
  id: string
  name: string
  description: string
  width: number
  height: number
  build: () => TemplateDesign
}

const NAVY = "#11172a"
const SLATE = "#626c7d"
const TEAL = "#599692"
const MIST = "#dfe5ec"
const WHITE = "#ffffff"

type Box = { x: number; y: number; width: number; height: number }

function box(x: number, y: number, width: number, height: number): Box {
  return { x, y, width, height }
}

function startDesign(width: number, height: number, background = WHITE) {
  const design = createEmptyDesign(width, height)
  design.pages[0].background = background

  const add = (element: DesignElement) => {
    design.pages[0].elements.push(element)
    return element
  }

  const text = (
    content: string,
    bounds: Box,
    style: Partial<Omit<TextElement, "type" | "id" | "text">> = {}
  ) => add(createTextElement(design, { ...bounds, text: content, ...style }))

  return { design, add, text }
}

function buildCertificate(): TemplateDesign {
  const { design, add, text } = startDesign(842, 595)

  add(createRectElement(design, { ...box(0, 0, 842, 14), fill: TEAL, radius: 0 }))
  add(createRectElement(design, { ...box(0, 581, 842, 14), fill: NAVY, radius: 0 }))
  add(
    createRectElement(design, {
      ...box(32, 36, 778, 523),
      fill: "",
      stroke: NAVY,
      strokeWidth: 1.5,
      radius: 0,
    })
  )
  add(createImageElement(design, { ...box(381, 56, 80, 80), variable: "logo", fit: "contain" }))
  text("CERTIFICATE", box(121, 146, 600, 56), {
    fontFamily: "times",
    fontSize: 44,
    bold: true,
    align: "center",
    color: NAVY,
  })
  text("OF ACHIEVEMENT", box(121, 204, 600, 22), {
    fontSize: 14,
    align: "center",
    color: TEAL,
    bold: true,
  })
  text("This certificate is proudly presented to", box(121, 248, 600, 22), {
    fontSize: 14,
    align: "center",
    color: SLATE,
  })
  text("{{recipient_name}}", box(161, 278, 520, 54), {
    fontFamily: "times",
    fontSize: 40,
    bold: true,
    italic: true,
    align: "center",
    color: NAVY,
  })
  add(createLineElement(design, { ...box(221, 336, 400, 4), stroke: TEAL, strokeWidth: 1.5 }))
  text("for successfully completing {{course_name}}", box(121, 352, 600, 24), {
    fontSize: 14,
    align: "center",
    color: SLATE,
  })
  add(createIconElement(design, { ...box(389, 404, 64, 64), name: "award", color: TEAL, strokeWidth: 1.5 }))
  text("{{date}}", box(96, 452, 220, 22), { fontSize: 13, align: "center", color: NAVY })
  add(createLineElement(design, { ...box(96, 478, 220, 2), stroke: NAVY, strokeWidth: 1 }))
  text("Date", box(96, 484, 220, 18), { fontSize: 10, align: "center", color: SLATE })
  text("{{signer_name}}", box(526, 452, 220, 22), { fontSize: 13, align: "center", color: NAVY })
  add(createLineElement(design, { ...box(526, 478, 220, 2), stroke: NAVY, strokeWidth: 1 }))
  text("{{signer_title}}", box(526, 484, 220, 18), { fontSize: 10, align: "center", color: SLATE })

  return design
}

function buildEventTicket(): TemplateDesign {
  const { design, add, text } = startDesign(576, 216)

  add(createRectElement(design, { ...box(0, 0, 176, 216), fill: NAVY, radius: 0 }))
  add(
    createQrCodeElement(design, {
      ...box(38, 34, 100, 100),
      value: "{{ticket_id}}",
      color: NAVY,
      background: WHITE,
      errorCorrection: "M",
    })
  )
  text("{{ticket_id}}", box(16, 148, 144, 18), {
    fontFamily: "courier",
    fontSize: 10,
    align: "center",
    color: WHITE,
  })
  text("Scan at the entrance", box(16, 170, 144, 16), { fontSize: 8, align: "center", color: MIST })
  add(
    createLineElement(design, {
      ...box(182, 12, 2, 192),
      orientation: "vertical",
      stroke: MIST,
      strokeWidth: 1,
      dash: 5,
    })
  )
  add(createIconElement(design, { ...box(520, 22, 32, 32), name: "ticket", color: TEAL, strokeWidth: 2 }))
  text("{{event_name}}", box(204, 24, 300, 36), { fontSize: 24, bold: true, color: NAVY })
  text("{{event_date}} · {{event_time}}", box(204, 66, 340, 18), { fontSize: 12, color: SLATE })
  text("{{venue}}", box(204, 86, 340, 18), { fontSize: 12, color: SLATE })
  add(createLineElement(design, { ...box(204, 114, 348, 2), stroke: MIST, strokeWidth: 1 }))
  text("ADMIT ONE", box(204, 126, 200, 14), { fontSize: 9, bold: true, color: TEAL })
  text("{{attendee_name}}", box(204, 142, 300, 26), { fontSize: 18, bold: true, color: NAVY })
  text("Seat {{seat}}", box(204, 174, 200, 18), { fontSize: 12, color: NAVY })

  const vipGroup = createGroupId()
  const vipCondition = { variable: "vip", operator: "set" as const, value: "" }
  add(
    createRectElement(design, {
      ...box(488, 166, 64, 26),
      fill: "#f5b942",
      radius: 13,
      group: vipGroup,
      condition: vipCondition,
    })
  )
  text("VIP", box(488, 166, 64, 26), {
    fontSize: 12,
    bold: true,
    align: "center",
    verticalAlign: "middle",
    color: NAVY,
    group: vipGroup,
    condition: vipCondition,
  })

  return design
}

function buildIdCard(): TemplateDesign {
  const { design, add, text } = startDesign(153, 243)

  add(createRectElement(design, { ...box(0, 0, 153, 72), fill: TEAL, radius: 0 }))
  text("{{company_name}}", box(8, 8, 137, 14), {
    fontSize: 9,
    bold: true,
    align: "center",
    color: WHITE,
  })
  add(createRectElement(design, { ...box(42, 28, 69, 84), fill: WHITE, radius: 8 }))
  add(
    createImageElement(design, {
      ...box(44, 30, 65, 80),
      variable: "photo",
      fit: "cover",
      radius: 6,
    })
  )
  text("{{full_name}}", box(8, 120, 137, 16), {
    fontSize: 11,
    bold: true,
    align: "center",
    color: NAVY,
  })
  text("{{job_title}}", box(8, 138, 137, 12), { fontSize: 8, align: "center", color: SLATE })
  add(createLineElement(design, { ...box(16, 156, 121, 2), stroke: MIST, strokeWidth: 1 }))
  text("ID {{employee_id}}", box(8, 162, 137, 12), {
    fontFamily: "courier",
    fontSize: 7,
    align: "center",
    color: NAVY,
  })
  text("{{department}}", box(8, 176, 137, 12), { fontSize: 7, align: "center", color: SLATE })
  add(
    createBarcodeElement(design, {
      ...box(16, 196, 121, 34),
      value: "{{employee_id}}",
      format: "code128",
      showText: false,
      background: "",
    })
  )

  return design
}

function buildGiftVoucher(): TemplateDesign {
  const { design, add, text } = startDesign(504, 216, "#faf6f0")

  add(createEllipseElement(design, { ...box(-40, 150, 120, 120), fill: MIST, stroke: "", strokeWidth: 0 }))
  text("GIFT VOUCHER", box(28, 26, 260, 32), {
    fontFamily: "times",
    fontSize: 24,
    bold: true,
    color: NAVY,
  })
  text("{{amount}}", box(28, 62, 260, 50), { fontSize: 40, bold: true, color: TEAL })
  text("for {{recipient_name}}", box(28, 118, 260, 20), { fontSize: 13, color: NAVY })
  text("From {{sender_name}}", box(28, 140, 260, 18), { fontSize: 11, color: SLATE })
  text("Valid until {{expiry_date}}", box(28, 178, 260, 16), { fontSize: 10, color: SLATE })
  add(
    createLineElement(design, {
      ...box(300, 20, 2, 176),
      orientation: "vertical",
      stroke: SLATE,
      strokeWidth: 1,
      dash: 5,
    })
  )
  add(createRectElement(design, { ...box(320, 20, 164, 176), fill: NAVY, radius: 14 }))
  add(createIconElement(design, { ...box(374, 42, 56, 56), name: "gift", color: WHITE, strokeWidth: 1.5 }))
  text("Code", box(320, 112, 164, 14), { fontSize: 9, align: "center", color: MIST })
  text("{{voucher_code}}", box(320, 130, 164, 22), {
    fontFamily: "courier",
    fontSize: 14,
    bold: true,
    align: "center",
    color: WHITE,
  })
  text("Present this code at checkout", box(320, 160, 164, 14), {
    fontSize: 8,
    align: "center",
    color: MIST,
  })

  return design
}

function buildProductLabel(): TemplateDesign {
  const { design, add, text } = startDesign(288, 180)

  add(
    createRectElement(design, {
      ...box(8, 8, 272, 164),
      fill: "",
      stroke: NAVY,
      strokeWidth: 1,
      radius: 8,
    })
  )
  add(createIconElement(design, { ...box(248, 18, 22, 22), name: "tag", color: TEAL, strokeWidth: 2 }))
  text("{{product_name}}", box(20, 18, 222, 24), { fontSize: 16, bold: true, color: NAVY })
  text("{{variant}}", box(20, 44, 222, 16), { fontSize: 11, color: SLATE })
  add(createLineElement(design, { ...box(20, 66, 248, 2), stroke: MIST, strokeWidth: 1 }))
  text("Price", box(20, 76, 110, 12), { fontSize: 8, color: SLATE })
  text("{{price}}", box(20, 88, 120, 30), { fontSize: 22, bold: true, color: NAVY })
  text("Batch {{batch}}", box(20, 128, 120, 14), { fontSize: 9, color: SLATE })
  text("Best before {{expiry}}", box(20, 144, 120, 14), { fontSize: 9, color: SLATE })
  add(
    createBarcodeElement(design, {
      ...box(146, 78, 122, 80),
      value: "{{ean}}",
      format: "ean13",
      showText: true,
      background: WHITE,
    })
  )

  return design
}

function buildOfferLetter(): TemplateDesign {
  const { design, add, text } = startDesign(595, 842)

  add(createRectElement(design, { ...box(0, 0, 595, 8), fill: TEAL, radius: 0 }))
  text("{{company_name}}", box(56, 52, 300, 28), { fontSize: 20, bold: true, color: NAVY })
  text("{{company_address}}", box(356, 54, 183, 40), { fontSize: 9, align: "right", color: SLATE, lineHeight: 1.4 })
  add(createLineElement(design, { ...box(56, 104, 483, 2), stroke: MIST, strokeWidth: 1 }))
  text("{{date}}", box(56, 124, 300, 18), { fontSize: 11, color: SLATE })
  text("Offer of Employment", box(56, 160, 483, 28), { fontSize: 18, bold: true, color: NAVY })
  text("Dear {{candidate_name}},", box(56, 200, 483, 20), { fontSize: 11, color: NAVY })
  text(
    "We are pleased to offer you the position of {{position}} at {{company_name}}, reporting to {{manager_name}}. Your start date will be {{start_date}}.\n\nYour annual compensation will be {{salary}}, paid in accordance with our standard payroll schedule. You will also be eligible for the benefits available to employees in your role, as described in the attached summary.\n\nThis offer is contingent on the successful completion of our standard background verification. Please review the terms carefully and let us know if you have any questions.",
    box(56, 230, 483, 300),
    { fontSize: 11, color: NAVY, lineHeight: 1.6 }
  )
  text(
    "To accept this offer, please sign and return this letter by {{reply_by}}. We look forward to welcoming you to the team.",
    box(56, 540, 483, 50),
    { fontSize: 11, color: NAVY, lineHeight: 1.6 }
  )
  text("Sincerely,", box(56, 606, 300, 18), { fontSize: 11, color: NAVY })
  add(createImageElement(design, { ...box(56, 628, 180, 60), variable: "signature", fit: "contain" }))
  text("{{signer_name}}", box(56, 694, 300, 18), { fontSize: 12, bold: true, color: NAVY })
  text("{{signer_title}}", box(56, 712, 300, 16), { fontSize: 10, color: SLATE })
  add(createLineElement(design, { ...box(56, 780, 483, 2), stroke: MIST, strokeWidth: 1 }))
  text("{{company_name}} · {{company_website}}", box(56, 790, 483, 16), {
    fontSize: 9,
    align: "center",
    color: SLATE,
  })

  return design
}

function buildBusinessCard(): TemplateDesign {
  const { design, add, text } = startDesign(252, 144)

  add(createRectElement(design, { ...box(0, 0, 10, 144), fill: TEAL, radius: 0 }))
  text("{{full_name}}", box(26, 24, 130, 20), { fontSize: 14, bold: true, color: NAVY })
  text("{{job_title}}", box(26, 44, 130, 14), { fontSize: 9, color: SLATE })
  text("{{company_name}}", box(150, 26, 88, 14), { fontSize: 9, bold: true, align: "right", color: TEAL })
  add(createLineElement(design, { ...box(26, 66, 212, 2), stroke: MIST, strokeWidth: 1 }))
  add(createIconElement(design, { ...box(26, 80, 11, 11), name: "phone", color: TEAL, strokeWidth: 2 }))
  text("{{phone}}", box(42, 79, 190, 13), { fontSize: 8.5, color: NAVY })
  add(createIconElement(design, { ...box(26, 98, 11, 11), name: "mail", color: TEAL, strokeWidth: 2 }))
  text("{{email}}", box(42, 97, 190, 13), { fontSize: 8.5, color: NAVY })
  add(createIconElement(design, { ...box(26, 116, 11, 11), name: "globe", color: TEAL, strokeWidth: 2 }))
  text("{{website}}", box(42, 115, 190, 13), { fontSize: 8.5, color: NAVY })

  return design
}

export const starterTemplates: StarterTemplate[] = [
  {
    id: "certificate",
    name: "Certificate",
    description: "Recipient, course, date and signature. A4 landscape.",
    width: 842,
    height: 595,
    build: buildCertificate,
  },
  {
    id: "event-ticket",
    name: "Event ticket",
    description: "QR code, seat and an optional VIP badge driven by a condition.",
    width: 576,
    height: 216,
    build: buildEventTicket,
  },
  {
    id: "id-card",
    name: "ID card",
    description: "Photo, name, department and a Code 128 barcode. CR80 size.",
    width: 153,
    height: 243,
    build: buildIdCard,
  },
  {
    id: "gift-voucher",
    name: "Gift voucher",
    description: "Amount, recipient and a redeem code.",
    width: 504,
    height: 216,
    build: buildGiftVoucher,
  },
  {
    id: "product-label",
    name: "Product label",
    description: "Name, price, batch and an EAN-13 barcode.",
    width: 288,
    height: 180,
    build: buildProductLabel,
  },
  {
    id: "offer-letter",
    name: "Offer letter",
    description: "Formal letter with position, salary and a signature image. A4.",
    width: 595,
    height: 842,
    build: buildOfferLetter,
  },
  {
    id: "business-card",
    name: "Business card",
    description: "Name, title and contact details with icons.",
    width: 252,
    height: 144,
    build: buildBusinessCard,
  },
]

export function findStarterTemplate(id: string): StarterTemplate | undefined {
  return starterTemplates.find((starter) => starter.id === id)
}
