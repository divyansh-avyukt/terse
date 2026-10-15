import * as React from 'react'
import { cn } from '@/lib/utils'

// shadcn/ui Separator, on a native element instead of @radix-ui/react-separator.
function Separator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="separator" data-slot="separator" className={cn('bg-border shrink-0 h-px w-full', className)} {...props} />
}

export { Separator }
