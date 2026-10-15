import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface User {
  name: string
  email: string
  role: string
  status: string
  lastSeen: string
}

interface DataTableProps {
  users: User[]
  summary: string
  query: string
  onQuery: (value: string) => void
  onExport: () => void
  onInvite: () => void
  onPrev: () => void
  onNext: () => void
}

export default function DataTable({ users, summary, query, onQuery, onExport, onInvite, onPrev, onNext }: DataTableProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      <div className="flex items-center justify-between gap-4">
        <Input type="search" placeholder="Search users…" value={query} onChange={(e) => onQuery(e.target.value)} className="max-w-sm" />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExport}>
            Export
          </Button>
          <Button onClick={onInvite}>Invite user</Button>
        </div>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>{user.lastSeen}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{summary}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={onNext}>
            Next
          </Button>
        </div>
      </div>
    </main>
  )
}
