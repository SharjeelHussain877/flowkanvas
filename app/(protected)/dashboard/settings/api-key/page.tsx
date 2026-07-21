"use client"

import { Copy, KeyRound, RefreshCw } from "lucide-react"

import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MOCK_API_KEY = "cf_live_••••••••••••••••••••••••3f9a"

export default function SettingsApiKeyPage() {
  return (
    <DashboardPage
      title="Generate API key"
      description="Create keys for server-side PDF generation requests."
    >
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Production key</CardTitle>
                <CardDescription>
                  Static UI preview - generation will be wired to the API
                  later.
                </CardDescription>
              </div>
              <Badge>Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">Current key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  readOnly
                  value={MOCK_API_KEY}
                  className="font-mono"
                />
                <Button type="button" variant="outline" disabled>
                  <Copy className="size-4" />
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Keys are shown once after generation. Store them in your backend
              secrets manager.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled>
              Revoke key
            </Button>
            <Button type="button" disabled>
              <RefreshCw className="size-4" />
              Generate new key
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage snippet</CardTitle>
            <CardDescription>
              Example request using your flowkanvas API key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-xl bg-brand-navy p-4 text-xs text-brand-mist">
              {`curl -X POST https://api.flowkanvas.app/v1/generate \\
  -H "Authorization: Bearer ${MOCK_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"template":"01_template","payload":{"name":"Ayesha"}}'`}
            </pre>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <KeyRound className="size-4" />
              Never expose API keys in client-side code.
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardPage>
  )
}
