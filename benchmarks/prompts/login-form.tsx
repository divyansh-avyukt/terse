import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginFormProps {
  email: string
  password: string
  error?: string
  loading: boolean
  onEmail: (value: string) => void
  onPassword: (value: string) => void
  onSubmit: () => void
}

export default function LoginForm({ email, password, error, loading, onEmail, onPassword, onSubmit }: LoginFormProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your email below to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => onEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => onPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-fit" onClick={onSubmit} disabled={loading}>
            Sign in
          </Button>
          <a href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Forgot your password?
          </a>
        </CardContent>
      </Card>
    </main>
  )
}
