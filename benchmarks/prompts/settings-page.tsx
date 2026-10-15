import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Notification {
  label: string
  description: string
  status: string
}

interface SettingsPageProps {
  profile: { name: string; email: string }
  notifications: Notification[]
  saving: boolean
  onName: (value: string) => void
  onEmail: (value: string) => void
  onSave: () => void
  onDelete: () => void
}

export default function SettingsPage({ profile, notifications, saving, onName, onEmail, onSave, onDelete }: SettingsPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Update your name and email address</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={profile.name} onChange={(e) => onName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={profile.email} onChange={(e) => onEmail(e.target.value)} />
            </div>
            <div className="flex items-center justify-end">
              <Button onClick={onSave} disabled={saving}>
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
        <Card>
          <CardContent className="flex flex-col gap-4">
            {notifications.map((n) => (
              <div key={n.label} className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm">{n.label}</p>
                  <p className="text-sm text-muted-foreground">{n.description}</p>
                </div>
                <Badge variant="secondary">{n.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Danger zone</h2>
        <Card>
          <CardHeader>
            <CardTitle>Delete account</CardTitle>
            <CardDescription>Permanently remove your account and all of its data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={onDelete}>
              Delete account
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
