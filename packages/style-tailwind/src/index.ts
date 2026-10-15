import type { StyleAdapter } from '@terse/compiler'
import type { StyleToken } from '@terse/core'

// Full class names only (no string building) so Tailwind's scanner finds them in this file.
const GAP = { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' }
const PAD = { none: 'p-0', xs: 'p-1', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' }
const ALIGN = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }
const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' }
const COLS = {
  '1': 'grid-cols-1',
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
  '5': 'sm:grid-cols-3 lg:grid-cols-5',
  '6': 'sm:grid-cols-3 lg:grid-cols-6',
  '12': 'grid-cols-12',
}
const TONE = { default: '', muted: 'text-muted-foreground', primary: 'text-primary', destructive: 'text-destructive' }
const WRAP = { true: 'flex-wrap', false: '' }
const SIZE: Record<string, Record<string, string>> = {
  heading: { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' },
  image: { sm: 'size-12', md: 'size-24', lg: 'size-48' },
  default: { sm: 'text-sm', md: 'text-base', lg: 'text-lg' },
}

const MAPS: Record<Exclude<StyleToken, 'size'>, Record<string, string>> = {
  gap: GAP,
  pad: PAD,
  align: ALIGN,
  justify: JUSTIFY,
  cols: COLS,
  tone: TONE,
  wrap: WRAP,
}

export function tailwind(): StyleAdapter {
  return {
    name: 'tailwind',
    classes(component, tokens) {
      return Object.entries(tokens)
        .map(([key, value]) => (key === 'size' ? (SIZE[component] ?? SIZE.default) : MAPS[key as keyof typeof MAPS])?.[value!] ?? '')
        .filter(Boolean)
        .join(' ')
    },
  }
}
