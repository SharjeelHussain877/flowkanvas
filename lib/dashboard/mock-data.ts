export type DashboardTemplate = {
  slug: string
  title: string
  updatedAt: string
}

export const savedProjectTemplates: DashboardTemplate[] = [
  {
    slug: "invoice-v2",
    title: "Invoice Template",
    updatedAt: "2 hours ago",
  },
  {
    slug: "contract-nda",
    title: "Contract NDA",
    updatedAt: "Yesterday",
  },
  {
    slug: "offer-letter",
    title: "Offer Letter",
    updatedAt: "3 days ago",
  },
  {
    slug: "shipping-label",
    title: "Shipping Label",
    updatedAt: "1 week ago",
  },
]

const RECENT_DRAFT_COUNT = 24

export const recentDraftTemplates: DashboardTemplate[] = Array.from(
  { length: RECENT_DRAFT_COUNT },
  (_, index) => {
    const number = String(index + 1).padStart(2, "0")

    return {
      slug: `${number}-template`,
      title: `${number}_template`,
      updatedAt: index === 0 ? "Just now" : `${index + 1}h ago`,
    }
  }
)

export const mockRequests = [
  {
    id: "req_8f2a91",
    template: "01_template",
    status: "Success",
    createdAt: "Today, 10:42 AM",
  },
  {
    id: "req_7c11bd",
    template: "Invoice Template",
    status: "Success",
    createdAt: "Today, 9:18 AM",
  },
  {
    id: "req_6a0e44",
    template: "02_template",
    status: "Failed",
    createdAt: "Yesterday, 6:55 PM",
  },
  {
    id: "req_5d93ac",
    template: "Contract NDA",
    status: "Success",
    createdAt: "Yesterday, 2:12 PM",
  },
  {
    id: "req_4b82de",
    template: "03_template",
    status: "Pending",
    createdAt: "Yesterday, 11:03 AM",
  },
] as const
