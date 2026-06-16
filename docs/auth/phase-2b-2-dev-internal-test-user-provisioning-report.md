# Phase 2B.2 Dev Internal Test User Provisioning Report

Date: 2026-06-02
Phase: 2B.2
Scope: Development-only provisioning helper
Status: Implemented for local testing

## 1) Script purpose
Provide a dev-only command to promote an existing user to an internal role for local route-guard and sign-out verification.

Supported internal target roles:
- AGENT
- ADMIN
- SUPER_ADMIN

Key design intent:
- reuse existing users already created by public Google OAuth or phone OTP flows
- avoid public promotion endpoints
- avoid admin UI implementation in this phase

## 2) Implemented artifact
- src/db/scripts/dev-provision-internal-user.ts

Optional package command:
- db:dev:provision-internal-user

## 3) Dev-only guard
The script fails closed unless APP_ENV resolves to development.

Guard behavior:
- APP_ENV or NODE_ENV must resolve to development
- non-development execution exits with failure

This prevents accidental production role promotion via this helper.

## 4) Inputs and role controls
Input channels:
- CLI args:
  - --email or -e
  - --phone or -p
  - --role or -r
- Environment variables:
  - TARGET_USER_EMAIL
  - TARGET_USER_PHONE
  - TARGET_ROLE

Target role policy:
- Only AGENT, ADMIN, SUPER_ADMIN are accepted.
- CUSTOMER assignment is intentionally not supported in this helper.

SUPER_ADMIN safety gate:
- CONFIRM_SUPER_ADMIN=true is required when TARGET_ROLE=SUPER_ADMIN.
- Missing confirmation fails closed.

## 5) Behavior summary
- Find existing user by email and/or phone number.
- Find target role by role code in roles table.
- Update users.roleId to target role id.
- Print safe output only:
  - user id
  - target role
  - success/failure message

Security output behavior:
- does not print OTP values
- does not print session tokens
- does not print cookie values
- does not print secrets

## 6) Audit stance for MVP
Audit logging is deferred for this dev-only helper.

Important note:
- Production role changes must be moved to an audited admin workflow later.

## 7) Usage examples
Using CLI args:

```bash
APP_ENV=development npm run db:dev:provision-internal-user -- --email test.agent@example.com --role AGENT
```

```bash
APP_ENV=development npm run db:dev:provision-internal-user -- --phone +60123456789 --role ADMIN
```

SUPER_ADMIN with explicit confirmation:

```bash
APP_ENV=development CONFIRM_SUPER_ADMIN=true npm run db:dev:provision-internal-user -- --email test.superadmin@example.com --role SUPER_ADMIN
```

Using env-only inputs:

```bash
APP_ENV=development TARGET_USER_EMAIL=test.admin@example.com TARGET_ROLE=ADMIN npm run db:dev:provision-internal-user
```

## 8) Manual test plan for AGENT/ADMIN route guards
After provisioning test accounts:
- Login provisioned AGENT and verify /agent access.
- Verify AGENT is redirected from /admin to /agent.
- Login provisioned ADMIN and verify /admin access.
- Verify ADMIN is redirected from /agent to /admin.
- Verify auth page redirect behavior for provisioned internal users.
- Verify sign-out flow still redirects to /login.

## 9) Safety rules recap
- Development-only execution.
- No public promotion endpoint.
- No admin UI in this phase.
- No DB schema changes.
- No migrations.
- No production use of this helper.
