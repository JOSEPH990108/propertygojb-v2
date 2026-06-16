export const DOCUMENT_REQUEST_STATUSES = [
  "REQUESTED",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
  "WAIVED",
] as const

export type DocumentRequestStatusValue = (typeof DOCUMENT_REQUEST_STATUSES)[number]

export type WorkspaceRoleCode = "SUPER_ADMIN" | "ADMIN" | "AGENT" | "CUSTOMER" | undefined

const DOCUMENT_REQUEST_STATUS_SET = new Set<DocumentRequestStatusValue>(DOCUMENT_REQUEST_STATUSES)

const DOCUMENT_REQUEST_TRANSITION_MAP: Readonly<
  Record<DocumentRequestStatusValue, readonly DocumentRequestStatusValue[]>
> = {
  REQUESTED: ["SUBMITTED", "WAIVED"],
  SUBMITTED: ["VERIFIED", "REJECTED"],
  VERIFIED: ["REQUESTED"],
  REJECTED: ["SUBMITTED", "WAIVED"],
  WAIVED: ["REQUESTED"],
}

const AGENT_ALLOWED_TARGET_STATUSES: readonly DocumentRequestStatusValue[] = [
  "REQUESTED",
  "SUBMITTED",
]

const ROLE_ALLOWED_TARGET_STATUSES: Readonly<
  Record<Exclude<WorkspaceRoleCode, undefined>, readonly DocumentRequestStatusValue[]>
> = {
  SUPER_ADMIN: DOCUMENT_REQUEST_STATUSES,
  ADMIN: DOCUMENT_REQUEST_STATUSES,
  AGENT: AGENT_ALLOWED_TARGET_STATUSES,
  CUSTOMER: [],
}

function normalizeRoleCode(value: WorkspaceRoleCode): Exclude<WorkspaceRoleCode, undefined> {
  if (value === "SUPER_ADMIN" || value === "ADMIN" || value === "AGENT" || value === "CUSTOMER") {
    return value
  }

  return "CUSTOMER"
}

export function normalizeDocumentRequestStatus(value: unknown): DocumentRequestStatusValue | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (!DOCUMENT_REQUEST_STATUS_SET.has(normalized as DocumentRequestStatusValue)) {
    return null
  }

  return normalized as DocumentRequestStatusValue
}

export function getNextDocumentRequestStatuses(
  status: DocumentRequestStatusValue,
): readonly DocumentRequestStatusValue[] {
  return DOCUMENT_REQUEST_TRANSITION_MAP[status]
}

export function canTransitionDocumentRequestStatus(
  fromStatus: DocumentRequestStatusValue,
  toStatus: DocumentRequestStatusValue,
): boolean {
  if (fromStatus === toStatus) {
    return false
  }

  return DOCUMENT_REQUEST_TRANSITION_MAP[fromStatus].includes(toStatus)
}

export function getRoleAllowedDocumentRequestTargetStatuses(
  roleCode: WorkspaceRoleCode,
): readonly DocumentRequestStatusValue[] {
  const normalizedRole = normalizeRoleCode(roleCode)
  return ROLE_ALLOWED_TARGET_STATUSES[normalizedRole]
}

export function isDocumentRequestStatusAllowedForRole(
  roleCode: WorkspaceRoleCode,
  toStatus: DocumentRequestStatusValue,
): boolean {
  return getRoleAllowedDocumentRequestTargetStatuses(roleCode).includes(toStatus)
}

export function resolveNextDocumentRequestStatus(
  status: DocumentRequestStatusValue,
): DocumentRequestStatusValue | null {
  const next = DOCUMENT_REQUEST_TRANSITION_MAP[status][0]
  return next ?? null
}

export function resolveNextDocumentRequestStatusForRole(
  roleCode: WorkspaceRoleCode,
  status: DocumentRequestStatusValue,
): DocumentRequestStatusValue | null {
  const allowedTargets = getRoleAllowedDocumentRequestTargetStatuses(roleCode)

  for (const candidate of DOCUMENT_REQUEST_TRANSITION_MAP[status]) {
    if (allowedTargets.includes(candidate)) {
      return candidate
    }
  }

  return null
}
