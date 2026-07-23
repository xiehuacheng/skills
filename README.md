**中文** | [English](./docs/README.en.md) | [日本語](./docs/README.ja.md)

# skills

> Agent Skills 技能集合，将各领域经验打包为可复用的 AI 能力 | A collection of Agent Skills that turn AI agents into reusable domain experts.

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## 目录

- [安装](#安装)
- [Skill 介绍](#skill-介绍)
  - [快速索引](#快速索引)
- [贡献](#贡献)
- [许可证](#许可证)

## 安装

对 agent 说一句话即可安装：

```text
帮我安装这个仓库下的所有 skill： xiehuacheng/skills@hot-skills
```

或者

```text
帮我从这个仓库安装 skill： xiehuacheng/skills@hot-skills
只安装：（你想要安装的 skill 名称）
```

或直接使用 [skills.sh](https://skills.sh/) CLI：

```bash
npx skills add xiehuacheng/skills@hot-skills
```

本地测试时也可以直接指定路径：

```bash
npx skills add /path/to/skills@hot-skills
```

## Skill 介绍

### 快速索引

| Skill | 一句话介绍 | 典型场景 |
|-------|-----------|---------|
| [`creating-skills`](./skills/creating-skills) | 创建、改进和验证 Agent Skill | 你想写一个新 skill |
| [`hot-skills`](./skills/hot-skills) | 发现当前热门的 Agent Skills | 你想看看现在流行什么 skill |
| [`skill-translator`](./skills/skill-translator) | 将 skill 的 `SKILL.md` 在中英文之间互译 | 你需要维护多语言 skill |
| [`effort-audit`](./skills/effort-audit) | 检查当前任务是否偏离你的长期方向 | 你想确认这件事值不值得做 |
| [`go-goal-go`](./skills/go-goal-go) | 帮你写出可验证的 `/goal` 目标 | 你要把多轮任务交给 agent 自动执行 |
| [`ask-for-tools`](./skills/ask-for-tools) | 在 agent 遇到工具边界时主动索要工具 | agent 缺工具或权限时 |
| [`github-asset-manager`](./skills/github-asset-manager) | 整理 GitHub Stars、仓库与 README | 管理你的 GitHub 数字资产 |
| [`cv-builder`](./skills/cv-builder) | 从项目、GitHub、旧简历生成技术岗简历/CV | 你要写或更新简历 |
| [`cv-clone`](./skills/cv-clone) | 复刻目标简历的版式与风格，生成可编辑的 LaTeX 模板 | 你看到一份心仪的样张，想做一份同款排版 |
| [`init-llm-wiki`](./skills/init-llm-wiki) | 初始化并维护 Karpathy 风格的 LLM Wiki | 你要为一个新领域建 wiki |

下面按字母顺序给出每个 skill 的详细说明。

### hot-skills

[`hot-skills`](./skills/hot-skills) 用于发现当前热门的 Agent Skills。它聚合了多个数据源的信号：

- **[agentskills.media](https://agentskills.media)** — GitHub stars 与分类
- **skills-rank.com** — 单 skill 排名得分
- **skills.sh** — 真实安装量（通过无头浏览器抓取公开排行榜）

支持按分类和别名筛选、关键词搜索、查看 24 小时趋势榜，以及输出 JSON；并按 `owner/repo@skill-name` 精确去重，合并多源指标。适合回答“现在有什么热门 skill？”“前端热门 skill 有哪些？”这类问题。

### init-llm-wiki

[`init-llm-wiki`](./skills/init-llm-wiki) 帮助用户为一个新领域快速启动并维护 Karpathy 风格的 LLM Wiki。

它遵循 Google Cloud Open Knowledge Format（OKF）v0.1，Obsidian 优先：自动生成 `00-Raw/`、`01-Wiki/`、`02-Areas/`（或 `02-Module/`）目录，创建根 `index.md`、`log.md` 与 agent schema 文档，并统一 frontmatter 和 `[[wikilink]]` 链接规范。Ingest 流程强调先与用户讨论关键收获、再规划页面方案，避免把策展变成批处理。

### github-asset-manager

[`github-asset-manager`](./skills/github-asset-manager) 用于整理和改善 GitHub 数字资产。

它通过 GitHub CLI 或 `GITHUB_TOKEN` 读取数据，提供多个本地分析命令：分析并分类 GitHub Stars、审计个人仓库健康度、生成 GitHub Profile README、润色仓库 README、生成多语言 README、为指定仓库补全描述与 topics，以及将 Stars 整理进 GitHub Lists。使用时会先检查认证与权限 scope，生成内容后展示给用户，所有写操作（更新 About、推送 README、应用 Star Lists）都需要用户明确确认，默认只输出结构化 Markdown 报告。

### cv-builder

[`cv-builder`](./skills/cv-builder) 用于构建技术岗简历或 CV。


它从本地项目、GitHub 仓库、旧简历文件或纯文本笔记中收集材料，通过 sub agent 并行读取并提炼项目亮点，再引导用户确认个人信息、求职目标、经历技能等内容，最终生成 Markdown 草稿并渲染为 HTML/PDF。支持 modern、classic、minimal 等内置模板，也支持自定义模板或 agent 根据描述生成风格。

### cv-clone

[`cv-clone`](./skills/cv-clone) 用于复刻目标简历或 CV 样张的视觉版式，产出可编辑的 LaTeX 模板。

给定一张样例简历（PDF/截图），按其版式生成一份可编译的 LaTeX 模板（`tectonic`/`xelatex` 链），自带 `\newcommand` 占位符，**默认不填内容**——先出模板预览，再问用户是否需要帮忙填真实信息。与 `cv-builder` 互补：`cv-builder` 负责内容，`cv-clone` 负责样式，二者可串联使用（先 cv-builder 出草稿，再 cv-clone 套用样张版式）。输出 macOS/Linux/Windows 三平台安装说明。

**v0.3.0** — 移除未实现的 Routes A/C 与 cv-builder 整合描述（与其他 skill 保持独立），SKILL.md 与 references/ 总词数从 3509 → 1765（−50%）。

### creating-skills

[`creating-skills`](./skills/creating-skills) 用于创建、改进和验证 Agent Skill。

它通过协作式头脑风暴帮助用户澄清 skill 的场景、触发时机和范围，在每个关键节点停下来等用户确认，并在批准前主动挑战最脆弱的假设。除了生成 SKILL.md 和目录结构，它还强调：先确认安装位置、明确声明能力边界与默认行为、为使用 skill 的 agent 提供执行检查清单和对话模式、在 SKILL.md 中写明用户批准点与预期输出示例，以及通过 `quick_validate.py` 和 sub-agent 端到端测试来验证 skill 质量。

### effort-audit

[`effort-audit`](./skills/effort-audit) 用于自动检查当前项目或任务是否与用户的长期方向一致。

在项目对话开始时，它会自动读取 `~/.config/effort-audit/profile.md` 中的个人方向配置，并判断当前任务是否偏离。如果偏离达到中度或以上，它会暂停并列出具体原因，提供"继续""调整方向""暂存"等选项，帮助用户把精力拉回主攻领域。首次使用时，它会通过一次性访谈生成个人方向配置。

### ask-for-tools

[`ask-for-tools`](./skills/ask-for-tools) 用于在 agent 遇到工具边界时主动向用户索要工具，而不是蛮干。

它在新任务开始或执行中卡住时触发，先自检工具是否已存在；若不存在，则向用户清晰说明原因、替代方案和"提供工具 / 尝试降级 / 停止任务"三个选项。适用于 MCP server、CLI 工具、Python/Node 包、API 密钥、系统权限和本地文件等场景。

### go-goal-go

[`go-goal-go`](./skills/go-goal-go) 用于帮助用户把模糊意图写成可验证的 `/goal` 目标。

它会评估任务是否适合 goal 模式，在多轮、可重复、可验证的任务上主动建议 `/goal`，并与用户一起起草目标：终态、证明方式、边界、循环策略和停止规则。还可以在 goal plan 中显式声明循环里要使用的 skill 或系统工具。如果任务不适合 goal 模式，它会明确说明原因。

### skill-translator

[`skill-translator`](./skills/skill-translator) 用于将 skill 的 `SKILL.md` 在中英文之间互译。

它从自然语言请求中解析目标 skill 和目标语言，自动检测源语言，翻译 `description` frontmatter 和正文，同时保留代码块、文件路径、命令名、技术标识符、URL 以及 `name` frontmatter 不变。翻译结果经 `scripts/quick_validate.py` 验证后，在用户确认才覆盖原文件。

## 贡献

欢迎提交新的 skill 或改进现有 skill。每个 skill 请单独放在 `skills/<skill-name>/` 目录下，并包含 `SKILL.md` 说明文件。

## 许可证

[MIT](./LICENSE)
