# Phase 2F Admin Users Permission Runtime Verification Report

Date: 2026-06-13
Phase: O10-T04
Scope: Runtime verification for ADMIN role-change guardrails and allow/deny matrix in admin users flow
Status: Completed

## 1. Verification Summary
Runtime verification was executed against /admin/users using an authenticated ADMIN session.

Result:
- Policy-denied rows render disabled action with explicit reason: PASSED.
- Self-role-change row renders disabled action with explicit reason: PASSED.
- CUSTOMER target role options constrained to AGENT only: PASSED.
- AGENT target role options constrained to CUSTOMER only: PASSED.
- Allow-path mutation CUSTOMER -> AGENT: PASSED.
- Allow-path mutation AGENT -> CUSTOMER (revert): PASSED.

## 2. Environment Notes
Runtime environment:
- Local app URL: http://localhost:3001/admin/users
- Auth context: signed-in ADMIN user

Automation/tooling behavior:
- Standard click interactions were intermittently unstable in this environment for dialog controls.
- Verification used Playwright DOM-click fallback (node.click via evaluate) where necessary to execute deterministic mutation checks.

## 3. Scenarios and Outcomes
### 3.1 Denied rows show explicit policy reasons
Observed rows:
- ADMIN target row(s): disabled Change Role with message "This role change is not allowed by policy."
- Self row: disabled Change Role with message "You cannot modify your own role."

Outcome:
- PASSED.
- Runtime snapshot showed blockedPolicyCount=2 and selfBlockedCount=1.

### 3.2 CUSTOMER row option constraint
Target row:
- phone-6581234503@phone.local (role CUSTOMER)

Observed dialog options:
- ["AGENT"]

Outcome:
- PASSED.
- Runtime matrix enforcement in UI matched backend permission payload.

### 3.3 AGENT row option constraint
Target row:
- phone-6581234503@phone.local after temporary CUSTOMER -> AGENT mutation

Observed dialog options:
- ["CUSTOMER"]

Outcome:
- PASSED.
- Runtime matrix enforcement in UI matched backend permission payload.

### 3.4 Allow-path mutation: CUSTOMER -> AGENT
Method:
- Opened dialog for phone-6581234503@phone.local.
- Selected AGENT, entered reason note, triggered Save.

Observed evidence:
- Success message: "Role updated from CUSTOMER to AGENT."
- Table role updated to AGENT.
- updated_at advanced to 13 Jun 2026, 3:02 pm.

Outcome:
- PASSED.

### 3.5 Revert mutation: AGENT -> CUSTOMER
Method:
- Reopened dialog for same user.
- Selected CUSTOMER, entered reason note, triggered Save.

Observed evidence:
- Success message: "Role updated from AGENT to CUSTOMER."
- Table role restored to CUSTOMER.

Outcome:
- PASSED.

## 4. Constraints and Residual Risk
Constraints:
- SUPER_ADMIN runtime target path is not directly mutable in MVP by design; runtime verification focused on ADMIN matrix paths present in dataset.

Residual risk:
- SUPER_ADMIN boundary behavior is covered by backend policy checks and automated tests, but no live SUPER_ADMIN-row mutation was performed in this runtime session.

## 5. Verification Commands
- npm run test -- src/lib/admin/users/role-policy.test.ts: PASSED (8 tests)
- npm run lint: PASSED
- npx tsc --noEmit: PASSED

## 6. Conclusion
O10-T04 runtime verification is complete for ADMIN-scoped role-change guardrails and matrix enforcement in the current environment.

Combined with O10-T05 automated policy tests, the O10 hardening scope has verification evidence for both runtime behavior and resolver-level regression coverage.
