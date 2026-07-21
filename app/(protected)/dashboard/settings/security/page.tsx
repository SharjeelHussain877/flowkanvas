import { DashboardPage } from "@/components/dashboard/dashboard-page"
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

export default function SettingsSecurityPage() {
  return (
    <DashboardPage
      title="Security"
      description="Password and session controls for your account."
    >
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Use a strong password with at least 12 characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" type="password" readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" readOnly />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button disabled>Update password</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              Static preview of signed-in devices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-border/70 bg-brand-surface px-4 py-3">
              <p className="font-medium">Windows · Chrome</p>
              <p className="text-xs text-muted-foreground">
                Current session · Karachi, PK
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-brand-surface px-4 py-3">
              <p className="font-medium">iPhone · Safari</p>
              <p className="text-xs text-muted-foreground">
                Last active 2 days ago
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="outline" disabled>
              Sign out all devices
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardPage>
  )
}
