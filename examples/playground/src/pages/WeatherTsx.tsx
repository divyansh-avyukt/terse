import { Droplets, Eye, Info, Sun, Wind, type LucideIcon } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type Stat = { icon: LucideIcon; label: string; value: string }

const stats: Stat[] = [
  { icon: Droplets, label: 'Humidity', value: '64%' },
  { icon: Wind, label: 'Wind', value: '12 mph' },
  { icon: Sun, label: 'UV Index', value: '6 (High)' },
  { icon: Eye, label: 'Visibility', value: '10 mi' },
]

const forecast = [
  { day: 'Thu', high: 72, low: 55 },
  { day: 'Fri', high: 68, low: 52 },
  { day: 'Sat', high: 65, low: 50 },
  { day: 'Sun', high: 70, low: 54 },
  { day: 'Mon', high: 74, low: 57 },
  { day: 'Tue', high: 76, low: 59 },
  { day: 'Wed', high: 73, low: 56 },
]

const forecastConfig = {
  high: { label: 'High', color: 'var(--chart-1)' },
  low: { label: 'Low', color: 'var(--chart-2)' },
} satisfies ChartConfig

const hourly = [
  { time: '9:00 AM', summary: '70°F ☀️ Sunny' },
  { time: '11:00 AM', summary: '72°F ☀️ Sunny' },
  { time: '1:00 PM', summary: '74°F 🌤 Partly Cloudy' },
  { time: '3:00 PM', summary: '73°F 🌤 Partly Cloudy' },
  { time: '5:00 PM', summary: '70°F 🌥 Mostly Cloudy' },
  { time: '7:00 PM', summary: '66°F 🌙 Clear' },
]

const precipitation = [
  { day: 'Thu', precipitation: 0.0 },
  { day: 'Fri', precipitation: 0.1 },
  { day: 'Sat', precipitation: 0.4 },
  { day: 'Sun', precipitation: 0.2 },
  { day: 'Mon', precipitation: 0.0 },
  { day: 'Tue', precipitation: 0.0 },
  { day: 'Wed', precipitation: 0.1 },
]

const precipitationConfig = {
  precipitation: { label: 'Precipitation', color: 'var(--chart-1)' },
} satisfies ChartConfig

export default function WeatherTsx() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-6">
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">San Francisco, CA</h1>
            <p className="text-sm text-muted-foreground">Thursday, July 10, 2025</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-row items-center gap-1">
              <Sun size={24} />
              <span className="text-2xl font-bold">72°F</span>
            </div>
            <p className="text-sm text-muted-foreground">Sunny • Feels like 69°F</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <Icon size={20} />
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-2xl font-bold">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>7-Day Forecast</CardTitle>
          <CardDescription>High / Low temperatures</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={forecastConfig} className="aspect-auto h-[260px] w-full">
            <BarChart data={forecast} margin={{ left: 12, bottom: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} label={{ value: 'Day', position: 'insideBottom', offset: -8 }} />
              <YAxis tickLine={false} axisLine={false} label={{ value: '°F', angle: -90, position: 'insideLeft' }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="high" fill="var(--color-high)" radius={4} />
              <Bar dataKey="low" fill="var(--color-low)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hourly Forecast</CardTitle>
            <CardDescription>Next 6 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ul>
              {hourly.map(({ time, summary }) => (
                <li key={time} className="flex items-center justify-between border-b py-2 last:border-b-0">
                  <span>{time}</span>
                  <span className="text-right">{summary}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conditions Overview</CardTitle>
            <CardDescription>Precipitation &amp; alerts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ChartContainer config={precipitationConfig} className="aspect-auto h-[200px] w-full">
              <AreaChart data={precipitation} margin={{ left: 12, bottom: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} label={{ value: 'Day', position: 'insideBottom', offset: -8 }} />
                <YAxis tickLine={false} axisLine={false} label={{ value: 'Precip (in)', angle: -90, position: 'insideLeft' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="precipitation"
                  type="natural"
                  fill="var(--color-precipitation)"
                  fillOpacity={0.4}
                  stroke="var(--color-precipitation)"
                />
              </AreaChart>
            </ChartContainer>
            <Alert>
              <Info />
              <AlertTitle>Marine Layer Advisory</AlertTitle>
              <AlertDescription>
                Coastal fog expected Friday morning. Visibility may drop to 2 miles near the shore.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
