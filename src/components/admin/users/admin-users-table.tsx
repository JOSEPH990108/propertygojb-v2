import {
  ProTable,
  ProTableEmptyState,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/pro-ui"
import { UserRoleBadge } from "@/components/admin/users/user-role-badge"
import type { AdminUserListItem } from "@/lib/admin/users/actions"
import { RoleChangeDialog } from "@/components/admin/users/role-change-dialog"

type AdminUsersTableProps = {
  users: AdminUserListItem[]
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  if (users.length === 0) {
    return <ProTableEmptyState title="No users found" description="Try adjusting role or search filters." />
  }

  return (
    <ProTable>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((userRow) => (
          <TableRow key={userRow.id}>
            <TableCell className="font-medium">{userRow.name}</TableCell>
            <TableCell>{userRow.email}</TableCell>
            <TableCell>{userRow.phoneMasked ?? "-"}</TableCell>
            <TableCell>
              <UserRoleBadge roleCode={userRow.roleCode} />
            </TableCell>
            <TableCell>
              <RoleChangeDialog
                userId={userRow.id}
                userName={userRow.name}
                currentRole={userRow.roleCode}
                roleChangePermission={userRow.roleChangePermission}
              />
            </TableCell>
            <TableCell>{formatDateTime(userRow.createdAt)}</TableCell>
            <TableCell>{formatDateTime(userRow.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ProTable>
  )
}
