# Phase 2L Public Funnel Verification Report

Date: 2026-06-13
Phase: O16
Tasks covered: O16-T02, O16-T03, O16-T04
Status: Completed

## 1) Scope verified

- Public routes replaced from placeholder shells:
  - /
  - /projects
  - /projects/[slug]
  - /contact
  - /book-viewing
  - /about
- Public backend primitives verified:
  - published project discovery and detail loaders
  - contact inquiry capture
  - book-viewing request capture
- Persistence path verified into:
  - leads
  - inquiries
  - lead_activities
  - audit_logs

## 2) Build and quality verification

- npm run lint: PASSED
- npx tsc --noEmit: PASSED
- npm run test: PASSED (9 files, 55 tests)

## 3) Runtime route verification

Environment:
- Existing dev server detected at http://localhost:3001
- Demo project publish flag enabled for positive-path route checks:
  - project slug: demo-project
  - isPublished: true
- Post-check cleanup applied:
  - demo-project isPublished restored to false

Route checks:
- /:
  - hero + featured project cards rendered
  - quick inquiry form rendered
- /projects:
  - search/filter controls rendered
  - published listing rendered (Demo Project)
- /projects/demo-project:
  - project details rendered (pricing, overview, layout section)
  - project-bound inquiry form rendered
  - project-bound book-viewing form rendered
- /contact:
  - channel panel + inquiry form rendered
- /book-viewing:
  - process steps + viewing request form rendered
- /about:
  - non-placeholder brand/about content + CTA links rendered

## 4) Runtime form submissions verified

### 4.1 Contact page submission

Input sample:
- fullName: Runtime Contact Lead
- phoneNumber: +601112345678
- email: runtime.contact@example.com
- message: Need latest package and rebate details for demo project.

Observed UI result:
- Success feedback shown:
  - Inquiry submitted. Our team will contact you soon.

### 4.2 Book-viewing page submission

Input sample:
- fullName: Runtime Viewing Lead
- phoneNumber: +601112345679
- email: runtime.viewing@example.com
- preferredVisitDate: 2026-07-01
- preferredVisitTime: 10:30
- partySize: 2
- message: Interested in weekend slot if available.

Observed UI result:
- Success feedback shown:
  - Viewing request submitted. Our team will confirm your slot shortly.

### 4.3 Project detail inquiry submission (fixed project id path)

Input sample:
- route: /projects/demo-project
- fullName: Runtime Project Inquiry
- phoneNumber: +601112345680
- email: runtime.project@example.com
- message: Checking project-specific inquiry path with fixed project id.

Observed UI result:
- Success feedback shown:
  - Inquiry submitted. Our team will contact you soon.

## 5) Database persistence evidence

Captured evidence rows (runtime sample):

- inquiries:
  - id 7e04334a-e4d9-43e9-ade1-54e58bfd86c7
    - requesterEmail runtime.project@example.com
    - channel WEB_FORM
    - projectId a6141b28-b3d0-4927-97be-fccf653e3715 (demo-project)
    - payload.inquiryType CONTACT
  - id b38736f1-8e2b-4eef-b7c4-72de50ac1cd9
    - requesterEmail runtime.viewing@example.com
    - channel WEB_FORM
    - projectId null
    - payload.inquiryType BOOK_VIEWING
    - payload.preferredVisitDate 2026-07-01
    - payload.preferredVisitTime 10:30
  - id e4e5f90a-dc9d-4e4d-a911-c8245798daef
    - requesterEmail runtime.contact@example.com
    - channel WEB_FORM
    - projectId null
    - payload.inquiryType CONTACT

- leads:
  - id ac1c08fd-e9db-469d-b62a-6363974e6de9
    - fullName Runtime Project Inquiry
    - phone +601112345680
    - email runtime.project@example.com
    - status NEW
  - id bee15a0f-055e-46bd-bebc-b06a07a0d60a
    - fullName Runtime Viewing Lead
    - phone +601112345679
    - email runtime.viewing@example.com
    - status NEW
  - id 4fbc1916-567f-4743-8da5-f01ddad2b363
    - fullName Runtime Contact Lead
    - phone +601112345678
    - email runtime.contact@example.com
    - status NEW

- lead_activities:
  - id a536bdf9-28a2-4472-9309-7cc77178c451
    - activityType PUBLIC_CONTACT_SUBMITTED
    - leadId ac1c08fd-e9db-469d-b62a-6363974e6de9
    - metadata.projectSlug demo-project
  - id f0663c1e-f37c-46cc-91c4-e4ab856971f1
    - activityType PUBLIC_VIEWING_REQUESTED
    - leadId bee15a0f-055e-46bd-bebc-b06a07a0d60a
  - id 03d8b268-c46e-452e-8d79-e6119e0805a2
    - activityType PUBLIC_CONTACT_SUBMITTED
    - leadId 4fbc1916-567f-4743-8da5-f01ddad2b363

- audit_logs:
  - id c0d907e1-af6a-44d4-bd84-eac986632c4b
    - actionType PUBLIC_INQUIRY_CREATED
    - entityId 7e04334a-e4d9-43e9-ade1-54e58bfd86c7
    - sourceApp PUBLIC_WEB
    - afterJson.projectId a6141b28-b3d0-4927-97be-fccf653e3715
  - id 61942112-d63b-4e37-b626-df041f575e24
    - actionType PUBLIC_INQUIRY_CREATED
    - entityId b38736f1-8e2b-4eef-b7c4-72de50ac1cd9
    - sourceApp PUBLIC_WEB
  - id 1aac1d77-4594-4490-b6d1-afb837f606fb
    - actionType PUBLIC_INQUIRY_CREATED
    - entityId e4e5f90a-dc9d-4e4d-a911-c8245798daef
    - sourceApp PUBLIC_WEB

## 6) Decision follow-through

- Customer account MVP remains deferred in O16 per phase specification.
- O16 completion validates public discovery and inquiry funnel without authenticated customer workspace scope expansion.

## 7) O16 completion conclusion

- O16-T02 acceptance: satisfied.
- O16-T03 acceptance: satisfied.
- O16-T04 acceptance: satisfied.
- Public/customer funnel baseline is operational and integrated into internal lead workflow persistence.
