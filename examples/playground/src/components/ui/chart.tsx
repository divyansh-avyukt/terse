import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

export type ChartConfig = {
  [k in string]: { label?: React.ReactNode; icon?: React.ComponentType; color?: string }
}

type ChartContextProps = { config: ChartConfig }

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error('useChart must be used within a <ChartContainer />')
  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden flex aspect-video justify-center text-xs",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, c]) => c.color)
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${colorConfig.map(([key, c]) => `  --color-${key}: ${c.color};`).join('\n')}\n}`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipItem = {
  name?: string | number
  value?: number | string | (number | string)[]
  dataKey?: string | number | ((obj: unknown) => unknown)
  color?: string
  payload?: Record<string, unknown>
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
}: {
  active?: boolean
  payload?: readonly TooltipItem[]
  label?: React.ReactNode
  className?: string
  hideLabel?: boolean
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null

  return (
    <div className={cn('border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl', className)}>
      {!hideLabel && label != null && <div className="font-medium">{label}</div>}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? 'value')
          const itemConfig = config[key]
          return (
            <div key={key} className="flex w-full items-center gap-2">
              <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
              <div className="flex flex-1 justify-between gap-4 leading-none">
                <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
                {item.value != null && <span className="text-foreground font-mono font-medium tabular-nums">{item.value.toLocaleString()}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  payload,
  verticalAlign = 'bottom',
}: {
  className?: string
  payload?: readonly { value?: string; dataKey?: unknown; color?: string }[]
  verticalAlign?: 'top' | 'middle' | 'bottom'
}) {
  const { config } = useChart()
  if (!payload?.length) return null

  return (
    <div className={cn('flex items-center justify-center gap-4', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? 'value')
        const itemConfig = config[key]
        return (
          <div key={key} className="flex items-center gap-1.5">
            <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            {itemConfig?.label ?? item.value}
          </div>
        )
      })}
    </div>
  )
}

export { ChartContainer, ChartLegend, ChartLegendContent, ChartStyle, ChartTooltip, ChartTooltipContent }
