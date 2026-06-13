import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminUserListItem } from "@/lib/admin/users/actions"

type AdminCustomersTableProps = {
  customers: AdminUserListItem[]
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function AdminCustomersTable({ customers }: AdminCustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div className="internal-empty-state">
        No customers found for the current filters.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell>{customer.email}</TableCell>
            <TableCell>{customer.phoneMasked ?? "-"}</TableCell>
            <TableCell>{formatDateTime(customer.createdAt)}</TableCell>
            <TableCell>{formatDateTime(customer.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
