# Phase 2M UI UX Revamp Planning Specification

Date: 2026-06-13
Phase task: O17-T01
Status: Completed
Scope: Post-feature-freeze design-system and UI UX revamp planning only (no feature expansion)

## 1. O17 planning objective

Define a design-system-first execution plan that upgrades visual quality, interaction quality, and responsive usability across public and internal surfaces while preserving all existing workflow behavior.

Mandatory guardrail:
- No feature expansion and no business-logic rewrite in O17-T01, O17-T02, or O17-T03.

## 2. Non-goals and behavior lock

Out of scope for O17 planning and implementation:
- database schema changes,
- backend workflow policy changes,
- route guard or authorization policy changes,
- server-action payload contract changes,
- route ownership changes.

Behavior lock rules:
- Keep route ownership and role guards exactly as implemented in src/app/(internal)/admin/layout.tsx and src/app/(internal)/agent/layout.tsx.
- Keep navigation authorization boundary unchanged (src/config/internal-navigation.ts remains UI-only visibility; server guards remain source of truth).
- Keep public funnel action contracts in src/lib/public/inquiries/server-actions.ts unchanged.

## 3. Current architecture anchors

The revamp plan is anchored to existing reusable UI infrastructure:
- Tokenized CSS variable system in src/app/globals.css.
- shadcn radix-nova component baseline in components.json.
- Shared internal shell composition in src/components/internal/shell/internal-shell.tsx.
- Shared primitives in src/components/ui/* (button, card, table, input, select, sidebar, badge, dialog, sheet).

Planning implication:
- O17 must extend existing primitives and tokens rather than introduce parallel UI stacks.

## 4. Research synthesis from provided design boards

The uploaded research boards indicate six high-value revamp themes:

1. Foundation-first systemization
- Full tokenized approach for color, spacing, radius, shadow, and motion before page-level redesign.

2. Sidebar as primary interaction backbone
- Multiple sidebar modes (expanded, collapsed, floating, mobile drawer).
- Strong focus on active states, nested behavior, tooltip behavior, and resize interaction.

3. State-rich interaction language
- Clear defaults/hover/active/focus/disabled/loading/locked states for nav and form controls.

4. Workflow and form maturity
- Stepper, multi-step forms, validation states, approvals, status pipelines, and confirmations.

5. Data-heavy enterprise components
- Dense tables, command palette, timeline, kanban, drawers, and modal states.

6. Mobile parity
- Bottom navigation, swipe interactions, mobile lists, and responsive drawer transitions.

Planning implication:
- O17 design work should prioritize consistency and state fidelity over decorative styling.

## 5. ui-ux-pro-max suitability decision

Local availability:
- Toolkit exists at .github/prompts/ui-ux-pro-max with data and scripts.

Suitability assessment:
- Suitable as design intelligence and reference dataset.
- Not suitable as direct autopilot source of truth for this repository.

Observed limitation during planning:
- Full design-system generation can drift to mismatched patterns/typography for enterprise real-estate admin workflows.

Adoption policy for O17:
- Use stack and domain searches (style/color/ux/shadcn/nextjs) for curated ideas.
- Keep repository-native token and component architecture as implementation source of truth.

## 6. Theme proposal set (curated)

| Option | Theme name | Palette direction | Typography direction | Interaction direction | Best fit |
| --- | --- | --- | --- | --- | --- |
| A | Clarity Grid | Slate and cobalt base with amber signal accents (high contrast, enterprise-safe) | Heading: Space Grotesk, Body: Manrope | Crisp transitions, strong focus rings, restrained elevation | Internal admin and agent data-heavy workflows |
| B | Trust Teal | Deep teal and cyan with neutral surfaces and blue actions | Heading: Sora, Body: Source Sans 3 | Soft transitions, clearer supportive hints, calmer status tones | Public marketing and inquiry funnels |
| C | Swiss Signal | Monochrome neutral system with single cyan action accent and strong typography hierarchy | Heading: IBM Plex Sans, Body: IBM Plex Sans | Minimal motion, strict layout rhythm, document-like clarity | Reporting views and dense operations tables |

Recommended execution theme:
- Option A Clarity Grid as master direction.

Reason:
- Best alignment with existing enterprise workflows, table-heavy interfaces, and current neutral token baseline.
- Lowest behavior regression risk while still producing meaningful visual upgrade.

## 7. Token architecture plan

### 7.1 Primitive layer (foundation)
- Color scale: neutral, brand primary, accent, success, warning, destructive, info.
- Spacing scale: 4-based compact-to-comfortable rhythm for desktop and mobile.
- Radius scale: preserve existing radius base variable, extend consistently for cards, controls, chips.
- Shadow scale: 0 to 4 levels with explicit usage rules by elevation.
- Motion scale: fast (120ms), standard (180ms), expressive (260ms); include reduced-motion fallback.

### 7.2 Semantic layer
- Surface tokens: app background, elevated card, muted section, overlay.
- Text tokens: primary, secondary, tertiary, inverse.
- Border tokens: subtle, default, strong, focus.
- State tokens: hover, active, selected, disabled, loading.
- Sidebar tokens: active item, hover item, rail, section label, badge.

### 7.3 Component layer
- Button variants map to semantic tokens, not raw color values.
- Input/select/textarea share unified control-state token map.
- Table row, header, zebra, selected, and hover states use shared table-state tokens.
- Badge/status chips map to semantic status tokens with contrast guarantees.

## 8. Component and surface migration matrix

| Surface group | Primary files | Change scope | Risk level | Mitigation |
| --- | --- | --- | --- | --- |
| Public shell and hero composition | src/components/layout/public-shell.tsx, src/app/(public)/*.tsx | Typography hierarchy, spacing, card rhythm, CTA emphasis | Low | Keep route structure and form actions unchanged |
| Public listing/detail components | src/components/public/project-card.tsx, src/app/(public)/projects/**/*.tsx | Card media rhythm, badges, filters, detail section hierarchy | Medium | Preserve search params and inquiry/book-viewing action payloads |
| Internal shell | src/components/internal/shell/internal-shell.tsx, internal-sidebar.tsx, internal-topbar.tsx | Sidebar/topbar visual re-architecture and responsive behavior | Medium | Keep navigation arrays, labels, href values, and guards unchanged |
| Dense internal tables | src/components/admin/**/*table*.tsx, src/app/(internal)/**/page.tsx | Table density, sticky header treatment, action affordance clarity | Medium | No changes to data loaders, mutations, or status transition logic |
| Form workflows | src/components/public/public-*.tsx, src/components/admin/projects/project-form.tsx, internal workflow forms | Unified field spacing, validation visuals, inline helper hierarchy | Medium | Preserve field names, server-action handlers, and error keys |
| Shared UI primitives | src/components/ui/button.tsx, card.tsx, input.tsx, select.tsx, table.tsx, sidebar.tsx, badge.tsx | Token remapping, variant updates, state consistency | Medium | Ship incremental PR-sized changes and run full gates each step |

## 9. O17 execution sequence

### O17-T02 Public surfaces first
1. Apply token updates to global/public shell-safe primitives.
2. Revamp home, projects listing, project detail, contact, and book-viewing pages.
3. Verify inquiry and viewing submission UX states (idle/loading/success/error) without changing backend contracts.

### O17-T03 Internal admin and agent surfaces
1. Revamp internal shell with improved sidebar interaction model and responsive drawer behavior.
2. Standardize table, filter bar, action rows, and form controls across admin and agent modules.
3. Preserve all role/permission and status-transition behavior.

### O17-T04 Regression and accessibility verification
1. Execute lint, typecheck, and tests.
2. Execute targeted workflow regression scenarios for public funnel and internal status actions.
3. Execute accessibility checks: keyboard navigation, visible focus, contrast, reduced-motion behavior.

## 10. Quality gates and regression checklist

Required technical gates:
- npm run lint
- npx tsc --noEmit
- npm run test

Required manual UX regression gates:
- Public inquiry form success and validation error states.
- Public viewing-request form success and validation error states.
- Internal lead, booking, and document status actions still complete correctly.
- Sidebar keyboard and mobile drawer behavior preserve navigability.
- No hidden content under sticky/fixed navigation at major breakpoints.

Required accessibility checks:
- Focus order follows visual order.
- Focus indicator visibly distinct on all interactive controls.
- Text contrast meets at least WCAG AA in both light and dark themes.
- Motion fallbacks present for users with reduced-motion preferences.

## 11. O17-T01 acceptance criteria

O17-T01 is complete when all conditions are met:
- Design-system and revamp plan is documented with explicit non-goal boundaries.
- Theme proposal set with one selected direction is documented.
- Token architecture and migration matrix are defined.
- O17-T02/O17-T03/O17-T04 execution sequence and quality gates are locked.
- Orchestrator trackers are updated (backlog, roadmap, progress, decision).

## 12. Deliverables produced by O17-T01

- docs/internal/phase-2m-uiux-revamp-planning-spec.md (this document)
- docs/ai-orchestrator/task-backlog.md (O17-T01 status update)
- docs/ai-orchestrator/implementation-roadmap.md (O17 status update)
- docs/ai-orchestrator/progress-log.md (O17-T01 completion record)
- docs/ai-orchestrator/decision-log.md (O17 planning decision record)
