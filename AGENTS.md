# AGENTS.md

This file documents conventions, commands, and style guidelines for agents operating in this repository. It is intended for both human contributors and automatic coding agents that participate in build, test, refactor, and documentation tasks.

Scope and audience

- Target audience: developers and AI agents working on the aITok LibreChat Merge project.
- Purpose: provide canonical commands for common tasks, enforce code style expectations, and describe how to collaborate with automated agents.

Table of contents

- Project overview and workspace boundaries
- Build, lint, test, and single-test execution
- Code style guidelines and formatting rules
- Frontend rules and data-provider integration
- Agent delegation templates and workflow
- Repository defaults and quick reference commands
- Verification and evidence requirements
- Input constraints for uploads
- Appendix: how to update

## Project Overview

LibreChat is a monorepo with the following key workspaces:

| Workspace                 | Language         | Side     | Dependency                                                                             | Purpose                                                                       |
| ------------------------- | ---------------- | -------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `/api`                    | JS (legacy)      | Backend  | `packages/api`, `packages/data-schemas`, `packages/data-provider`, `@librechat/agents` | Express server — minimize changes here                                        |
| `/packages/api`           | TypeScript       | Backend  | `packages/data-schemas`, `packages/data-provider`                                      | New backend code lives here (TS only, consumed by `/api`)                     |
| `/packages/data-schemas`  | TypeScript       | Backend  | `packages/data-provider`                                                               | Database models/schemas, shareable across backend projects                    |
| `/packages/data-provider` | TypeScript       | Shared   | —                                                                                      | Shared API types, endpoints, data-service — used by both frontend and backend |
| `/client`                 | TypeScript/React | Frontend | `packages/data-provider`, `packages/client`                                            | Frontend SPA                                                                  |
| `/packages/client`        | TypeScript       | Frontend | `packages/data-provider`                                                               | Shared frontend utilities                                                     |

The source code for `@librechat/agents` (major backend dependency, same team) is at `/home/danny/agentus`.

## Workspace Boundaries

- All new backend code must be TypeScript in `/packages/api`.
- Keep `/api` changes to the absolute minimum (thin JS wrappers calling into `/packages/api`).
- Database-specific shared logic goes in `/packages/data-schemas`.
- Frontend/backend shared API logic (endpoints, types, data-service) goes in `/packages/data-provider`.
- Build data-provider from project root: `npm run build:data-provider`.

## Build, Lint, Test, and Single-Test Execution

- Install dependencies
  - `npm ci` (preferred for clean installs) if package.json exists
  - `yarn install` or `pnpm install` if a different package manager is used in this monorepo
- Linting
  - `npm run lint` (or `yarn lint` / `pnpm lint`)
- Type checking (if TypeScript is used)
  - `npm run typecheck` (or `yarn typecheck` / `pnpm typecheck`)
- Build
  - `npm run build` (or `yarn build` / `pnpm build`)
- Running tests
  - `npm test` (or `yarn test` / `pnpm test`)
  - For unit/integration tests, use explicit sub-scripts if they exist:
    - `npm run test:unit`
    - `npm run test:integration`
- Running a single test (common patterns)
  - Jest/Vitest: `npm test -- -t "My test name"`
  - Vitest: `npx vitest run -t "My test name"`
  - Mocha: `npm test -- --grep "My test name"`
- Example invocations (adjust to your package manager):
  - `npm ci && npm run lint && npm test -- -t "auth flow" && npm run build`
  - `yarn install && yarn lint && yarn test -t "auth flow" && yarn build`
  - `pnpm install && pnpm lint && pnpm test -t "auth flow" && pnpm build`

Quick-start note: If a workspace uses several packages, execute commands at the workspace root and use the `--filter` or `-w` flags to scope to the relevant package when supported by your package manager.

## Development Commands

| Command                       | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `npm run smart-reinstall`     | Install deps (if lockfile changed) + build via Turborepo                 |
| `npm run reinstall`           | Clean install — wipe `node_modules` and reinstall from scratch           |
| `npm run backend`             | Start the backend server                                                 |
| `npm run backend:dev`         | Start backend with file watching (development)                           |
| `npm run build`               | Build all compiled code via Turborepo (parallel, cached)                 |
| `npm run frontend`            | Build all compiled code sequentially (legacy fallback)                   |
| `npm run frontend:dev`        | Start frontend dev server with HMR (port 3090, requires backend running) |
| `npm run build:data-provider` | Rebuild `packages/data-provider` after changes                           |

- Node.js: v20.19.0+ or ^22.12.0 or >= 23.0.0
- Database: MongoDB
- Backend runs on `http://localhost:3080/`; frontend dev server on `http://localhost:3090/`

## Code Style Guidelines

- General philosophy: consistent, readable, and maintainable code. Prefer small focused changes over large rewrites.
- Language and typing
  - If TypeScript is used: enable strict mode and avoid `any`; prefer explicit types for parameters and return values.
- Structure and clarity
  - Never-nesting: early returns, flat code, minimal indentation.
  - Functional first: pure functions, immutable data, `map`/`filter`/`reduce` over imperative loops.
  - No dynamic imports unless absolutely necessary.
- DRY
  - Extract repeated logic into utility functions.
  - Reusable hooks / higher-order components for UI patterns.
  - Constants for repeated values; configuration objects over duplicated init code.
  - Shared validators, centralized error handling, single source of truth for business rules.
- Iteration and performance
  - Minimize looping; consolidate sequential O(n) operations into a single pass when possible.
  - Choose data structures that reduce the need to iterate (`Map`/`Set` over `Array.find`).
  - Avoid unnecessary object creation; consider space-time tradeoffs.
- Type safety
  - Never use `any` or `as unknown as T`.
  - Limit `unknown` and `Record<string, unknown>`; prefer explicit types defined in `packages/data-provider` when possible.
  - Do not duplicate types; reuse and extend existing definitions.
- Imports and formatting
  - Group imports: builtins, external packages, internal modules, then side-effect only imports.
  - Alphabetize imports within groups; separate groups with a blank line.
  - Use Prettier or the project’s formatter; break long expressions for readability.
  - Import order (when applicable):
    1. Package imports — sorted shortest to longest line length (`react` always first).
    2. `import type` imports — sorted longest to shortest.
    3. Local/project imports — sorted longest to shortest.
  - Always use standalone `import type { ... }`.
- Error handling and logging
  - Do not swallow errors; propagate with context and meaningful messages.
- Testing style
  - Deterministic tests; avoid flaky patterns; mock external dependencies only as needed.
- Accessibility and security
  - Consider accessible semantics; validate inputs and sanitize outputs to prevent injection.
- Documentation and comments
  - Write self-documenting code; use JSDoc only for complex/non-obvious logic or public APIs.
- Version control etiquette
  - Commit small, focused changes with descriptive messages that explain why, not only what.
- Communication
  - Human communication in Chinese; code and code comments in English.

## Frontend Rules (`client/src/**/*`)

### Localization

- All user-facing text must use `useLocalize()`.
- Only update English keys in `client/src/locales/en/translation.json` (other languages are automated externally).
- Semantic key prefixes: `com_ui_`, `com_assistants_`, etc.

### Components

- TypeScript for all React components with proper type imports.
- Semantic HTML with ARIA labels (`role`, `aria-label`) for accessibility.
- Group related components in feature directories (e.g., `SidePanel/Memories/`).
- Use index files for clean exports.

### Data Management

- Feature hooks: `client/src/data-provider/[Feature]/queries.ts` → `[Feature]/index.ts` → `client/src/data-provider/index.ts`.
- React Query (`@tanstack/react-query`) for all API interactions; proper query invalidation on mutations.
- QueryKeys and MutationKeys in `packages/data-provider/src/keys.ts`.

### Data-Provider Integration

- Endpoints: `packages/data-provider/src/api-endpoints.ts`
- Data service: `packages/data-provider/src/data-service.ts`
- Types: `packages/data-provider/src/types/queries.ts`
- Use `encodeURIComponent` for dynamic URL parameters.

### Performance

- Prioritize memory and speed efficiency at scale.
- Cursor pagination for large datasets.
- Proper dependency arrays to avoid unnecessary re-renders.
- Leverage React Query caching and background refetching.

## Testing

- Framework: Jest, run per-workspace.
- Run tests from their workspace directory: `cd api && npx jest <pattern>`, `cd packages/api && npx jest <pattern>`.
- Frontend tests: `__tests__` directories alongside components; use `test/layout-test-utils` for rendering.

Philosophy

- Real logic over mocks. Exercise actual code paths with real dependencies.
- Spies over mocks. Assert real functions are called without replacing underlying logic.
- MongoDB: use `mongodb-memory-server` for a real in-memory MongoDB instance.
- MCP: use real `@modelcontextprotocol/sdk` exports for servers, transports, and tool definitions.
- Only mock what you cannot control: external HTTP APIs, rate-limited services, non-deterministic system calls.
- Heavy mocking is a code smell, not a testing strategy.

## Formatting

- Fix all formatting lint errors (trailing spaces, tabs, newlines, indentation) using auto-fix when available.
- All TypeScript/ESLint warnings and errors must be resolved.

## Agent Delegation Templates

Delegate task structure (recommended model)

- TASK: Atomic, specific goal (one action per delegation)
- EXPECTED OUTCOME: Clear, measurable deliverables
- REQUIRED TOOLS: List of allowed tools
- MUST DO: Precise requirements
- MUST NOT DO: Constraints and boundaries
- CONTEXT: File paths, repo conventions, constraints

Example payload (multi-step)

- delegate_task(
- category="ultrabrain",
- load_skills=["senior-frontend","git-master"],
- prompt="TASK: Implement feature X across module A and B; EXPECTED OUTCOME: 1) API surface changes in module A, 2) UI skeleton in module B, 3) tests updated",
- run_in_background=true
- )

Verification checklist

- Run lsp_diagnostics on changed files and ensure zero errors
- Run unit tests and report any failing tests with context
- Confirm that code style lint passes
- Document verification results in final notes

Quick-start examples and best practices

- Single-step example: delegate_task(category="quick", load_skills=["senior-frontend"], prompt="Fix issue in auth.ts on line 42")
- The following template guides how to structure delegate_task prompts for atomic actions. It enforces explicit expectations and verifiability.
- Template sections:
  1. TASK: Atomic, specific goal (one action per delegation)
  2. EXPECTED OUTCOME: Concrete deliverables with success criteria
  3. REQUIRED TOOLS: Explicit tool whitelist (prevents tool sprawl)
  4. MUST DO: Exhaustive requirements - leave NOTHING implicit
  5. MUST NOT DO: Forbidden actions - anticipate and block rogue behavior
  6. CONTEXT: File paths, existing patterns, constraints
- Example payload (for brainstorm task):
  delegate_task(
  category="unspecified-high",
  load_skills=["senior-frontend"],
  prompt="TASK: Draft AGENTS.md improvement plan. EXPECTED OUTCOME: 1 new section for delegation templates, 1 example payload, 1 verification checklist. REQUIRED TOOLS: [lsp_diagnostics]. MUST DO: update AGENTS.md with section headings and examples. MUST NOT DO: modify unrelated docs. CONTEXT: repo AGENTS.md at root, existing coding standards in AGENTS.md.")
- Session continuity: Always return a session_id for follow-ups. Use session_id to continue work if needed.

## Agent Workflow and Runbooks

- When performing multi-step tasks, capture a commit-worthy progression by writing focused commits and updating a minimal changelog.
- Use AGENTS.md as the single source of truth for agent conventions in this repo.
- For complex tasks, plan in advance, summarize assumptions, and verify with targeted lints/tests prior to merging.

## Repository Defaults and Quick Reference

- The repo uses a typical modern JS/TS workflow; individual packages may deviate.
- Always locate package.json at the workspace root to decide the package manager and available scripts.
- If a workspace uses Lerna, Yarn Workspaces, PNPM, or Nx, refer to their official docs for scope commands (e.g., `pnpm -F`, `yarn workspaces`).

Quick reference: common commands (condensed)

- ci: install and install-clean; depends on package manager
- lint: lint code
- test: run test suite
- test:unit: run unit tests only
- test:integration: run integration tests only
- build: build artifacts
- ts: type-check (for TS projects)

## Verification and Evidence

- Evidence requirements for task completion:
  - lsp_diagnostics: ensure clean on changed files
  - Build: exit code 0
  - Tests: pass (or note pre-existing failures)
- Append verification results to final notes in PRs or task logs.

## Input Constraints for Uploads

- Per-file maximum size: 2 GB
- Total upload size per user/session/project: 10 GB
- Supported content types (examples): video mp4/mov/mkv; audio wav/mp3/aac; images jpg/png
- Retention policy: default 30 days, configurable per project
- Per-user isolation: recommended to enable to prevent cross-user visibility
- Validation hooks: enforce limits in backend validators and UI prompts
- Implementation plan (AGT-006):
  - Backend: validate incoming uploads against per-file and total quotas; return informative errors when exceeded
  - UI: show quota usage, file size indicators, and alerts when exceeding limits
  - Design doc: capture API contract for quota checks and error responses
  - Tests: add unit/integration tests for quota enforcement
- Next actions: create a small patch implementing quota checks and adjust front-end to reflect quotas

## Appendix: How to Update

- If you make a change to this AGENTS.md, add a note in the commit message that describes the rationale.
- After changes, run lint and tests to ensure no regressions in tooling scripts.
- This file is intended to be machine-readable by agents that orchestrate tasks. Keep phrasing tight and avoid heavy narrative.
- When in doubt, prefer minimal, verifiable changes and add tests or validations where possible.

## Cursor and Copilot Instructions

- Cursor rules: If the repository contains Cursor rules under `.cursor/rules/` or `.cursorrules`, follow them and reference them when applying automated edits.
- Copilot rules: If a Copilot instruction file exists at `.github/copilot-instructions.md`, adhere to the guidance there when using Copilot-driven changes.
- Current status: no Cursor rules or Copilot rules were detected in this repository snapshot. If these files appear later, incorporate their constraints into your workflow.
