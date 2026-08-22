# Video UI Adjustments Plan

## TL;DR

> **Quick Summary**: Improve chat input UX by auto-hiding popovers on input focus, relocating the video job status indicator to the left of the mic icon with a more polished visual treatment, and refining stream-disconnect messaging behavior (UI-only).
>
> **Deliverables**:
> - Input focus/click hides open popovers (VideoSelect/MCP/Attach menu as agreed)
> - Video job status icon relocated and visually refined, with hover tooltip “任务ID + 状态”
> - Stream disconnect messaging behavior clarified and updated in UI
>
> **Estimated Effort**: Short
> **Parallel Execution**: NO (sequential UI changes)
> **Critical Path**: Identify popovers → update ChatForm/UI layout → update status indicator & tooltip → update disconnect messaging

---

## Context

### Original Request
“点击输入栏需要将弹出的框自动隐藏…出现stream断流…状态图标需要放到语音图标的左侧来，同时报告状态的图标需要改成好看点的。先列计划。”

### Interview Summary
**Key Discussions**:
- 状态图标位置：右下角、语音（mic）图标左侧
- 状态集合：等待/运行/完成/失败/断开
- Tooltip 内容：任务ID + 状态
- VideoSelect 下拉中不保留状态文本
- Popover 自动隐藏：仅 VideoSelect + MCP
- 断流提示：状态条 + toast（短暂浮层）
- 状态条样式：类似终端模式底部状态条，running 时闪烁/滚动效果
- Toast 时长：3 秒
- Running 动画：0.6s 闪烁 + 细条左右滚动
- 断流 toast 防抖：6 秒内仅弹一次

**Known Constraints**:
- Stream断流原因（MCP tools >127）后续再排查；本次仅调整 UI 表现/提示。

### Metis Review
Metis 未能调用（权限问题）。已在自检中补全潜在缺口与问题清单。

---

## Work Objectives

### Core Objective
Provide a cleaner input UX: popovers auto-hide on input focus, status indicator sits left of mic with refined styling, and stream-disconnect messaging is shown consistently without interrupting other UI elements.

### Concrete Deliverables
- Input focus/click dismisses open dropdowns/popovers
- Status icon relocated + refined visual styling + hover tooltip
- Stream disconnect UI handling clarified and implemented

### Definition of Done
- [ ] Clicking into input hides any open popover(s) per decision
- [ ] Status icon sits left of mic icon, shows tooltip “任务ID + 状态”
- [ ] Status icon changes by status (pending/running/completed/failed/disconnected)
- [ ] Stream断流时显示状态条断流状态 + toast 提示

### Must NOT Have (Guardrails)
- Do not change backend MCP behavior or streaming infrastructure
- Do not move status back into dropdown
- Avoid creating new global UI patterns outside chat input

---

## Verification Strategy (Manual UI Verification)

> No automated tests requested. Use manual UI checks.

### Manual QA Steps
1. Open VideoSelect/MCP/Attach menu → click input → verify popovers auto-hide.
2. Start video job → check status icon appears left of mic; hover tooltip shows “任务ID + 状态”.
3. Trigger terminal states (completed/failed/disconnected) → icon updates; auto-hide after timeout (if configured).
4. Simulate stream断流 → confirm messaging strategy matches expected (toast/badge/persistent state).

---

## Execution Strategy

### Wave 1 (Sequential)
1. Identify and control popover stores to close on input focus
2. Move status indicator location and refine styling/iconography
3. Implement stream disconnect UI behavior

---

## TODOs

- [ ] 1. Auto-hide popovers on input focus/click

  **What to do**:
  - Identify popover stores for VideoSelect and MCPSelect
  - Wire input focus/click to close VideoSelect + MCP only

  **Must NOT do**:
  - Do not close unrelated global menus

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
    - Reason: UI/UX interactions in chat input
  - **Skills**: frontend-ui-ux

  **References**:
  - `client/src/components/Chat/Input/ChatForm.tsx` — input focus handler
  - `client/src/components/Chat/Input/VideoSelect.tsx` — menu store usage
  - `client/src/components/Chat/Input/MCPSelect.tsx` — similar menu/tooltip usage
  - `client/src/components/Chat/Input/Files/AttachFileMenu.tsx` — dropdown popup

  **Acceptance Criteria**:
  - Clicking input closes open popovers (as per decision)

- [ ] 2. Relocate and restyle status icon with tooltip

  **What to do**:
  - Place status bar left of mic icon in ChatForm input row
  - Implement terminal-like bottom status bar style
  - Add running-state blinking/scrolling effect
  - Tooltip shows “任务ID + 状态”
  - Auto-hide after terminal states

  **Must NOT do**:
  - Do not reintroduce status text in VideoSelect dropdown

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
    - Reason: icon design and placement
  - **Skills**: frontend-ui-ux

  **References**:
  - `client/src/components/Chat/Input/ChatForm.tsx` — status indicator region
  - `client/src/components/Chat/Input/VideoSelect.tsx` — no status text here
  - `packages/client/src/components/Tooltip.tsx` — tooltip behavior

**Acceptance Criteria**:
- Icon sits left of mic icon, visible only when job exists
- Hover tooltip shows “任务ID + 状态”
- Icon changes by status (pending/running/completed/failed/disconnected)

- [ ] 3. Stream断流 UI handling

  **What to do**:
  - Implement toast for stream disconnect
  - Ensure status bar reflects disconnected state

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
    - Reason: UI messaging consistency
  - **Skills**: frontend-ui-ux

  **References**:
  - `client/src/components/Chat/Input/ChatForm.tsx` — error handling and status rendering
  - `client/src/components/Chat/Input/VideoSelect.tsx` — error removal if applicable
  - `client/src/locales/*/translation.json` — message keys (e.g., com_ui_video_stream_disconnected)

**Acceptance Criteria**:
- Disconnect toast appears once per disconnect event
- Status bar reflects disconnected state without overlap

---

## Open Decisions (Need Confirmation)

None.

---

## Success Criteria

- Input click reliably closes approved popovers
- Status indicator appears at mic-left with tooltip “任务ID + 状态”
- Stream断流 messaging is consistent and non-intrusive
