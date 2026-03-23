# Architecture & coding principles (for agents)

Short reference for AI agents and developers working in this repository. Use it with `PROJECT_OVERVIEW.md` and `context.md` for product-specific rules.

---

## Mindset

- **Intent over syntax**: Match the author’s style and existing abstractions before inventing new patterns.
- **Smallest viable change**: Fix or extend only what the task requires; avoid drive-by refactors and unrelated files.
- **Explainability**: Another reader (human or agent) should see *why* a non-obvious line exists—prefer clarity over cleverness.

---

## Classic principles (acronyms)

### SOLID (object-oriented design)

- **S — Single responsibility**: One module/class/function should have one reason to change. Split when responsibilities diverge.
- **O — Open/closed**: Prefer extending behavior via composition or new types over editing stable core logic repeatedly.
- **L — Liskov substitution**: Subtypes must honor contracts of their base types; don’t break callers’ assumptions.
- **I — Interface segregation**: Small, focused interfaces beat “god” objects that every caller must depend on.
- **D — Dependency inversion**: Depend on abstractions (ports) where it reduces coupling; concrete adapters at the edges.

### DRY — Don’t repeat yourself

- **Rule**: Each piece of knowledge should have a single authoritative place.
- **Caveat**: Don’t deduplicate until the *second* real duplication shows the right abstraction; premature DRY creates wrong abstractions.

### KISS — Keep it simple, stupid

- Prefer the straightforward algorithm, naming, and control flow that passes tests and review.
- If you need a comment to explain control flow, consider simplifying the code instead.

### YAGNI — You aren’t gonna need it

- Don’t build features, configurability, or “future-proof” layers until there is a concrete need.
- Especially important for agents: resist adding generic frameworks for one-off needs.

---

## Structure & boundaries

- **Separation of concerns**: UI, HTTP/API, validation, persistence, and domain rules should not leak into each other unnecessarily.
- **Thin edges, explicit contracts**: Route handlers orchestrate; heavy logic lives in services/helpers with clear inputs/outputs.
- **Single source of truth**: Schemas, validation, and stored shape should stay aligned (see this repo’s validation + models).
- **Fail fast**: Validate early; return explicit errors at boundaries instead of letting bad data propagate.

---

## Naming & readability

- **Names encode intent**: Prefer `rebuildDomainIndex` over `doStuff`.
- **Consistent vocabulary**: Reuse terms from the codebase (domain, level, `process_steps`, etc.).
- **Avoid magic**: Named constants for repeated literals; enums or union types where the set is closed.

---

## Functions & modules

- **Small functions**: One level of abstraction per function; extract when a block needs a comment to describe *what* it does.
- **Pure helpers where possible**: Easier to test and reason about; isolate I/O and side effects.
- **Composition over inheritance**: Prefer composing small pieces; inheritance only when the hierarchy is stable and shallow.

---

## Data & APIs

- **Validate at the boundary**: Parse and validate external input before core logic (this project: `validate` + dictionary conversion before Mongo).
- **Stable shapes**: Prefer additive schema changes; document breaking changes if unavoidable.
- **Idempotency**: For writes that may retry, design operations so repeating them does not corrupt state (when applicable).

---

## Errors & observability

- **Actionable errors**: Messages should say what failed and what to fix, without leaking secrets.
- **Log at appropriate levels**: Errors for real failures; avoid noisy logs in hot paths.
- **Don’t swallow exceptions**: Catch only where you can handle or enrich; otherwise let them surface or wrap with context.

---

## Security & safety (baseline)

- **Least privilege**: Don’t broaden permissions or expose internal details without need.
- **Secrets**: Never commit keys; use env/config as the project already does.
- **Trust boundaries**: Treat all client and file input as untrusted until validated.

---

## Testing & change safety

- **Regression mindset**: If you change behavior, know how to verify it (automated test, manual checklist, or both).
- **Tight feedback**: Prefer small commits and checks that fail fast over large batches.

---

## Anti-patterns to avoid

- **God objects** and **spaghetti modules** that mix routing, DB, and business rules.
- **Copy-paste** across features instead of a shared helper when duplication is real and stable.
- **Speculative generality**: abstractions “for every possible future.”
- **Comments that restate the code**; comments should capture *why* or non-obvious constraints.

---

## This repository (quick anchors)

- Process levels (L1–L3, SOP), validation before persistence, dictionary ID/label conversion, soft delete via `archived`, and index rebuilding are central—see `PROJECT_OVERVIEW.md`.
- When editing: follow existing patterns in `server/routes/processes.js`, `server/validation/`, and `src/components/editor/` rather than introducing parallel conventions.

---

*Keep this file factual and compact; extend it only when a principle is repeatedly needed and not already covered elsewhere.*
