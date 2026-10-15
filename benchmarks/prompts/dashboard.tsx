import UserAvatar from "@/components/UserAvatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Order {
  id: string
  customer: string
  status: string
  total: string
}

interface DashboardProps {
  user: { name: string; email: string }
  stats: {
    revenue: string
    revenueDelta: string
    orders: number
    ordersDelta: string
    customers: number
    topProducts: { name: string; sales: number }[]
  }
  orders: Order[]
  loading: boolean
  onRefresh: () => void
}

export default function Dashboard({ user, stats, orders, loading, onRefresh }: DashboardProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{stats.revenue}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats.revenueDelta}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Orders</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{stats.orders}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats.ordersDelta}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Customers</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">{stats.customers}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest activity across all stores</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Id</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{order.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {stats.topProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between">
                <p className="text-sm">{product.name}</p>
                <Badge variant="secondary">{product.sales}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <UserAvatar user={user} size="sm" />
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      </div>
    </main>
  )
}
