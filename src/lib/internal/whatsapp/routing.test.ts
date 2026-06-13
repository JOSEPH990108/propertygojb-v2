import { describe, expect, it } from "vitest"

import {
  buildQueueCandidateOrder,
  findMatchedAssignmentRule,
  pickQueueMemberForStrategy,
  ruleMatchesContext,
  type AssignmentRuleSnapshot,
} from "@/lib/internal/whatsapp/routing"

const NOW = new Date("2026-06-12T10:00:00.000Z")

function buildRule(overrides: Partial<AssignmentRuleSnapshot> = {}): AssignmentRuleSnapshot {
  return {
    id: "rule-1",
    priority: 100,
    isActive: true,
    matchSourceId: null,
    matchRegionId: null,
    matchAreaId: null,
    matchProjectId: null,
    matchLanguage: null,
    queueId: null,
    assignToUserId: null,
    fallbackQueueId: null,
    effectiveFrom: null,
    effectiveTo: null,
    stopProcessingAfterMatch: true,
    ...overrides,
  }
}

describe("whatsapp routing helper", () => {
  it("selects round-robin member by oldest assignment", () => {
    const selected = pickQueueMemberForStrategy("ROUND_ROBIN", [
      {
        id: "m-1",
        userId: "user-2",
        sortOrder: 2,
        lastAssignedAt: new Date("2026-06-12T09:30:00.000Z"),
        isActive: true,
      },
      {
        id: "m-2",
        userId: "user-1",
        sortOrder: 1,
        lastAssignedAt: null,
        isActive: true,
      },
    ])

    expect(selected?.id).toBe("m-2")
  })

  it("selects fixed-owner member by sort order", () => {
    const selected = pickQueueMemberForStrategy("FIXED_OWNER", [
      {
        id: "m-1",
        userId: "user-2",
        sortOrder: 2,
        lastAssignedAt: null,
        isActive: true,
      },
      {
        id: "m-2",
        userId: "user-1",
        sortOrder: 1,
        lastAssignedAt: new Date("2026-06-12T09:00:00.000Z"),
        isActive: true,
      },
    ])

    expect(selected?.id).toBe("m-2")
  })

  it("falls back to round-robin behavior for unknown strategy", () => {
    const selected = pickQueueMemberForStrategy("CUSTOM_STRATEGY", [
      {
        id: "m-1",
        userId: "user-2",
        sortOrder: 2,
        lastAssignedAt: new Date("2026-06-12T09:00:00.000Z"),
        isActive: true,
      },
      {
        id: "m-2",
        userId: "user-1",
        sortOrder: 1,
        lastAssignedAt: null,
        isActive: false,
      },
      {
        id: "m-3",
        userId: "user-3",
        sortOrder: 3,
        lastAssignedAt: new Date("2026-06-12T08:00:00.000Z"),
        isActive: true,
      },
    ])

    expect(selected?.id).toBe("m-3")
  })

  it("matches rules against routing context", () => {
    const rule = buildRule({
      matchSourceId: "source-1",
      matchLanguage: "EN",
      effectiveFrom: new Date("2026-06-11T00:00:00.000Z"),
      effectiveTo: new Date("2026-06-13T00:00:00.000Z"),
    })

    const matched = ruleMatchesContext(rule, {
      sourceId: "source-1",
      regionId: null,
      areaId: null,
      projectId: null,
      preferredLanguage: "en",
      now: NOW,
    })

    expect(matched).toBe(true)
  })

  it("rejects unmatched rules and returns null when no rule applies", () => {
    const inactiveRule = buildRule({
      id: "rule-inactive",
      isActive: false,
      matchSourceId: "source-1",
    })

    const expiredRule = buildRule({
      id: "rule-expired",
      matchSourceId: "source-1",
      effectiveTo: new Date("2026-06-10T00:00:00.000Z"),
    })

    const languageMismatchRule = buildRule({
      id: "rule-language",
      matchSourceId: "source-1",
      matchLanguage: "ms",
    })

    const context = {
      sourceId: "source-1",
      regionId: null,
      areaId: null,
      projectId: null,
      preferredLanguage: "en",
      now: NOW,
    }

    expect(ruleMatchesContext(inactiveRule, context)).toBe(false)
    expect(ruleMatchesContext(expiredRule, context)).toBe(false)
    expect(ruleMatchesContext(languageMismatchRule, context)).toBe(false)

    expect(
      findMatchedAssignmentRule([inactiveRule, expiredRule, languageMismatchRule], context),
    ).toBeNull()
  })

  it("picks the highest-priority matched rule", () => {
    const matchedRule = findMatchedAssignmentRule(
      [
        buildRule({ id: "rule-b", priority: 200, matchSourceId: "source-1" }),
        buildRule({ id: "rule-a", priority: 100, matchSourceId: "source-1" }),
      ],
      {
        sourceId: "source-1",
        regionId: null,
        areaId: null,
        projectId: null,
        preferredLanguage: null,
        now: NOW,
      },
    )

    expect(matchedRule?.id).toBe("rule-a")
  })

  it("builds queue candidate order without duplicates", () => {
    const rule = buildRule({
      queueId: "queue-1",
      fallbackQueueId: "queue-1",
    })

    expect(
      buildQueueCandidateOrder({
        matchedRule: rule,
        generalQueueId: "queue-2",
      }),
    ).toEqual(["queue-1", "queue-2"])
  })
})
