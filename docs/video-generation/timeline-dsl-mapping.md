# Timeline DSL → MCP Mapping

This document maps DSL actions to DaVinci Resolve MCP operations and SSE progress step IDs.

| DSL Action        | MCP Tool / Operation       | Inputs                 | Output / Side Effects       | Progress Step ID |
| ----------------- | -------------------------- | ---------------------- | --------------------------- | ---------------- |
| `import_assets`   | MediaPool import           | file paths             | Assets appear in Media Pool | `import`         |
| `create_project`  | ProjectManager create/open | project name           | New Resolve project         | `project`        |
| `create_timeline` | MediaPool create timeline  | timeline name          | New timeline active         | `timeline`       |
| `add_clip`        | Timeline append/insert     | clip id, in/out, track | Clip placed on timeline     | `timeline`       |
| `add_transition`  | Transition apply           | type, duration         | Transition between clips    | `transitions`    |
| `audio_mix`       | Fairlight apply            | bgm/voice/ducking      | Levels adjusted             | `audio`          |
| `fusion`          | Fusion apply               | preset, target         | Fusion nodes applied        | `fusion`         |
| `tail_mark`       | Title clip insertion       | text, duration         | Tail mark appended          | `tail_mark`      |
| `render`          | Render queue               | format, output path    | MP4 rendered                | `render`         |
| `package_project` | Archive/zip                | project file + media   | ZIP created                 | `package`        |

## Error Handling Expectations

- Each step must fail fast and emit a failure event with `step_id`
- Runner should support retry for connection and render steps

## SSE Progress Alignment

Progress events should follow this order:

1. `import`
2. `project`
3. `timeline`
4. `audio`
5. `transitions`
6. `fusion`
7. `tail_mark`
8. `render`
9. `package`

## Tail Mark Requirement

Use text: **“Powered by MetaData”**
