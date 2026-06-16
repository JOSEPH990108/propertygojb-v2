# Database Design Rules

Last updated: 2026-06-12

1. No schema change without explicit migration impact notes.
2. Keep constraints and indexes aligned with query patterns.
3. Validate backward compatibility for active runtime paths.
4. Keep seed execution deterministic and dependency-ordered.
5. Document rollback and data safety assumptions.

## Required DB checks
- migration SQL reviewed
- seed compatibility reviewed
- runtime query compatibility verified

