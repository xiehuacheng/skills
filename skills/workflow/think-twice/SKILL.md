---
name: think-twice
description: Use when the user wants to start something new — a project, skill, feature, or ongoing commitment — or asks whether an idea is worth pursuing. Gates new efforts against the user's persisted personal compass with explicit kill criteria; also audits in-flight work for direction drift.
metadata:
  author: xiehuacheng
  version: "1.0.0"
---

# Think Twice

A pre-commitment gate: challenge new ideas before effort is spent, so limited time and attention go to the right things.

**What it can do:**
- Triage every "I want to start X" moment — gate-worthy or not.
- Research facts on its own (existing solutions, compass, project context) before asking.
- Challenge the weakest 1–3 dimensions — one question at a time with a recommended answer — then issue a verdict (Proceed / Proceed with conditions / Bounce) citing the kill criterion by name.
- Park bounced ideas, archive decisions (verdicts, overrides, weekly trade-offs), and audit in-flight work (audit mode).

**What it cannot do (without explicit authorization):**
- Block the user indefinitely — an explicit "I'm doing it anyway" always passes, but is logged as a decision document.
- Modify or delete files outside `~/.config/think-twice/`.
- Pressure-test how to build an approved idea — this skill gates whether it should exist, not how.
- Make value judgments about the user's personal interests; the yardstick is the user's own stated compass.

**Default behavior:**
- Writes only inside `~/.config/think-twice/` (`compass.md`, `parking-lot.md`, `decisions/`), each confirmed with the user.
- Stay silent when triage says "not gate-worthy".
- Converge fast: 5–10 minutes per gate run (first run is longer — compass setup), not a 45-minute marathon.
- Respond in the user's language.

## Modes & Triggers

**Gate mode (primary)** — fires when the user proposes starting something with real commitment cost: a project, skill, feature track, content series, new domain of study, ongoing subscription or purchase. Yardstick: *will this eat more than a day of effort or create an ongoing commitment?*

**Audit mode** — fires when a new project conversation starts, or the user asks "am I drifting?", "is this worth continuing?".

If both modes could fire, gate mode runs first — the start decision precedes the in-flight audit; do not re-audit the same idea afterward.

**Never trigger on:**
- Subtasks of a gated or confirmed project.
- Small edits, bug fixes.
- Pure research or exploration ("help me understand X") — the gate blocks *commitment*, not *learning*.
- Experiments fully reversible within ~2 hours.

## The Personal Compass

Path: `~/.config/think-twice/compass.md`. Single source of truth for both modes. **Living document — updated weekly, never recreated from scratch.** Annotated format example: `references/playbook.md` ("Compass Format").

Sections: `direction`, `interests[]` (id, name, heat), `projects[]` (id, name, state, importance, category, optional note / pause_reason), `focus_week` (week_of = covered week's Monday, items[] of ref + outcome), `avoid_patterns`, `exceptions`, `last_updated`, free-text paragraph. Values: `heat` / `importance` = high | medium | low; `state` = active | paused | done; `category` = bet | incremental | maintenance | exploration.

**Derivation rule:** every `focus_week.items[].ref` must point to an existing `projects[].id` or `interests[].id` — the slug-style `id`, not the display `name` (sole exemption: `ref: null` with `note: "例外：…"`). This lets the gate say "this would crowd out X, which you marked high."

**Setup (first run, or compass missing)** — one question at a time; literal wording: `references/playbook.md` ("Setup Interview Questions").
1. Long-term direction in one sentence.
2. 2–5 current research/interest areas, each with a `heat` rating.
3. Ongoing projects; for each: `state`, `importance`, `category`, optional note.
4. Pick this week's focus (1–3 items) *from those just listed*, each with an outcome.
5. 2–4 `avoid_patterns`. 6. 1–3 `exceptions`. 7. Free-text paragraph.
Write `compass.md`, confirm contents, explain when the gate fires.

**Weekly update ritual** (when `week_of` has passed): review focus items (done / carry / drop and why), roll project states, derive the new focus from existing projects/interests. Update `last_updated`. Trade-offs ("dropped X because Y") are decisions — archive them.

**Staleness:** if `last_updated` is older than 7 days or `week_of` has passed, offer a quick refresh first; caveat any evaluation against a stale compass.

## Gate Mode Workflow

1. **Triage** — gate-worthy? If not, pass silently.
2. **Fact pass (agent-side, no questions yet):**
   - Direction fit: read `compass.md`, current project context (`AGENTS.md`, `README.md`, recent work).
   - Wheel check: actually search GitHub/web (`idea keywords`, `stars:>500`, `pushed:>` filter) and name the closest incumbents — "did you search?" is answered by searching, not asking.
   - Note which dimensions look solid vs soft.
3. **Briefing** — compact summary; solid dimensions get one line each ("轮子查过：最接近 X，差异在 Y，过").
4. **Challenge** — only the weakest 1–3 dimensions, interview-style, one question at a time with a recommended answer (bank: `references/playbook.md`).
5. **Verdict** — cite the kill criterion by name, not vibes (several triggered → name the primary, list the rest):

```
裁决：打回（建议进 parking lot）
触发条款：第 2 维 · 重复造轮子 —— X（3.2k stars，上月仍有提交）已覆盖约 80%，
         且一句话差异没有说出来。（次因：第 5 维 · 价值不清）
理由：与本周焦点"发布 think-twice v1"零交集，会挤掉你标了 high 的 skills 仓库。
出口：记入 parking lot，复盘日期 2026-10-01。你随时可以 override。
```

## Kill Criteria

1. **Direction fit** — zero intersection with `focus_week` *and* `direction`, crowding out a project marked `importance: high` → Bounce (park) or decline.
2. **Wheel** — actively-maintained solution covers ≥80% and the user cannot state a one-sentence differentiation → Bounce toward using/extending it.
3. **Information** — core bets have no sources and the user cannot name the cheapest falsification → conditional pass (run that test first) or Bounce.
4. **Difficulty** — no MVP slice definable, or a 3× overrun would destroy the value and no fallback exists → rescope to MVP or Bounce.
5. **Value** — cannot name the first user, why-now, and differentiation → Bounce to clarify or park.
6. **Vagueness** — cannot write "I will ___ for ___ by ___" → not a decision yet; set a decision date or park.

## Verdicts, Overrides, Parking Lot, Decisions

- **Proceed** — one line, exit; do not linger.
- **Proceed with conditions** — conditions must be verifiable, with a check date ("fake-door test for one week, revisit Friday").
- **Bounce** — default exit is the parking lot, not death: append to `~/.config/think-twice/parking-lot.md` with idea summary, trigger criterion, revisit date.
- **Override (meta-rule, not a verdict)** — an explicit "I'm doing it anyway" converts any verdict to `override-passed`; honor it, archive it. If the idea was parked, keep the entry marked `override-passed`. When 2–3 similar overrides accumulate, propose updating `compass.md` — maybe the yardstick should move.
- **Decision documents** — archive every verdict, override, and weekly trade-off to `~/.config/think-twice/decisions/YYYY-MM-DD-<slug>.md` (template: `references/playbook.md`).

## Audit Mode Workflow

1. Read `compass.md`; summarize the current effort in one sentence.
2. Evaluate against `focus_week`, `projects` (by `importance`), `direction`, `avoid_patterns`, `exceptions` — drift signals: `references/playbook.md`.
3. **Aligned / slight** — silent. **Moderate** — pause, offer "Continue / Adjust / Park". **High** — explain the conflict; wait for explicit confirmation of intentional exploration.
4. If work has drifted from `focus_week`, offer a compass refresh.

## Error Handling

| Issue | Handling |
|---|---|
| `compass.md` missing | Run setup interview. |
| `compass.md` corrupted | Show raw content, ask user to fix; do not guess values. |
| Web/GitHub search unavailable or thin | State coverage confidence in the briefing; never fake results. |
| User disagrees with verdict | Accept override, archive decision, proceed. |
| User refuses to create a compass | Gate still runs; direction-fit checks degrade to "no yardstick" caveats. |

## Resources

- `references/playbook.md` — compass format example, setup interview questions, decision document template, per-dimension techniques + question bank (EN/CN), drift-signal patterns for audit mode.
