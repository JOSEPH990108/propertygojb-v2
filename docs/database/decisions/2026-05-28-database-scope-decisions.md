# Database Scope Decisions

Date: 2026-05-28
Context: Final owner decisions for PropertyGo JB v2 database scope based on implementation plan.
Source plan: docs/database/implementation-plan.md
Status: Approved and locked for implementation planning.

## Decision 1: Booking model from day one
Decision:
- Booking will be first-class from day one.

Implication:
- bookings and related lifecycle tables are Phase 1 mandatory scope.
- units is inventory state and should not be the sole booking transaction source.

## Decision 2: WhatsApp Phase 1 scope
Decision:
- Phase 1 WhatsApp supports inbound capture, lead creation, assignment, and routing audit.
- Full two-way messaging and template automation move to Phase 2.

Implication:
- Phase 1 requires conversation intake and routing auditability.
- Advanced outbound messaging automation is deferred.

## Decision 3: RBAC depth from day one
Decision:
- RBAC uses permission-level design from day one with a small initial permission set.

Implication:
- permissions, role_permissions, and user_permissions are required in Phase 1.
- Permission catalog can grow incrementally after launch.

## Decision 4: Geo slug uniqueness strategy
Decision:
- Geo slugs are parent-scoped, not globally unique.

Implication:
- region slug uniqueness should be scoped to state.
- area slug uniqueness should be scoped to region.

## Decision 5: Document security and verification fields
Decision:
- Documents should include checksum, scan status, verification status, reviewer, timestamps, and access logs where practical.

Implication:
- documents and verification/access log tables are required in Phase 1C.
- document flow must support auditable review lifecycle.

## Decision 6: Referral rewards phase
Decision:
- Referral rewards are deferred to Phase 2.

Implication:
- rewards module is excluded from Phase 1 delivery scope.

## Decision 7: Commission and payout phase
Decision:
- Commission and payout modules are deferred to Phase 2.

Implication:
- agent commission automation is not part of Phase 1 MVP.

## Decision 8: External content launch approach
Decision:
- External content uses minimal CMS-like project content sections for launch.

Implication:
- only lightweight project content structures are introduced in Phase 1.
- full content expansion remains a later enhancement.

## Decision 9: Admin bootstrap credentials policy
Decision:
- Admin bootstrap credentials are dev-only and must never be hardcoded for production.

Implication:
- production bootstrap must use secure non-hardcoded provisioning.
- seed/bootstrap scripts must enforce environment-aware safety rules.

## Decision 10: Reset safety policy
Decision:
- Reset scripts are local/dev only with hard safety guards.

Implication:
- destructive reset must be blocked in non-dev contexts.
- explicit guardrails and confirmations are required before any destructive execution.

---

## Effective scope summary
Phase 1 is now explicitly composed of:
- 1A Core DB foundation
- 1B Lead plus WhatsApp routing
- 1C Booking plus documents
- 1D Governance

Phase 2 includes:
- Full WhatsApp two-way and template automation
- Referral rewards module
- Commission and payout module
- Broader content and optimization expansions
