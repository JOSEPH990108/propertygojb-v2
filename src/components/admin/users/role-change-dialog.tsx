"use client"

import { useMemo, useState, useTransition } from "react"

import {
  ProAlert,
  ProButton,
  ProField,
  ProModal,
  ProSelect,
  ProStatusBadge,
  ProTextarea,
  ProValidationMessage,
} from "@/components/pro-ui"
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
  const roleSelectOptions = useMemo(
    () => roleOptions.map((role) => ({ value: role, label: role })),
    [roleOptions],
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
        resetDialogState()
        }, 600)
    })
  }

  if (disabledByPolicy) {
    return (
      <div className="space-y-1">
          <ProButton size="sm" variant="outline" disabled>
          Change Role
          </ProButton>
          <ProAlert tone="warning" title="Role change unavailable" description={blockedMessage} />
      </div>
    )
  }

  return (
      <ProModal
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setIsOpen(nextOpen)
          if (!nextOpen) {
            resetDialogState()
          }
        }}
        trigger={<ProButton size="sm" variant="outline">Change Role</ProButton>}
        title="Change User Role"
        description={`Update role for ${userName}. Server-side policy enforcement is always applied.`}
        footer={(
          <>
            <ProButton
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                resetDialogState()
              }}
              disabled={isPending}
            >
              Cancel
            </ProButton>
            <ProButton onClick={handleSubmit} disabled={!canSubmit} loading={isPending}>
              Save
            </ProButton>
          </>
        )}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Current role:</span>
            <ProStatusBadge label={currentRole ? ROLE_LABEL[currentRole] : "Unknown"} status="info" />
          </div>

          <ProField label="Target role" required errorMessage={targetRole ? undefined : errorMessage ? "Select a target role." : undefined}>
            <ProSelect
              value={targetRole || undefined}
              onValueChange={(value) => setTargetRole(value as AssignableRole)}
              disabled={isPending}
              placeholder="Select target role"
              options={roleSelectOptions}
              tone={errorMessage && !targetRole ? "error" : "default"}
            />
          </ProField>

          <ProField
            label="Reason note"
            required
            errorMessage={reasonNote.trim().length > 0 ? undefined : errorMessage ? "Reason note is required." : undefined}
          >
            <ProTextarea
              value={reasonNote}
              onChange={(event) => setReasonNote(event.target.value)}
              placeholder="Provide reason for this role change"
              disabled={isPending}
              tone={errorMessage && reasonNote.trim().length === 0 ? "error" : "default"}
            />
          </ProField>

          {errorMessage ? <ProValidationMessage tone="error" message={errorMessage} /> : null}
          {message ? <ProValidationMessage tone="success" message={message} /> : null}
        </div>
      </ProModal>
  )
}
