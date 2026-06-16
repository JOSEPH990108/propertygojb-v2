export const BOOKING_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "DOCS_PENDING",
  "DOCS_VERIFIED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const

export type BookingStatusValue = (typeof BOOKING_STATUSES)[number]

export type WorkspaceRoleCode = "SUPER_ADMIN" | "ADMIN" | "AGENT" | "CUSTOMER" | undefined

const BOOKING_STATUS_SET = new Set<BookingStatusValue>(BOOKING_STATUSES)

const BOOKING_TRANSITION_MAP: Readonly<Record<BookingStatusValue, readonly BookingStatusValue[]>> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["PAYMENT_PENDING", "DOCS_PENDING", "REJECTED", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_VERIFIED", "REJECTED", "EXPIRED", "CANCELLED"],
  PAYMENT_VERIFIED: ["DOCS_PENDING", "APPROVED", "REJECTED", "CANCELLED"],
  DOCS_PENDING: ["DOCS_VERIFIED", "PAYMENT_PENDING", "REJECTED", "CANCELLED"],
  DOCS_VERIFIED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CANCELLED"],
  REJECTED: ["UNDER_REVIEW", "CANCELLED"],
  EXPIRED: ["UNDER_REVIEW", "CANCELLED"],
  CANCELLED: [],
}

const AGENT_ALLOWED_TARGET_STATUSES: readonly BookingStatusValue[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "PAYMENT_PENDING",
  "DOCS_PENDING",
  "CANCELLED",
]

const ROLE_ALLOWED_TARGET_STATUSES: Readonly<Record<Exclude<WorkspaceRoleCode, undefined>, readonly BookingStatusValue[]>> = {
  SUPER_ADMIN: BOOKING_STATUSES,
  ADMIN: BOOKING_STATUSES,
  AGENT: AGENT_ALLOWED_TARGET_STATUSES,
  CUSTOMER: [],
}

function normalizeRoleCode(value: WorkspaceRoleCode): Exclude<WorkspaceRoleCode, undefined> {
  if (value === "SUPER_ADMIN" || value === "ADMIN" || value === "AGENT" || value === "CUSTOMER") {
    return value
  }

  return "CUSTOMER"
}

export function normalizeBookingStatus(value: unknown): BookingStatusValue | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (!BOOKING_STATUS_SET.has(normalized as BookingStatusValue)) {
    return null
  }

  return normalized as BookingStatusValue
}

export function getNextBookingStatuses(status: BookingStatusValue): readonly BookingStatusValue[] {
  return BOOKING_TRANSITION_MAP[status]
}

export function canTransitionBookingStatus(fromStatus: BookingStatusValue, toStatus: BookingStatusValue): boolean {
  if (fromStatus === toStatus) {
    return false
  }

  return BOOKING_TRANSITION_MAP[fromStatus].includes(toStatus)
}

export function getRoleAllowedBookingTargetStatuses(roleCode: WorkspaceRoleCode): readonly BookingStatusValue[] {
  const normalizedRole = normalizeRoleCode(roleCode)
  return ROLE_ALLOWED_TARGET_STATUSES[normalizedRole]
}

export function isBookingStatusAllowedForRole(roleCode: WorkspaceRoleCode, toStatus: BookingStatusValue): boolean {
  return getRoleAllowedBookingTargetStatuses(roleCode).includes(toStatus)
}

export function resolveNextBookingStatus(status: BookingStatusValue): BookingStatusValue | null {
  const next = BOOKING_TRANSITION_MAP[status][0]
  return next ?? null
}

export function resolveNextBookingStatusForRole(
  roleCode: WorkspaceRoleCode,
  status: BookingStatusValue,
): BookingStatusValue | null {
  const allowedTargets = getRoleAllowedBookingTargetStatuses(roleCode)

  for (const candidate of BOOKING_TRANSITION_MAP[status]) {
    if (allowedTargets.includes(candidate)) {
      return candidate
    }
  }

  return null
}
