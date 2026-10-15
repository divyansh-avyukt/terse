import { useEffect, useState } from 'react'
import { fetchUser, type User } from '@/api'
import ProfileCard from '@/components/ProfileCard.terse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** An existing hand-written TSX page that renders a .terse component. */
export default function SettingsPage() {
  const [user, setUser] = useState<User>()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    fetchUser().then((u) => {
      setUser(u)
      setName(u.name)
    })
  }, [])

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <ProfileCard user={user} onEdit={() => setEditing(true)} />
      {editing && user && (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setUser({ ...user, name })
            setEditing(false)
          }}
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      )}
    </main>
  )
}
