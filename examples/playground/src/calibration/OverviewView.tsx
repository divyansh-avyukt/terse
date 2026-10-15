// Calibration only (benchmarks/results/stress): Overview.terse written as idiomatic hand TSX.
// Same props, same rendered UI. Not used by the app.
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import StatRow from '@/views/cafe/components/StatRow.terse'
import StatusBadge from '@/views/cafe/components/StatusBadge.terse'

type Kpi = { label: string; value: string; delta: string; tone: string }
type TopItem = { name: string; sold: number; revenue: string; share: number }
type RecentTx = { customer: string; initials: string; time: string; amount: string; status: string; tone: string; onOpen: () => void }

interface OverviewProps {
  kpis: Kpi[]
  range: string
  onRange: (range: string) => void
  revenue: { caption: string; labels: string[]; values: number[] }
  methods: number[]
  topItems: TopItem[]
  recent: RecentTx[]
}

const METHODS = ['Palm', 'UPI', 'Card', 'Cash']
const revenueConfig = { revenue: { label: 'Revenue (₹)', color: 'var(--chart-1)' } } satisfies ChartConfig

export default function OverviewView({ kpis, range, onRange, revenue, methods, topItems, recent }: OverviewProps) {
  const revenueData = revenue.labels.map((day, i) => ({ day, revenue: revenue.values[i] }))
  const methodData = METHODS.map((method, i) => ({ method, share: methods[i] }))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
      <StatRow stats={kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>{revenue.caption}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Tabs value={range} onValueChange={onRange}>
              <TabsList>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="90d">90d</TabsTrigger>
              </TabsList>
            </Tabs>
            <ChartContainer config={revenueConfig} className="aspect-auto h-[260px] w-full">
              <LineChart data={revenueData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
            <CardDescription>Share of successful payments, last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="aspect-auto h-[260px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={methodData} dataKey="share" nameKey="method" innerRadius="55%" outerRadius="80%" strokeWidth={2}>
                  {methodData.map((m, i) => (
                    <Cell key={m.method} fill={`var(--chart-${i + 1})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top items</CardTitle>
            <CardDescription>By revenue, last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{item.sold}</TableCell>
                    <TableCell className="text-right">{item.revenue}</TableCell>
                    <TableCell>
                      <Progress value={item.share} className="min-w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Last 8 payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {recent.map((t, i) => (
                  <TableRow
                    key={i}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={t.onOpen}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        t.onOpen()
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{t.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm">{t.customer}</p>
                          <p className="text-muted-foreground text-sm">{t.time}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm">{t.amount}</p>
                        <StatusBadge status={t.status} tone={t.tone} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
