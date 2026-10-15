import { useState } from 'react'
import { stores, team as initialTeam, type TeamMember } from '@/app/data'
import { initials } from '@/app/format'
import Settings from '@/views/cafe/pages/Settings.terse'

const ROLES: TeamMember['role'][] = ['Owner', 'Manager', 'Barista']
const SCHEDULES = [
  { value: 'instant', label: 'Instant (1% fee)' },
  { value: 'daily', label: 'Daily, next business day' },
  { value: 'weekly', label: 'Weekly, every Monday' },
]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

const initialForm = (storeName: string) => ({
  name: `Brewpay ${storeName}`,
  email: 'indiranagar@brewpay.in',
  phone: '+91 80 4123 9876',
  gstin: '29ABCDE1234F1Z5',
  address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
  palm: true,
  upi: true,
  card: true,
  cash: false,
  settlement: 'daily',
  dailySummary: true,
  failedAlerts: true,
  refundAlerts: false,
  weeklyReport: true,
})
type Form = ReturnType<typeof initialForm>

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {}
  if (!f.name.trim()) e.name = 'The store needs a name.'
  if (!EMAIL.test(f.email)) e.email = 'Enter a valid email address.'
  if (f.gstin && !GSTIN.test(f.gstin.toUpperCase())) e.gstin = 'A GSTIN is 15 characters, like 29ABCDE1234F1Z5.'
  return e
}

export default function SettingsPage({ store }: { store: string }) {
  const storeName = stores.find((s) => s.id === store)?.name ?? stores[0].name
  const [saved, setSaved] = useState(() => initialForm(storeName))
  const [form, setForm] = useState(saved)
  const [team, setTeam] = useState(initialTeam)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInviteState] = useState({ email: '', role: 'Barista' as TeamMember['role'] })
  const [inviteTried, setInviteTried] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [closed, setClosed] = useState(false)

  // Setters keyed by field, so the view can write `on=@set.palm`.
  const set = Object.fromEntries(Object.keys(form).map((k) => [k, (v: unknown) => setForm((f) => ({ ...f, [k]: v }))]))
  const errors = validate(form)
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  const inviteErrors: { email?: string } = {}
  if (inviteTried) {
    if (!EMAIL.test(invite.email)) inviteErrors.email = 'Enter a valid email address.'
    else if (team.some((m) => m.email === invite.email.toLowerCase())) inviteErrors.email = 'This person is already on the team.'
  }
  const resetInvite = () => {
    setInviteOpen(false)
    setInviteState({ email: '', role: 'Barista' })
    setInviteTried(false)
  }
  const resetClose = () => {
    setCloseOpen(false)
    setConfirmText('')
  }

  return (
    <Settings
      form={form}
      set={set}
      errors={errors}
      schedules={SCHEDULES}
      team={team.map((m) => ({
        name: m.name,
        email: m.email,
        initials: initials(m.name),
        role: m.role,
        isOwner: m.role === 'Owner',
        removeLabel: `Remove ${m.name}`,
        onRole: (role: TeamMember['role']) => setTeam((t) => t.map((x) => (x.id === m.id ? { ...x, role } : x))),
        onRemove: () => setTeam((t) => t.filter((x) => x.id !== m.id)),
      }))}
      roles={ROLES}
      inviteRoles={ROLES.filter((r) => r !== 'Owner')}
      inviteOpen={inviteOpen}
      onInviteOpen={(open: boolean) => (open ? setInviteOpen(true) : resetInvite())}
      onInviteCancel={resetInvite}
      invite={invite}
      setInvite={{
        email: (email: string) => setInviteState((i) => ({ ...i, email })),
        role: (role: TeamMember['role']) => setInviteState((i) => ({ ...i, role })),
      }}
      inviteErrors={inviteErrors}
      onInvite={() => {
        setInviteTried(true)
        const email = invite.email.toLowerCase()
        if (!EMAIL.test(email) || team.some((m) => m.email === email)) return
        const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        setTeam((t) => [...t, { id: `u${t.length + 1}`, name, email, role: invite.role }])
        resetInvite()
      }}
      storeName={`Type “${storeName}” to confirm.`}
      closeOpen={closeOpen}
      onCloseOpen={(open: boolean) => (open ? setCloseOpen(true) : resetClose())}
      onCloseCancel={resetClose}
      confirmText={confirmText}
      onConfirmText={setConfirmText}
      cannotClose={confirmText.trim().toLowerCase() !== storeName.toLowerCase()}
      onCloseStore={() => {
        setClosed(true)
        resetClose()
      }}
      closed={closed}
      dirty={dirty}
      barMessage={Object.keys(errors).length ? 'Fix the highlighted fields to save.' : 'You have unsaved changes.'}
      cannotSave={Object.keys(errors).length > 0}
      onDiscard={() => setForm(saved)}
      onSave={() => {
        if (Object.keys(errors).length) return
        setSaved(form)
      }}
    />
  )
}
