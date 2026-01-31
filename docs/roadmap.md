# Roadmap — MCP + DaVinci Resolve AI Video Generation

## Overview

This roadmap tracks the delivery of the MCP-driven AI video generation workflow using local DaVinci Resolve (streamable-http). It is intended for ongoing tracking and incremental delivery across backend, frontend, and orchestration.

## Scope

**In scope**

- Upload video/audio/image assets
- Create video jobs with template orchestration
- Run Resolve MCP operations in background
- Resumable SSE progress updates
- Output MP4 + Resolve project ZIP

**Out of scope (current phase)**

- Cloud rendering farm / multi-node Resolve
- Model training or custom model pipelines

## Phases

### Phase 1 — MVP (Core pipeline)

- [ ] VideoJob API (create/status/cancel)
- [ ] Resolve MCP Runner scaffold (init/import/timeline/render)
- [ ] Timeline DSL mapping + sequencing
- [ ] Resumable SSE progress integration
- [ ] MP4 output + project ZIP packaging
- [ ] Tail mark “Powered by MetaData”
- [ ] Dev commands validated: `npm run frontend:dev`, `npm run backend:dev`

### Phase 2 — Enhancements (Editing fidelity)

- [ ] Audio mix rules (BGM -12dB, voice -3dB, ducking -6dB)
- [ ] Transitions + Fusion presets
- [ ] Template library: short / promo / talking / montage
- [ ] Resume + retry flows with clear error states

### Phase 3 — Scale & Ops

- [ ] Job persistence + retention policy
- [ ] Monitoring + alerts for render failures
- [ ] Optional multi-worker Resolve expansion

## Dependencies

- MCP connection management and registry
- GenerationJobManager + SSE transport
- Upload validation/limits (per AGENTS.md)
- Local Resolve MCP server: `http://127.0.0.1:8020/mcp`

## Risks

- Resolve API/version differences (Studio vs free)
- Long-running renders and MCP timeouts
- Large uploads affecting storage and bandwidth

## Rollout Plan

1. Enable backend endpoints (VideoJob API)
2. Wire runner + DSL mapping
3. Ship UI for job creation + progress
4. Add ZIP packaging and download UX

## Tracking Checklist

- [ ] VideoJob API
- [ ] Resolve MCP Runner scaffold
- [ ] Timeline DSL mapping
- [ ] SSE progress events
- [ ] MP4 output
- [ ] Project ZIP packaging
- [ ] Tail mark “Powered by MetaData”
- [ ] Frontend dev command (`npm run frontend:dev`)
- [ ] Backend dev command (`npm run backend:dev`)
