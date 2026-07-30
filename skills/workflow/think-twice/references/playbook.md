# Playbook

Reference material for gate mode and audit mode. Challenge flow: pick the 1–3 weakest dimensions from the fact pass, draw questions from those sections only — one at a time, each with a recommended answer. Kill criteria live in `SKILL.md` (single copy); cite them from there.

## Compass Format

Annotated example of `~/.config/think-twice/compass.md`:

```yaml
---
direction: "成为后端系统工程师，专注高并发基础设施"
interests:                       # 当前研究/感兴趣的领域
  - id: dist-sys
    name: 分布式系统
    heat: high                   # 主观热度 high / medium / low
projects:                        # 正在做的项目
  - id: skills-repo
    name: skills 仓库
    state: active                # active / paused / done
    importance: high             # 主观重视程度 high / medium / low
    category: bet                # bet / incremental / maintenance / exploration
    note: "个人品牌资产，长期维护"
  - id: token-monitor
    name: token 监控 App
    state: paused
    importance: low
    category: exploration
    pause_reason: "想清楚价值前不继续"
focus_week:                      # 本周焦点 —— 派生，不凭空写
  week_of: 2026-07-27            # 所覆盖那一周的周一
  items:
    - ref: skills-repo           # 必须指向 projects[].id 或 interests[].id（slug，不是显示名）
      outcome: "发布 think-twice v1"
avoid_patterns:
  - 纯前端界面打磨
  - 与主业无关的 side project
exceptions:
  - 学习新技术的小实验（限时 2 小时）
last_updated: 2026-07-30
---

一段自由文本：现阶段在哪、为什么是这些。
```

## Setup Interview Questions

Ask one at a time, in the user's language. Wait for each answer before asking the next.

1. EN: "In one sentence: what is your long-term direction?"
   CN: "用一句话说：你的长期方向是什么？"
2. EN: "What 2–5 areas are you actively researching or interested in right now? Rate your heat for each: high / medium / low."
   CN: "你目前在研究或感兴趣的领域有哪些（2–5 个）？各标一个热度：high / medium / low。"
3. EN: "List your ongoing projects. For each: state (active / paused / done), how much it matters to you (high / medium / low), and category (bet / incremental / maintenance / exploration)."
   CN: "列出你正在做的项目。每个标：状态（active / paused / done）、重视程度（high / medium / low）、类别（bet / incremental / maintenance / exploration）。"
4. EN: "From the projects and interests you just listed — no new ones — pick this week's 1–3 focus items, each with a concrete outcome."
   CN: "从刚才列的项目和领域里（不要新增），挑出本周的 1–3 个焦点，各带一个具体结果。"
5. EN: "What 2–4 patterns do you easily fall into but want to avoid?"
   CN: "你容易掉进去但想避开的模式有哪些（2–4 个）？"
6. EN: "What 1–3 reasonable exceptions should exist?"
   CN: "有哪些合理的例外（1–3 个）？"
7. EN: "Free text: where are you right now, and why are these the priorities?"
   CN: "最后用自由文本补充：你现阶段在哪、为什么是这些优先级。"

## Decision Document Template

Written to `~/.config/think-twice/decisions/YYYY-MM-DD-<slug>.md`:

```markdown
---
date: 2026-07-30
type: gate-verdict           # gate-verdict / override / plan-revision
idea: "做一个 token 监控 App"
verdict: bounce              # proceed / conditional / bounce / override-passed
criterion: "dim-2 wheel"     # primary; append secondaries: "dim-2 wheel (+ dim-5)"
---
## 背景：事实快报要点
## 裁决理由：对照 compass 的具体条目
## 条件 / 复盘日期 / 后续
```

## Dimension 1 — Direction Fit

**Techniques**
- Forced opportunity cost: "If you spend the next N weeks on this, what is the most expensive thing you would NOT ship or learn?"
- Crowding-out check: name which `compass.md` project (and its `importance`) this new effort would displace.
- Park, don't kill: direction-misfit ideas are usually "not now", not "never" — parking lot with a revisit date.

**Questions (EN)**
- "If this idea hadn't appeared today, what would you be working on, and how far along would you be by Friday?"
- "If you say yes to this, what are you saying no to — concretely, by name?"
- "Which line of your `focus_week` does this serve? Which one does it crowd out?"
- "Is this a means to your stated direction, or a new goal competing with it?"

**Questions (CN)**
- "如果这个想法今天没出现，你现在应该在做什么？到周五你会到哪一步？"
- "做这件事，你具体是在跟什么说'不'？把那个东西点名。"
- "这件事会挤掉 `focus_week` 里的哪一条？那一条你标了什么重要性？"
- "它是服务你既定方向的手段，还是一个新目标在和老目标抢位置？"

## Dimension 2 — Reinventing the Wheel

**Techniques**
- Forced search: run the queries yourself — `<keywords> in:name,description stars:>500 pushed:>YYYY-MM-DD`; recency (`pushed:>`) is the only reliable activity filter. Report what was searched and what was found.
- Substitution check: what do people use *today* — tools, workarounds, spreadsheets, scripts?
- Build-vs-extend: what is the smallest extension to the closest incumbent that delivers 80% of the value?

**Questions (EN)**
- "Name three tools or workarounds people use for this today. Which is closest, and what would you add to it?"
- "If a friend pitched this to you, what existing product would you say 'this is just X with Y'? Argue back."
- "Why can't a motivated user solve this with existing tools plus a weekend script? What is the real wall?"

**Questions (CN)**
- "现在人们解决这个问题的三个最常用工具/做法是什么？给最强的那个加 10% 功能，能不能交付 80% 的价值？"
- "如果别人拿这个点子找你，你第一反应是'这不就是 X 加 Y'吗？你怎么反驳自己？"
- "为什么一个有动力的人用现成工具加一个周末脚本搞不定？那堵墙到底是什么？"

## Dimension 3 — Information Gaps & Bias

**Techniques**
- Source audit: for each core claim demand source, date, sample size. No source → treat as anecdote.
- Steelman: the user writes the strongest case *against* the idea; inability to write it means under-thought.
- Cheapest falsification: the smallest piece of information that would change the decision, and the cheapest way to get it (fake door, landing page, one-week concierge test).

**Questions (EN)**
- "State the three claims you are betting on. For each: source, date, sample size."
- "What is the strongest evidence this idea is *wrong*? Have you looked for it?"
- "What single piece of information would change your mind, and what is the cheapest way to get it this week?"

**Questions (CN)**
- "你最依赖的三个判断，分别来自哪里？样本多少？什么时候的？"
- "证明这个想法是*错的*的最强证据是什么？你主动找过吗？"
- "只补一条信息就可能让你改主意的话，是哪条？最低成本怎么拿到？"

## Dimension 4 — Difficulty Misjudgment

**Techniques**
- Reference-class forecasting: look up the median shipping time of similar projects; compare with the user's estimate. Both numbers get written down.
- MVP taxonomy: smoke test / fake door / concierge / Wizard of Oz — the smallest version that still produces a keep-or-kill signal.
- Riskiest-assumption-first: test the must-work + least-proven assumption for under 10% of the planned cost.

**Questions (EN)**
- "How long do you think this takes? What is the median of similar shipped projects? Write both numbers down."
- "What is the smallest version that, if you stopped there, still tells you whether to continue?"
- "If this takes 3× as long, is it still worth it? If not, what is your exit criterion?"

**Questions (CN)**
- "你觉得多久能上线？类似项目真实耗时中位数是多少？两个数都写下来。"
- "如果第 4 周必须停下来，那时的版本够不够你判断'继续还是砍'？"
- "实际耗时长 3 倍你还会做吗？不会的话，退出标准是什么？"

## Dimension 5 — Value, Audience, Differentiation

**Techniques**
- First-user specificity: name the first user — who they are, their current workaround, what changes on day one.
- Why-now: what forces the behavior change now rather than six months from now.
- Ten named users: list ten specific people who would use it in the first month; "everyone" is not an audience.
- Obsolescence test: if the user would not maintain this for 3 years, who would?

**Questions (EN)**
- "Describe your first user: name, job, current workaround, what they do differently next week."
- "If a well-funded competitor launched this exact idea tomorrow, why do you still win in 12 months?"
- "Why hasn't this been done before? 'Nobody thought of it' is not an answer."

**Questions (CN)**
- "描述你的第一个用户：是谁、现在怎么解决、下周会有什么不同。"
- "有钱有人的对手明天抄了一模一样的，12 个月后你为什么还能赢？"
- "这事之前为什么没人做？不许回答'没人想到'。"

## Dimension 6 — Decision Vagueness

**Techniques**
- One-sentence form: "I will ___ for ___ by ___" — every blank must resolve to something observable.
- Adjective deletion: strip "revolutionary", "seamless", "intelligent" — is the remaining noun still a real thing?
- Decision vs direction: a direction needs a date by which it becomes a decision.

**Questions (EN)**
- "Write one sentence: 'I will ___ for ___ by ___.' What does each blank mean, concretely?"
- "Which words in your pitch are doing real work, and which are vibes? What would a user have to observe for them to be true?"
- "Is this a decision or a direction? If a direction, on what date does it become a decision?"

**Questions (CN)**
- "用一句话写：'我会在 ___ 之前，为 ___ 做 ___。'每个空具体指什么？"
- "把'革命性的''丝滑的''智能的'全删掉，剩下的名词还是个真实的东西吗？"
- "你现在说的是一个决定还是一个方向？如果是方向，哪一天把它逼成决定？"

## Drift Signals (audit mode)

**High deviation**
- The work's topic is unrelated to `direction` and all `interests`.
- Full infrastructure being built for a whim.
- Days sunk into polishing non-core skills; the work's main value is "fun" or "practice".

**Moderate deviation**
- Related to the direction, but drifting deep into non-core areas.
- Scope quietly expanded beyond the original intent.
- Repeated polishing of unimportant details; time spent far exceeds the estimate.

**Acceptable**
- Time-boxed learning experiments with an explicit deadline (see `exceptions`).
- Temporary supporting work that serves a stated project.
- Declared intentional exploration; short rest-type projects with no lasting dependency.

**Judging principles**
1. Judge against the long-term direction, not short-term mood.
2. Judge by actual effort spent, not initial intent.
3. Exploration is allowed but must be declared.
4. Recurring drift means the compass needs updating, not ignoring.
