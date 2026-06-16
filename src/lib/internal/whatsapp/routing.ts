export type QueueStrategy = "ROUND_ROBIN" | "FIXED_OWNER" | string

export type QueueMemberSnapshot = {
  id: string
  userId: string
  sortOrder: number
  lastAssignedAt: Date | null
  isActive: boolean
}

export type AssignmentRuleSnapshot = {
  id: string
  priority: number
  isActive: boolean
  matchSourceId: string | null
  matchRegionId: string | null
  matchAreaId: string | null
  matchProjectId: string | null
  matchLanguage: string | null
  queueId: string | null
  assignToUserId: string | null
  fallbackQueueId: string | null
  effectiveFrom: Date | null
  effectiveTo: Date | null
  stopProcessingAfterMatch: boolean
}

export type InboundRoutingContext = {
  sourceId: string | null
  regionId: string | null
  areaId: string | null
  projectId: string | null
  preferredLanguage: string | null
  now: Date
}

function compareNullableDateAsc(left: Date | null, right: Date | null): number {
  if (!left && !right) {
    return 0
  }

  if (!left) {
    return -1
  }

  if (!right) {
    return 1
  }

  return left.getTime() - right.getTime()
}

function normalizeLanguage(value: string | null): string | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized ? normalized : null
}

export function pickQueueMemberForStrategy(
  strategy: QueueStrategy,
  members: readonly QueueMemberSnapshot[],
): QueueMemberSnapshot | null {
  const activeMembers = members.filter((member) => member.isActive)
  if (activeMembers.length === 0) {
    return null
  }

  if (strategy === "FIXED_OWNER") {
    const sorted = [...activeMembers].sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      return left.userId.localeCompare(right.userId)
    })

    return sorted[0] ?? null
  }

  // ROUND_ROBIN is the default strategy for unknown values.
  const sorted = [...activeMembers].sort((left, right) => {
    const byLastAssignedAt = compareNullableDateAsc(left.lastAssignedAt, right.lastAssignedAt)
    if (byLastAssignedAt !== 0) {
      return byLastAssignedAt
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    return left.userId.localeCompare(right.userId)
  })

  return sorted[0] ?? null
}

export function ruleMatchesContext(
  rule: AssignmentRuleSnapshot,
  context: InboundRoutingContext,
): boolean {
  if (!rule.isActive) {
    return false
  }

  if (rule.effectiveFrom && rule.effectiveFrom.getTime() > context.now.getTime()) {
    return false
  }

  if (rule.effectiveTo && rule.effectiveTo.getTime() < context.now.getTime()) {
    return false
  }

  if (rule.matchSourceId && rule.matchSourceId !== context.sourceId) {
    return false
  }

  if (rule.matchRegionId && rule.matchRegionId !== context.regionId) {
    return false
  }

  if (rule.matchAreaId && rule.matchAreaId !== context.areaId) {
    return false
  }

  if (rule.matchProjectId && rule.matchProjectId !== context.projectId) {
    return false
  }

  const ruleLanguage = normalizeLanguage(rule.matchLanguage)
  const contextLanguage = normalizeLanguage(context.preferredLanguage)

  if (ruleLanguage && ruleLanguage !== contextLanguage) {
    return false
  }

  return true
}

export function findMatchedAssignmentRule(
  rules: readonly AssignmentRuleSnapshot[],
  context: InboundRoutingContext,
): AssignmentRuleSnapshot | null {
  const sorted = [...rules].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority
    }

    return left.id.localeCompare(right.id)
  })

  for (const rule of sorted) {
    if (ruleMatchesContext(rule, context)) {
      return rule
    }
  }

  return null
}

export function buildQueueCandidateOrder(input: {
  matchedRule: AssignmentRuleSnapshot | null
  generalQueueId: string | null
}): string[] {
  const candidates = [
    input.matchedRule?.queueId ?? null,
    input.matchedRule?.fallbackQueueId ?? null,
    input.generalQueueId,
  ]

  const output: string[] = []

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    if (!output.includes(candidate)) {
      output.push(candidate)
    }
  }

  return output
}
