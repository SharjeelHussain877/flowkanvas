import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { mockRequests } from "@/lib/dashboard/mock-data"

const statusVariant = {
  Success: "default",
  Failed: "destructive",
  Pending: "secondary",
} as const

export default function RequestsPage() {
  return (
    <DashboardPage
      title="Requests"
      description="Recent PDF generation requests from your API."
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Static preview of request logs - data wiring comes later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockRequests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col gap-2 rounded-lg border border-border/70 bg-brand-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-brand-text-heading">
                  {request.template}
                </p>
                <p className="text-xs text-muted-foreground">{request.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {request.createdAt}
                </span>
                <Badge variant={statusVariant[request.status]}>
                  {request.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardPage>
  )
}
