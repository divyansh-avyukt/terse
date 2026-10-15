import { useEffect, useState } from 'react'
import { fetchUser, type User } from '@/api'
import Settings from '@/views/pages/Settings.terse'

/** TSX owns state and fetching; the .terse view only renders what it is given. */
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

  const save = () => {
    if (user) setUser({ ...user, name })
    setEditing(false)
  }

  return (
    <Settings
      user={user}
      editing={editing && !!user}
      name={name}
      onEdit={() => setEditing(true)}
      onNameChange={setName}
      onSave={save}
    />
  )
}
