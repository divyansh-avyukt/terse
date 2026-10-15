// Calibration only (benchmarks/results/stress): Settings.terse written as idiomatic hand TSX.
// Same props, same rendered UI. Not used by the app.
import type { ReactNode } from 'react'
import { CircleAlertIcon, SendIcon, StoreIcon, Trash2Icon, UserPlusIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

type Option = string | { value: string; label: string }
type Member = { name: string; email: string; initials: string; role: string; isOwner: boolean; removeLabel: string; onRole: (role: string) => void; onRemove: () => void }

interface SettingsProps {
  form: Record<string, any>
  set: Record<string, (value: any) => void>
  errors: Record<string, string | undefined>
  schedules: Option[]
  team: Member[]
  roles: string[]
  inviteRoles: string[]
  inviteOpen: boolean
  onInviteOpen: (open: boolean) => void
  onInviteCancel: () => void
  invite: { email: string; role: string }
  setInvite: { email: (v: string) => void; role: (v: string) => void }
  inviteErrors: { email?: string }
  onInvite: () => void
  storeName: string
  closeOpen: boolean
  onCloseOpen: (open: boolean) => void
  onCloseCancel: () => void
  confirmText: string
  onConfirmText: (v: string) => void
  cannotClose: boolean
  onCloseStore: () => void
  closed: boolean
  dirty: boolean
  barMessage: string
  cannotSave: boolean
  onDiscard: () => void
  onSave: () => void
}

const optionValue = (o: Option) => (typeof o === 'string' ? o : o.value)
const optionLabel = (o: Option) => (typeof o === 'string' ? o : o.label)

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}

function TextField({ id, label, type, value, onChange, error, placeholder }: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
}) {
  return (
    <Field id={id} label={label} error={error}>
      <Input id={id} name={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
    </Field>
  )
}

function OptionSelect({ id, value, options, onChange, disabled }: { id?: string; value: string; options: Option[]; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={optionValue(o)} value={optionValue(o)}>
            {optionLabel(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SwitchRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Label className="flex items-center justify-between gap-4">
      <span className="flex flex-col gap-1">
        <span>{label}</span>
        <span className="text-muted-foreground text-sm font-normal">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Label>
  )
}

function CheckboxRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Label className="flex items-start gap-3">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <span className="flex flex-col gap-1">
        <span>{label}</span>
        <span className="text-muted-foreground text-sm font-normal">{description}</span>
      </span>
    </Label>
  )
}

export default function SettingsView(p: SettingsProps) {
  const { form, set, errors } = p
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <Section title="Store profile" description="How this store appears on receipts and in the customer app.">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField id="store-name" label="Store name" value={form.name} onChange={set.name} error={errors.name} />
              <TextField id="store-email" label="Contact email" type="email" value={form.email} onChange={set.email} error={errors.email} />
              <TextField id="store-phone" label="Phone" type="tel" value={form.phone} onChange={set.phone} />
              <TextField id="store-gstin" label="GSTIN" value={form.gstin} onChange={set.gstin} error={errors.gstin} />
            </div>
            <Field id="store-address" label="Address">
              <Textarea id="store-address" name="store-address" rows={2} value={form.address} onChange={(e) => set.address(e.target.value)} />
            </Field>
          </CardContent>
        </Card>
      </Section>

      <Section title="Payments" description="Methods offered at the counter, and when money reaches your bank.">
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <SwitchRow label="Palm" description="Pay by scanning a palm at the reader." checked={form.palm} onChange={set.palm} />
              <SwitchRow label="UPI" description="Dynamic QR on the counter display." checked={form.upi} onChange={set.upi} />
              <SwitchRow label="Card" description="Tap, insert or swipe on the terminal." checked={form.card} onChange={set.card} />
              <SwitchRow label="Cash" description="Recorded manually by staff." checked={form.cash} onChange={set.cash} />
            </div>
            <Separator />
            <Field id="settlement" label="Settlement schedule">
              <OptionSelect id="settlement" value={form.settlement} options={p.schedules} onChange={set.settlement} />
            </Field>
          </CardContent>
        </Card>
      </Section>

      <Section title="Notifications" description="Emails sent to the store's contact address.">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <CheckboxRow label="Daily summary" description="Sales, refunds and top items, every night at 11pm." checked={form.dailySummary} onChange={set.dailySummary} />
            <CheckboxRow label="Failed payments" description="Right away, when three payments fail in an hour." checked={form.failedAlerts} onChange={set.failedAlerts} />
            <CheckboxRow label="Refund requests" description="When staff start a refund over ₹1,000." checked={form.refundAlerts} onChange={set.refundAlerts} />
            <CheckboxRow label="Weekly report" description="A PDF every Monday morning." checked={form.weeklyReport} onChange={set.weeklyReport} />
          </CardContent>
        </Card>
      </Section>

      <Section title="Team" description="People who can sign in to this store.">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.team.map((m) => (
                  <TableRow key={m.email}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8 max-md:hidden">
                          <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm">{m.name}</p>
                          <p className="text-muted-foreground text-sm max-md:hidden">{m.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <OptionSelect value={m.role} options={p.roles} onChange={m.onRole} disabled={m.isOwner} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={m.removeLabel} onClick={m.onRemove} disabled={m.isOwner}>
                        <Trash2Icon size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Dialog open={p.inviteOpen} onOpenChange={p.onInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-fit">
                  <UserPlusIcon size={16} />
                  Invite member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a team member</DialogTitle>
                  <DialogDescription>They'll get an email with a sign-in link.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <TextField id="invite-email" label="Email" type="email" placeholder="name@example.com" value={p.invite.email} onChange={p.setInvite.email} error={p.inviteErrors.email} />
                  <Field id="invite-role" label="Role">
                    <OptionSelect id="invite-role" value={p.invite.role} options={p.inviteRoles} onChange={p.setInvite.role} />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={p.onInviteCancel}>
                      Cancel
                    </Button>
                    <Button onClick={p.onInvite}>
                      <SendIcon size={16} />
                      Send invite
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </Section>

      <Section title="Danger zone">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Close this store</CardTitle>
            <CardDescription>Stops taking payments and hides the store from the app. Past transactions stay in your reports.</CardDescription>
          </CardHeader>
          <CardContent>
            {p.closed ? (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertTitle>Store closed</AlertTitle>
                <AlertDescription>Payments are off. Contact support within 30 days to reopen.</AlertDescription>
              </Alert>
            ) : (
              <Dialog open={p.closeOpen} onOpenChange={p.onCloseOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-fit">
                    <StoreIcon size={16} />
                    Close store
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Close this store?</DialogTitle>
                    <DialogDescription>This can't be undone from the dashboard.</DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <p className="text-sm">{p.storeName}</p>
                    <TextField id="confirm-close" label="Type the store name to confirm" value={p.confirmText} onChange={p.onConfirmText} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={p.onCloseCancel}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={p.onCloseStore} disabled={p.cannotClose}>
                        Close store
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </Section>

      {p.dirty && (
        <div className="bg-background/95 sticky bottom-0 z-20 flex items-center justify-between gap-2 border-t px-4 py-3 backdrop-blur">
          <p className="text-muted-foreground text-sm">{p.barMessage}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={p.onDiscard}>
              Discard
            </Button>
            <Button onClick={p.onSave} disabled={p.cannotSave}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
