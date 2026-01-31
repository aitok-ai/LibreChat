# AGENTS.md

This file documents conventions, commands, and style guidelines for agents operating in this repository. It is intended for both human contributors and automatic coding agents that participate in build, test, refactor, and documentation tasks.

Scope and audience

- Target audience: developers and AI agents working on the aITok LibreChat Merge project.
- Purpose: provide canonical commands for common tasks, enforce code style expectations, and describe how to collaborate with automated agents.

Table of contents

- Build, lint, test, and single-test execution
- Code style guidelines
- Import, formatting, and type conventions
- Error handling and logging expectations
- Testing discipline and structure
- Cursor rules (if present) and Copilot instructions
- Agent workflow and runbooks
- Repository defaults and how to adapt per subsystem
- Quick reference: common commands

1. Build, lint, test, and single-test execution

- Install dependencies
  - npm ci (preferred for clean installs) if package.json exists
  - yarn install or pnpm install if a different package manager is used in this monorepo

- Linting
  - npm run lint (or yarn lint / pnpm lint)
- Type checking (if TypeScript is used)
  - npm run typecheck (or yarn typecheck / pnpm typecheck)
- Build
  - npm run build (or yarn build / pnpm build)
- Running tests
  - npm test (or yarn test / pnpm test)
  - For unit/integration tests, use explicit sub-scripts if they exist:
    - npm run test:unit
    - npm run test:integration
- Running a single test (common patterns)
  - Jest/Vitest: npm test -- -t "My test name" (quotes around the description)
  - Vitest: npx vitest run -t "My test name"
  - Mocha: npm test -- --grep "My test name"
- Example invocations (adjust to your package manager):
  - npm ci && npm run lint && npm test -- -t "auth flow" && npm run build
  - yarn install && yarn lint && yarn test -t "auth flow" && yarn build
  - pnpm install && pnpm lint && pnpm test -t "auth flow" && pnpm build

- Quick-start note: If a workspace uses several packages, execute commands at the workspace root and use the --filter or -w flags to scope to the relevant package when supported by your package manager.

  1.1 CI/CD & Environment

- Recommend Node.js LTS (current active) for development and CI
- Use npm, yarn, or pnpm as per project workspace configuration; ensure consistent lockfile usage
- CI recommendations:
  - Install dependencies with npm ci / yarn install / pnpm install
  - Run lint, typecheck (if TS), tests, and build
- Local dev environment notes:
  - Install deps once
  - Use fixtures and environment variables isolated per task

2. Code style guidelines

- General philosophy: consistent, readable, and maintainable code. Prefer small focused changes over large rewrites.
- Language and typing
  - If TypeScript is used: enable strict mode and avoid any; prefer unknown instead of any; prefer interfaces for public shapes and types for utility wrappers.
- Imports
  - Group imports: builtins, external packages, internal modules, then side-effect only imports.
  - Alphabetize imports within groups; separate groups with a blank line.
- Formatting
  - Use Prettier or the project’s formatter to enforce consistent line length, trailing commas, and quotes.
  - Break long expressions and function call arguments across lines to improve readability.
- Naming conventions
  - Use descriptive, camelCase for variables and functions; PascalCase for classes and components; ALL_CAPS for constants.
- Types and interfaces
  - Prefer explicit types; annotate function return values; avoid implicit any.
- Error handling
  - Do not swallow errors; propagate with context. Use try/catch where appropriate and include meaningful messages.
- Testing style
  - Favor deterministic tests, avoid flaky patterns, and mock external dependencies.
  - Test coverage should reflect critical paths and edge cases; add tests for new public APIs.
- Accessibility and security
  - Consider accessible semantics and inputs; validate inputs and sanitize outputs to prevent injection.
- Documentation and comments
  - Write clear inline comments for complex logic; document public APIs with JSDoc/TSdoc where applicable.
- Performance and memory
  - Avoid needless allocations in hot paths; prefer memoization and lazy evaluation where appropriate.
    -version control etiquette
  - Commit small, focused changes with descriptive messages that explain why, not only what.
- Communication
  - Human communication in Chinese; code and code comments in English.

3. Cursor rules and Copilot instructions

- Cursor rules: If the repository contains Cursor rules under .cursor/rules/ or .cursorrules, follow them and reference them when applying automated edits.
- Copilot rules: If a Copilot instruction file exists at .github/copilot-instructions.md, adhere to the guidance there when using Copilot-driven changes.
- Current status: no Cursor rules or Copilot rules were detected in this repository snapshot. If these files appear later, incorporate their constraints into your workflow.

4. Agent delegation templates
   4.1 Delegate task structure (recommended model)

- TASK: Atomic, specific goal (one action per delegation)
- EXPECTED OUTCOME: Clear, measurable deliverables
- REQUIRED TOOLS: List of allowed tools
- MUST DO: Precise requirements
- MUST NOT DO: Constraints and boundaries
- CONTEXT: File paths, repo conventions, constraints

  4.2 Example payload (multi-step)

- delegate_task(
- category="ultrabrain",
- load_skills=["senior-frontend","git-master"],
- prompt="TASK: Implement feature X across module A and B; EXPECTED OUTCOME: 1) API surface changes in module A, 2) UI skeleton in module B, 3) tests updated",
- run_in_background=true
- )

  4.3 Verification checklist

- Run lsp_diagnostics on changed files and ensure zero errors
- Run unit tests and report any failing tests with context
- Confirm that code style lint passes
- Document verification results in final notes

  4.4 Quick-start examples and best practices

- Single-step example: delegate_task(category="quick", load_skills=["senior-frontend"], prompt="Fix issue in auth.ts on line 42")
- Multi-step example: see 4.2
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
- Copilot rules: If a Copilot instruction file exists at .github/copilot-instructions.md, adhere to the guidance there when using Copilot-driven changes.
- Current status: no Cursor rules or Copilot rules were detected in this repository snapshot. If these files appear later, incorporate their constraints into your workflow.

4. Agent workflow and runbooks

- When performing multi-step tasks, capture a commit-worthy progression by writing focused commits and updating a minimal changelog.
- Use the AGENTS.md as the single source of truth for agent conventions in this repo. If you modify the repo structure or introduce new tooling, update this document accordingly.
- For complex tasks, plan in advance, summarize assumptions, and verify with targeted lints/tests prior to merging.

5. Repository defaults and how to adapt per subsystem

- The repo uses a typical modern JS/TS workflow; however, individual packages may deviate. Always locate package.json at the workspace root to decide the package manager and available scripts.
- If a workspace uses Lerna, Yarn Workspaces, PNPM, or Nx, refer to their official docs for scope commands (e.g., pnpm -F, yarn workspaces for filtering).
- When adding new scripts, ensure they do not conflict with existing ones and add tests to cover the script intent.

6. Quick reference: common commands (condensed)

- ci: install and install-clean; depends on package manager
- lint: lint code
- test: run test suite
- test:unit: run unit tests only
- test:integration: run integration tests only
- build: build artifacts
- ts: type-check (for TS projects)

7. Implementation notes

- Code samples and templates:
- Patch/commit example patterns for agent actions
- How to run lsp_diagnostics on changed files and verify changes
- How to start delegated tasks with session continuity and how to resume
- How to document verification results (evidence) in final notes

- This file is intended to be machine-readable by agents that orchestrate tasks. Keep phrasing tight and avoid heavy narrative.
- When in doubt, prefer minimal, verifiable changes and add tests or validations where possible.

8. Code samples and templates

- Patch/commit example patterns for agent actions
- How to run lsp_diagnostics on changed files and verify changes
- How to start delegated tasks with session continuity and how to resume
- How to document verification results (evidence) in final notes

9. Verification & evidence

- Evidence requirements for task completion:
  - lsp_diagnostics: ensure clean on changed files
  - Build: exit code 0
  - Tests: pass (or note pre-existing failures)
- Append verification results to final notes in PRs or task logs.

Appendix: how to update

- If you make a change to this AGENTS.md, add a note in the commit message that describes the rationale.
- After changes, run lint and tests to ensure no regressions in tooling scripts.

8. Input constraints for uploads

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

- Per-file maximum size: 2 GB
- Total upload size per user/session/project: 10 GB
- Supported content types (examples): video mp4/mov/mkv; audio wav/mp3/aac; images jpg/png
- Retention policy: default 30 days, configurable per project
- Per-user isolation: recommended to enable to prevent cross-user visibility
- Validation hooks: enforce limits in backend validators and UI prompts
