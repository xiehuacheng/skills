# Orange_Skills

一个 Agent Skills 技能集合仓库，将各领域经验打包为可复用的 AI 能力。所有 skill 独立存放在 `skills/<skill-name>/` 目录下，遵循 [Agent Skills 规范](https://agentskills.io/)，方便后续不断扩展新的 skills。

## 目录

- [安装方法](#安装方法)
- [Skill 介绍](#skill-介绍)
  - [hot-skills](#hot-skills)
  - [init-llm-wiki](#init-llm-wiki)
  - [github-asset-manager](#github-asset-manager)
  - [creating-skills](#creating-skills)
- [贡献](#贡献)
- [许可证](#许可证)

## 安装方法

对 agent 说一句话即可安装：

```text
帮我安装这个仓库下的所有 skill： xiehuacheng/Orange_Skills@hot-skills
```

或者

```text
帮我从这个仓库安装 skill： xiehuacheng/Orange_Skills@hot-skills
只安装：（你想要安装的 skill 名称）
```

或直接使用 [skills.sh](https://skills.sh/) CLI：

```bash
npx skills add xiehuacheng/Orange_Skills@hot-skills
```

本地测试时也可以直接指定路径：

```bash
npx skills add /path/to/Orange_Skills@hot-skills
```

## Skill 介绍

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

它通过 GitHub CLI 或 `GITHUB_TOKEN` 读取数据，提供多个本地分析命令：分析并分类 GitHub Stars、审计个人仓库健康度、生成 GitHub Profile README、为指定仓库补全描述与 topics、以及将 Stars 整理进 GitHub Lists。所有写操作都需要用户明确确认，默认只输出结构化 Markdown 报告。

### creating-skills

[`creating-skills`](./skills/creating-skills) 用于创建新的 Agent Skill。

它通过协作式头脑风暴帮助用户澄清 skill 的场景、触发时机和范围，提供命名与结构建议，并在每个关键节点停下来等用户确认。强调渐进式披露、人在回路中的决策，以及 skill 工作流中脚本优先通过 stdin/stdout 组合而非生成中间文件。

## 贡献

欢迎提交新的 skill 或改进现有 skill。每个 skill 请单独放在 `skills/<skill-name>/` 目录下，并包含 `SKILL.md` 说明文件。

## 许可证

[MIT](./LICENSE)
