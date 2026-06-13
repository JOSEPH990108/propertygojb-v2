# Global Rules

Last updated: 2026-06-12

## Core principles
1. Analyze existing implementation before creating code.
2. Prefer small, reviewable changes over broad rewrites.
3. Keep authorization server-side.
4. Treat database changes as high impact and document migration effects.
5. Keep docs synchronized with implementation.

## Mandatory checks per implementation step
1. git status --short
2. npm run lint
3. npx tsc --noEmit
4. feature-specific verification (manual or automated)

## Orchestrator alignment
- Current orchestration control files live in docs/ai-orchestrator.
- If guidance conflicts, runtime code is source of truth.
