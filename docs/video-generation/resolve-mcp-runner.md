# Resolve MCP Runner — Scaffold Design

## Purpose

Define a runner that orchestrates DaVinci Resolve MCP operations for AI video generation. This runner executes a Timeline DSL, emits progress via GenerationJobManager, and produces MP4 + project ZIP outputs.

## Responsibilities

- Connect to local MCP server (streamable-http)
- Import assets into Resolve media pool
- Create project + timeline
- Apply edits (clips, transitions, Fusion)
- Apply audio mix rules
- Add tail mark “Powered by MetaData”
- Render output MP4
- Package project ZIP (.drp + media + metadata.json)
- Emit progress events to SSE stream

## Interfaces (Proposed)

```ts
initConnection(): Promise<MCPClient>
importAssets(files: Asset[]): Promise<void>
buildTimeline(dsl: TimelineDSL): Promise<void>
applyAudioMix(rule: AudioRule): Promise<void>
applyTransitions(transitions: TransitionSpec[]): Promise<void>
applyFusion(fusion: FusionSpec[]): Promise<void>
applyTailMark(text: string, durationSec: number): Promise<void>
render(outputPath: string, preset: RenderPreset): Promise<RenderResult>
packageProject(outputZip: string): Promise<string>
```

## Sequencing (High-Level)

1. initConnection
2. importAssets
3. buildTimeline
4. applyAudioMix
5. applyTransitions
6. applyFusion
7. applyTailMark
8. render
9. packageProject

## Progress Emission

- Use GenerationJobManager to emit step progress
- Example steps: `import`, `timeline`, `audio`, `transitions`, `fusion`, `render`, `package`

## Error Handling & Retries

- Connection failures: retry 2–3 times with backoff
- Render failures: surface error + allow job retry
- Idempotency: avoid duplicate asset imports and timeline creation

## Outputs

- MP4 file at configured output path
- Project ZIP containing:
  - `project.drp`
  - `/media/*` assets
  - `metadata.json`

## Constraints

- Single Resolve workstation
- MCP server at `http://127.0.0.1:8020/mcp`
- Tail mark text: “Powered by MetaData”
