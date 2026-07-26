---
name: effort-audit
description: Use when a new project conversation starts, or when the user says "am I drifting?", "check direction", "is this worth it?", or "audit this". Automatically reads ~/.config/effort-audit/profile.md and determines whether the current task deviates from the user's long-term direction; pauses and alerts when deviation reaches moderate or above.
metadata:
  author: xiehuacheng
  version: "1.0.0"
---

# Effort Audit

Automatically determines whether the user's current effort is worth continuing, based on a persisted personal direction configuration.

**What it can do:**
- Automatically read `~/.config/effort-audit/profile.md` at the start of a project conversation.
- Silently evaluate whether the current project or task aligns with the established direction.
- List specific reasons and intervene when deviation reaches moderate or above.
- Ask the user to confirm, pause, or adjust direction before continuing.
- Assist in updating the configuration when the user's direction changes.

**What it cannot do (without explicit authorization):**
- Delete or overwrite the configuration without showing the diff.
- Block the user indefinitely or refuse all work.
- Make value judgments about the user's personal interests.
- Access files outside the configuration path.

**Default behavior:**
- Automatically read the configuration and evaluate at the start of every project conversation.
- Stay silent and not disturb the user when aligned or only slightly deviated.
- Pause and ask the user to choose "Continue", "Adjust direction", or "Pause and think" when moderately deviated.
- Clearly explain the conflict when highly deviated, and do not proceed deeply until the user confirms this is intentional exploration.
- If the configuration does not exist, start a one-time setup interview.

## Trigger Conditions

Sorted by priority:

1. **Automatic trigger (primary)** — Agent automatically reads the configuration and evaluates when a new project conversation starts.
2. **User-initiated check (secondary)** — User says "am I drifting", "is this worth it", "check direction", "audit this", etc.

## When Not to Trigger

- When executing specific subtasks within a project whose direction has already been confirmed.
- When the user is in a pure research or brainstorming phase and has not yet invested actual effort.
- When the configuration is missing and the user explicitly refuses to create it.

## Configuration Format

File path: `~/.config/effort-audit/profile.md`

```yaml
---
direction: "成为后端系统工程师，专注高并发基础设施"
primary_domains:
  - 后端系统设计
  - 分布式系统
  - 性能优化
avoid_patterns:
  - 纯前端界面打磨
  - 个人工具类 App 的完整开发
  - 与主业无关的 side project
exceptions:
  - 为后端项目临时写简单前端界面
  - 学习新技术的小实验（限时 2 小时）
last_updated: 2026-07-21
---

我是后端背景，长期目标是做高并发基础设施。后端需要时我会写简单前端，但不应把大块时间花在 UI 打磨或无关 side project 上。
```

## Initial Setup

If `~/.config/effort-audit/profile.md` does not exist:

1. Ask the user to describe their long-term direction in one sentence.
2. Ask for 2–4 primary domains.
3. Ask for 2–4 work patterns they easily fall into but want to avoid.
4. Ask for 1–3 reasonable exceptions.
5. Write the file to `~/.config/effort-audit/profile.md`.
6. Confirm the configuration contents, and explain that it will be automatically checked at the start of future project conversations.

## Automatic Check Workflow

At the start of every new project conversation:

1. **Read the configuration.**
2. **Summarize the current task in one sentence.**
3. **Evaluate alignment based on `direction`, `primary_domains`, `avoid_patterns`, `exceptions`.**
4. **Determine deviation level:**
   - **Aligned** — proceed normally, do not mention the audit.
   - **Slight deviation** — do not proactively prompt; only mention briefly after a natural pause or at task completion.
   - **Moderate deviation** — pause and ask the user to choose: "Continue", "Adjust direction", or "Pause and think".
   - **High deviation** — clearly explain the conflict, and do not proceed deeply until the user confirms this is intentional exploration.
5. **If the user chooses to adjust direction**, help them reframe the task toward the main direction.
6. **If the user chooses to continue**, record it as an exception and proceed.

## Medium-Deviation Output Format

```
方向检查：当前任务可能与你的长期方向不完全一致。

你的方向：成为后端系统工程师，专注高并发基础设施。
当前任务：vibe coding 一个 token 监控 App 的前端界面。

看起来像是：
- 前端界面打磨（在你的 avoid_patterns 中）
- 与后端基础设施目标关联较弱

建议选项：
1. 继续 — 确认这是有意探索，继续。
2. 调整方向 — 把目标改成只做一个最小后端接口，放弃前端。
3. 暂存 — 记录这个想法，回到原方向。

你选哪个？
```

## Updating Configuration

When the user's direction changes:

1. Ask which field to update.
2. Show the current value.
3. Ask for the new value.
4. Write the updated file.
5. Confirm the change.

## Error Handling

| Issue | Handling |
|---------|----------|
| Missing configuration file | Run initial setup. |
| Corrupted configuration file format | Report the error, show the raw content, and ask the user to fix it. |
| Ambiguous current task meaning | Ask a clarifying question before evaluating. |
| User disagrees with audit result | Accept user override, continue execution, and suggest updating the configuration if disagreements recur. |

## Resources

- `references/drift-patterns.md` — Common patterns of effort drift and how to recognize them.
