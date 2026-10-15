import type { User } from '@/api'
import { cn } from '@/lib/utils'

const SIZES = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-base' }

/** A plain TSX component, imported into Dashboard.terse with `use`. */
export default function UserAvatar({ user, size = 'md' }: { user?: User; size?: keyof typeof SIZES }) {
  if (!user) return null
  const initials = user.name.split(' ').map((w) => w[0]).join('')
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground', SIZES[size])}>{initials}</div>
      <div className="text-sm">
        <div className="font-medium">{user.name}</div>
        <div className="text-muted-foreground">{user.email}</div>
      </div>
    </div>
  )
}
