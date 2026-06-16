import {
  ProTable,
  ProTableEmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
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
    return <ProTableEmptyState title="No customers found" description="Try adjusting search filters." />
  }

  return (
    <ProTable>
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
    </ProTable>
  )
}
