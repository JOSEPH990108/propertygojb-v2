# Phase 2A OTP Persistence Feasibility Check

Date: 2026-05-29
Scope: Read-only feasibility review for Phase 2A.1
Status: Requires DB addendum decision before OTP implementation
Reference:
- src/db/schema/identity-auth.ts
- docs/auth/phase-2a-auth-access-integration-spec.md

## Summary
The current Phase 1A `verification` table can support part of OTP needs (`value` and `expiresAt`) but cannot safely support full Phase 2A OTP security requirements without additional persistence fields or equivalent audited design.

## Current verification table shape
Current columns:
- `id`
- `identifier`
- `value`
- `expiresAt`
- `createdAt`
- `updatedAt`

## Requirement-by-requirement check
1. `hashed OTP`
- Possible in principle by storing a hash in `value`.

2. `expiresAt`
- Supported via existing `expiresAt` column.

3. `attempt count`
- Not supported by explicit column.
- Unsafe to rely on ad-hoc encoding inside `value` for concurrent attempt updates.

4. `consumed/replay protection`
- Not supported by explicit consumed marker (`consumedAt`, `isConsumed`, etc.).
- Deleting rows as replay protection weakens auditability and race safety.

5. `resend cooldown`
- Not supported by explicit cooldown metadata.

6. `lockout metadata`
- Not supported by explicit lockout fields.

## Decision
Phase 2A OTP request/verify implementation must pause until a small reviewed Phase 2A DB addendum is approved for secure OTP persistence metadata.

Implementation gate:
- OTP implementation must not proceed until a reviewed DB addendum exists or another safe persistence design is formally approved.

## Explicit constraints reaffirmed
- No OTP final implementation using memory-only state.
- No OTP endpoint implementation in Phase 2A.1.
- No schema/migration changes were made in this task.
