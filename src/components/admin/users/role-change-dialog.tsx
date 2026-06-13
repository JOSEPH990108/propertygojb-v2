"use client"

import { useMemo, useState, useTransition } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AdminUserListItem } from "@/lib/admin/users/actions"
import { assignInternalUserRoleAction } from "@/lib/admin/users/server-actions"

type RoleCode = "CUSTOMER" | "AGENT" | "ADMIN" | "SUPER_ADMIN" | null
type RoleChangePermission = AdminUserListItem["roleChangePermission"]

type RoleChangeDialogProps = {
  userId: string
  userName: string
  currentRole: RoleCode
  roleChangePermission: RoleChangePermission
}

type AssignableRole = "CUSTOMER" | "AGENT" | "ADMIN"

const ROLE_LABEL: Record<Exclude<RoleCode, null>, string> = {
  CUSTOMER: "CUSTOMER",
  AGENT: "AGENT",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
}

function getSafeMessage(code: string, fallback: string): string {
  switch (code) {
    case "UNAUTHENTICATED":
      return "Authentication is required."
    case "FORBIDDEN":
      return "You are not allowed to perform this action."
    case "TARGET_NOT_FOUND":
      return "Target user was not found."
    case "INVALID_ROLE":
      return "Target role is invalid."
    case "REASON_REQUIRED":
      return "Reason note is required."
    case "SELF_ROLE_CHANGE_BLOCKED":
      return "You cannot modify your own role."
    case "SUPER_ADMIN_ASSIGNMENT_BLOCKED":
      return "SUPER_ADMIN assignment is blocked in MVP."
    case "SUPER_ADMIN_TARGET_BLOCKED":
      return "Changing SUPER_ADMIN users is blocked in MVP."
    case "ROLE_CHANGE_NOT_ALLOWED":
      return "This role change is not allowed by policy."
    case "AUDIT_WRITE_FAILED":
      return "Role change could not be completed safely."
    default:
      return fallback
  }
}

export function RoleChangeDialog({
  userId,
  userName,
  currentRole,
  roleChangePermission,
}: RoleChangeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [targetRole, setTargetRole] = useState<AssignableRole | "">("")
  const [reasonNote, setReasonNote] = useState("")
  const [message, setMessage] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const roleOptions = useMemo(
    () => [...roleChangePermission.allowedTargetRoles],
    [roleChangePermission.allowedTargetRoles],
  )

  const disabledByPolicy = !roleChangePermission.canChange || roleOptions.length === 0

  const blockedMessage = getSafeMessage(
    roleChangePermission.blockedReasonCode ?? "ROLE_CHANGE_NOT_ALLOWED",
    roleChangePermission.blockedReasonMessage
      ?? "Role change is not available for this row based on current policy constraints.",
  )

  const canSubmit = !disabledByPolicy && !!targetRole && reasonNote.trim().length > 0 && !isPending

  function resetDialogState() {
    setTargetRole("")
    setReasonNote("")
    setMessage("")
    setErrorMessage("")
  }

  function handleOpenChange(nextOpen: boolean) {
    setIsOpen(nextOpen)
    if (!nextOpen) {
      resetDialogState()
    }
  }

  function handleSubmit() {
    if (!targetRole || reasonNote.trim().length === 0 || disabledByPolicy) {
      setErrorMessage("Select a target role and provide a reason note.")
      setMessage("")
      return
    }

    setErrorMessage("")
    setMessage("")

    startTransition(async () => {
      const result = await assignInternalUserRoleAction({
        targetUserId: userId,
        targetRole,
        reasonNote,
      })

      if (!result.ok) {
        setErrorMessage(getSafeMessage(result.code, result.message))
        return
      }

      setMessage(`Role updated from ${result.previousRole} to ${result.newRole}.`)
      setTimeout(() => {
        setIsOpen(false)
      }, 600)
    })
  }

  if (disabledByPolicy) {
    return (
      <div className="space-y-1">
        <Button size="sm" variant="outline" disabled>
          Change Role
        </Button>
        <p className="text-xs text-muted-foreground">{blockedMessage}</p>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Change Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update role for {userName}. Server-side policy enforcement is always applied.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Current role: {currentRole ? ROLE_LABEL[currentRole] : "Unknown"}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Target role</p>
            <Select
              value={targetRole}
              onValueChange={(value) => setTargetRole(value as AssignableRole)}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Reason note</p>
            <Textarea
              value={reasonNote}
              onChange={(event) => setReasonNote(event.target.value)}
              placeholder="Provide reason for this role change"
              disabled={isPending}
            />
          </div>

          {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
          {message ? <p className="text-xs text-emerald-600">{message}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
