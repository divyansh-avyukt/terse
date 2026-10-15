import type { StyleAdapter } from '@terseui/compiler'
import type { StyleToken } from '@terseui/core'

// Full class names only (no string building) so Tailwind's scanner finds them in this file.
const GAP = { none: 'gap-0', xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' }
const PAD = { none: 'p-0', xs: 'p-1', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' }
const ALIGN = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }
const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' }
const COLS = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '5': 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-5',
  '6': 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-6',
  '12': 'grid-cols-12',
  '1,2': 'grid-cols-1 md:grid-cols-2',
  '1,3': 'grid-cols-1 md:grid-cols-3',
  '1,4': 'grid-cols-1 md:grid-cols-4',
  '2,3': 'grid-cols-2 md:grid-cols-3',
  '2,4': 'grid-cols-2 md:grid-cols-4',
  '2,6': 'grid-cols-2 md:grid-cols-6',
  '3,6': 'grid-cols-3 md:grid-cols-6',
  '1,1,2': 'grid-cols-1 lg:grid-cols-2',
  '1,1,3': 'grid-cols-1 lg:grid-cols-3',
  '1,2,3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '1,2,4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  '2,2,4': 'grid-cols-2 lg:grid-cols-4',
}
const TONE = {
  default: '',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  destructive: 'text-destructive',
}
const WRAP = { true: 'flex-wrap', false: '' }
const TEXT_ALIGN = { start: 'text-left', center: 'text-center', end: 'text-right', stretch: 'text-justify' }
// band: a full-bleed background with vertical rhythm. inverse re-scopes shadcn's theme variables with
// `dark`, on the card surface so it stands apart in dark mode too.
const BAND_TONE = { default: '', muted: 'bg-muted/50', inverse: 'dark bg-card text-card-foreground', primary: 'bg-primary text-primary-foreground' }
const BAND_PAD = { none: 'py-0', xs: 'py-6', sm: 'py-12', md: 'py-16', lg: 'py-24', xl: 'py-32' }

// lg only: a span wider than a smaller breakpoint's column count would add implicit columns.
const SPAN = { '1': '', '2': 'lg:col-span-2', '3': 'lg:col-span-3' }
const GROW = { true: 'flex-1 min-w-0', false: '' }
const HIDE = {
  mobile: 'max-md:hidden',
  desktop: 'md:hidden',
  // icons-only sidebar: always between md and lg, and on lg+ when it is collapsed
  collapsed: 'md:max-lg:hidden group-data-[collapsed=true]/sidebar:hidden',
}

// Where a token means something different on one component.
const OVERRIDES: Record<string, Partial<Record<StyleToken, Record<string, string>>>> = {
  card: { tone: { transparent: 'border-0 bg-transparent shadow-none', destructive: 'border-destructive/50' } },
  badge: {
    tone: {
      success: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      warning: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
  },
  td: { align: { start: 'text-left', center: 'text-center', end: 'text-right' } },
  th: { align: { start: 'text-left', center: 'text-center', end: 'text-right' } },
  text: { align: TEXT_ALIGN },
  heading: { align: TEXT_ALIGN },
  band: { tone: BAND_TONE, pad: BAND_PAD },
}
const SIZE: Record<string, Record<string, string>> = {
  heading: { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl md:text-4xl', xl: 'text-4xl sm:text-5xl md:text-7xl tracking-tighter' },
  col: { sm: 'w-full max-w-xl', md: 'w-full max-w-2xl', lg: 'w-full max-w-4xl' },
  band: { sm: 'max-w-3xl', md: 'max-w-5xl', lg: 'max-w-6xl' },
  image: { sm: 'size-12', md: 'size-24', lg: 'size-48' },
  page: { sm: 'max-w-3xl', md: 'max-w-5xl', lg: 'max-w-6xl' },
  chart: { sm: 'h-[200px]', md: 'h-[260px]', lg: 'h-[320px]' },
  text: { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-2xl font-bold' },
  avatar: { sm: 'size-8', md: 'size-10', lg: 'size-16' },
  skeleton: { sm: 'h-4', md: 'h-10', lg: 'h-24' },
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
  grow: GROW,
  span: SPAN,
  hide: HIDE,
}

export function tailwind(): StyleAdapter {
  return {
    name: 'tailwind',
    classes(component, tokens) {
      return Object.entries(tokens)
        .map(([key, value]) => {
          const map = OVERRIDES[component]?.[key as StyleToken] ?? (key === 'size' ? (SIZE[component] ?? SIZE.default) : MAPS[key as keyof typeof MAPS])
          return map?.[value!] ?? ''
        })
        .filter(Boolean)
        .join(' ')
    },
  }
}
