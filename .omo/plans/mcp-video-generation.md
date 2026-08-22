# MCP Video Generation via DaVinci Resolve (Plan)

## TL;DR

> **Quick Summary**: Build an MCP‑driven video generation pipeline that runs DaVinci Resolve in the background, with chat‑bar UI interaction and resumable progress, then expand with platform‑specific audio presets and short‑video templates.
>
> **Deliverables**:
>
> - VideoJob API + job lifecycle + resumable SSE progress
> - Resolve MCP Runner implementing Timeline DSL → render → packaging
> - Chat‑bar UX for upload + template/preset selection + progress + download
> - Phase 2: audio mix presets (Douyin/TikTok, Xiaohongshu, YouTube Shorts)
> - Phase 2: template library (口播解说, 种草推荐, 剧情分镜, 图文混剪, B‑roll+字幕, 节奏卡点)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Job API → MCP Runner → Progress UI → Download flow

---

## Context

### Original Request

User wants MCP‑based AI video generation using local DaVinci Resolve MCP (streamable‑http), running in background with progress and download. UI interaction happens in the existing chat bar. Phase 2 adds short‑video templates and platform‑specific audio mix presets.

### Interview Summary

**Key Discussions**:

- Chat‑bar UI interaction only (no standalone page)
- Default format: 9:16, default duration: 60s
- Upload constraints: 2GB/file, 10GB total, retention 30 days, mp4/mov/mkv, wav/mp3/aac, jpg/png
- Use GenerationJobManager for resumable SSE progress
- Phase 2: template priority list + platform‑specific audio mix presets
- Tests‑after strategy (implement then add tests)

**Research Findings** (from existing docs/draft):

- MCP and job infrastructure already exists (routes, MCP manager, GenerationJobManager, event transports)
- DSL mapping and Runner scaffold are already documented

### Metis Review

**Status**: Metis tool unavailable (JSON parse error). Manual gap review performed and assumptions explicitly documented below.

---

## Work Objectives

### Core Objective

Deliver an end‑to‑end MCP‑driven video generation workflow on a single local Resolve workstation, with chat‑bar UX, resumable progress updates, and downloadable outputs; then extend with short‑video templates and platform‑specific audio presets.

### Concrete Deliverables

- VideoJob API (create/status/cancel) with progress streaming
- Resolve MCP Runner implementing Timeline DSL mapping
- Chat‑bar UI: upload + template/preset selection + progress + download
- Outputs: MP4 + Resolve project ZIP (project.drp + media + metadata)
- Phase 2: audio mix presets + template library

### Definition of Done

- [ ] User can create a VideoJob from chat bar with assets + template + platform preset
- [ ] Job progress is visible and resumable via SSE
- [ ] Job completes with MP4 + ZIP downloadable
- [ ] Phase 2 presets/templates are selectable and reflected in job config

### Must Have

- Reuse existing MCP connection management and GenerationJobManager (resumable SSE)
- Single workstation (no multi‑node rendering)
- Tail mark text: “Powered by MetaData”
- Communication in Chinese; code and code comments in English (update opencode baseline)

### Must NOT Have (Guardrails)

- No new standalone UI page for video generation
- No cloud rendering farm or multi‑worker orchestration in Phase 1
- No model training or third‑party licensing workflows
- Avoid breaking existing MCP/agent flows

---

## Verification Strategy (Tests‑After)

### Test Decision

- **Infrastructure exists**: Likely (project is JS/TS with scripts)
- **User wants tests**: YES, tests‑after
- **Framework**: TBD by repo scripts (assume existing test command)

### Approach

Each task includes implementation + tests in the same task, but tests are written after implementation. Manual verification steps are always required.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
├── Task 1: VideoJob API + storage model
└── Task 2: Resolve MCP Runner (core scaffold)

Wave 2 (After Wave 1):
├── Task 3: Timeline DSL execution + progress emission
├── Task 4: Output packaging + download paths
└── Task 5: Chat‑bar UI integration (upload + template + preset)

Wave 3 (After Wave 2):
└── Task 6: Phase 2 templates + audio presets

Critical Path: Task 1 → Task 3 → Task 5 → Task 4

---

## TODOs

> Implementation + Tests (after) are combined in each task.

- [x] 1. Implement VideoJob API (create/status/cancel) + job persistence

  **What to do**:
  - Define VideoJob data model and lifecycle states
  - Add API endpoints for create/status/cancel
  - Wire to GenerationJobManager for job registration and SSE updates
  - Enforce upload constraints (2GB/file, 10GB total, format allowlist)
  - Add job metadata for template/preset selection

  **Must NOT do**:
  - Introduce new auth model or role system
  - Add multi‑worker orchestration

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
    - Reason: backend API + job orchestration with multiple dependencies
  - **Skills**: ["nodejs-backend-patterns", "git-master"]
    - nodejs-backend-patterns: API patterns, middleware, validation
    - git-master: safe atomic commits if requested later
  - **Skills Evaluated but Omitted**:
    - frontend-ui-ux: not needed for backend API

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 1)
  - Blocks: Tasks 3, 4, 5

  **References**:
  - `api/server/routes/agents/index.js` — existing job routing patterns
  - `api/server/controllers/agents/request.js` — job request lifecycle
  - `packages/api/src/stream/GenerationJobManager.ts` — job registration + SSE
  - `api/server/routes/files/index.js` — upload route + multer usage
  - `packages/api/src/files/encode/video.ts` — video validation patterns
  - `packages/api/src/files/encode/audio.ts` — audio validation patterns
  - `docs/roadmap.md` — MVP checklist alignment
  - `AGENTS.md` — upload constraints summary

  **Acceptance Criteria**:
  - [ ] API endpoints exist for create/status/cancel
  - [ ] Upload validation rejects over‑limit files with clear error
  - [ ] `curl` create job returns job_id and SSE stream_id
  - [ ] Tests (after) for API validation and lifecycle
  - [ ] Manual verification:
    - POST job with sample assets → job created
    - GET status → returns expected state
    - Cancel job → state updates, SSE emits cancel event

---

- [x] 2. Build Resolve MCP Runner scaffold (init/import/timeline/render/package)

  **What to do**:
  - Implement runner interface per design doc
  - Connect to streamable‑http MCP endpoint
  - Prepare hooks for asset import and render settings
  - Ensure tail mark “Powered by MetaData” is inserted

  **Must NOT do**:
  - Attempt multi‑node rendering
  - Replace MCP connection logic already present

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: ["nodejs-backend-patterns"]

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 1)
  - Blocks: Task 3

  **References**:
  - `docs/video-generation/resolve-mcp-runner.md` — runner responsibilities + sequencing
  - `packages/api/src/mcp/connection.ts` — StreamableHTTPClientTransport setup
  - `api/server/services/MCP.js` — MCP service patterns
  - `api/server/services/Tools/mcp.js` — tool invocation patterns

  **Acceptance Criteria**:
  - [ ] Runner can initialize MCP connection with local server
  - [ ] Stub methods exist for import/timeline/render/package
  - [ ] Tail mark insertion is called in sequence
  - [ ] Manual verification: run runner on dummy DSL and see MCP calls logged

---

- [x] 3. Implement Timeline DSL execution + progress emission

  **What to do**:
  - Map DSL actions to MCP operations
  - Emit SSE progress events per step order
  - Ensure failures emit step_id and error payload

  **Must NOT do**:
  - Invent new DSL schema not aligned to mapping doc

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: ["nodejs-backend-patterns"]

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 2)
  - Blocked By: Task 2

  **References**:
  - `docs/video-generation/timeline-dsl-mapping.md` — DSL → MCP mapping + step IDs
  - `packages/api/src/stream/GenerationJobManager.ts` — SSE event emission

  **Acceptance Criteria**:
  - [ ] DSL actions trigger correct MCP calls
  - [ ] SSE events follow defined order (import → package)
  - [ ] Failure step emits `step_id` and error message
  - [ ] Manual verification: simulate DSL with 2–3 steps and observe SSE

---

- [x] 4. Output packaging + download flow (MP4 + project ZIP)

  **What to do**:
  - Define output paths and storage
  - Package Resolve project + media + metadata.json
  - Expose download endpoint with authorization checks

  **Must NOT do**:
  - Store outputs outside configured storage policy

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: ["nodejs-backend-patterns"]

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 2)
  - Blocked By: Task 1, 2

  **References**:
  - `docs/video-generation/resolve-mcp-runner.md` — output structure expectations
  - `api/server/routes/files/index.js` — download patterns

  **Acceptance Criteria**:
  - [ ] MP4 output produced at configured path
  - [ ] ZIP contains project.drp + /media + metadata.json
  - [ ] Download endpoint returns file with correct headers
  - [ ] Manual verification: download via curl and inspect ZIP contents

---

- [x] 5. Chat‑bar UI integration (upload + template + preset + progress)

  **What to do**:
  - Add chat‑bar affordances: template dropdown + platform preset selector
  - Connect file upload to VideoJob API
  - Show job progress inline in chat (SSE updates)
  - Provide download link when complete

  **Must NOT do**:
  - Create a standalone page
  - Break existing chat composer flows

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
  - **Skills**: ["frontend-ui-ux", "senior-frontend"]
    - frontend-ui-ux: chat‑bar UX integration
    - senior-frontend: React/TS patterns and state management

  **Parallelization**:
  - Can Run In Parallel: YES (Wave 2)
  - Blocked By: Task 1 (API availability)

  **References**:
  - `client/src/Providers/AgentPanelContext.tsx` — context wiring
  - `client/src/hooks/MCP/*` — MCP client hooks patterns
  - `packages/data-provider/src/api-endpoints.ts` — endpoint definitions
  - `packages/data-provider/src/data-service.ts` — API calls

  **Acceptance Criteria**:
  - [ ] Template + platform preset selection visible in chat bar
  - [ ] Upload uses existing flow and respects size/format constraints
  - [ ] Progress messages update in chat via SSE
  - [ ] Download link appears on completion
  - [ ] Manual verification (Playwright):
    - Upload assets, select template/preset, submit job
    - Observe progress steps and download link

---

- [x] 6. Phase 2: Template library + platform audio presets

  **What to do**:
  - Define template metadata schema (type, duration, aspect, knobs)
  - Implement template list for priority types
  - Implement audio preset profiles:
    - Douyin/TikTok, Xiaohongshu, YouTube Shorts
  - Wire presets into runner (audio mix step)

  **Must NOT do**:
  - Add new template types outside priority list

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: ["nodejs-backend-patterns", "senior-frontend"]

  **Parallelization**:
  - Can Run In Parallel: NO (Wave 3)
  - Blocked By: Tasks 3, 5

  **References**:
  - `docs/video-generation/timeline-dsl-mapping.md` — where audio mix step lives
  - `docs/roadmap.md` — Phase 2 expectations

  **Acceptance Criteria**:
  - [ ] Template list includes 6 priority types
  - [ ] Preset selection influences audio mix parameters in runner
  - [ ] UI exposes platform preset selection
  - [ ] Manual verification: select preset and verify runner logs chosen profile

---

## Commit Strategy

| After Task | Message                               | Files                | Verification     |
| ---------- | ------------------------------------- | -------------------- | ---------------- |
| 1          | `feat(video): add video job API`      | API routes/services  | curl + tests     |
| 2          | `feat(resolve): scaffold MCP runner`  | runner files         | manual log check |
| 3          | `feat(video): execute DSL + progress` | runner + stream      | SSE output       |
| 4          | `feat(video): package outputs`        | download + packaging | curl + unzip     |
| 5          | `feat(ui): chat bar video controls`   | client UI            | Playwright       |
| 6          | `feat(video): templates + presets`    | runner + config      | log verify       |

---

## Success Criteria

### Verification Commands

```bash
npm run backend:dev
npm run frontend:dev
curl -X POST http://localhost:<port>/api/video/jobs ...
```

### Final Checklist

- [ ] All MVP tasks completed
- [ ] Phase 2 templates + presets wired
- [ ] SSE progress is resumable
- [ ] Outputs downloadable (MP4 + ZIP)
- [ ] Tests added after implementation
