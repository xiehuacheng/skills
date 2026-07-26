**中文** | [English](./docs/README.en.md) | [日本語](./docs/README.ja.md)

# skills

> Agent Skills 技能集合，将各领域经验打包为可复用的 AI 能力 | A collection of Agent Skills that turn AI agents into reusable domain experts.

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## 目录

- [安装](#安装)
- [按分类浏览](#按分类浏览)
- [Skill 介绍](#skill-介绍)
  - [快速索引](#快速索引)
- [贡献](#贡献)
- [许可证](#许可证)

## 安装

最简单的方式——让 agent 帮你跑安装命令（自然语言格式，`@<name>` 是给 agent 看的）：

```text
帮我从这个仓库安装 skill：xiehuacheng/skills
```

只装某一个：

```text
帮我从这个仓库安装 skill：xiehuacheng/skills
只装 hot-skills
```

或者直接用 [skills.sh](https://skills.sh/) CLI（这是真的命令行，`-s` 后跟 SKILL.md frontmatter 里的 `name` 字段）：

```bash
# 装全部 11 个
npx skills add xiehuacheng/skills

# 只装某一个
npx skills add xiehuacheng/skills -s hot-skills

# 先看有哪些，不装
npx skills add xiehuacheng/skills -l
```

本地测试可以直接传本地路径：

```bash
npx skills add /path/to/skills -s hot-skills
```

## 按分类浏览

Skill 按主题领域归入 5 个子目录：

| 目录 | 主题 | 包含 |
|------|------|------|
| [`wiki/`](./skills/wiki) | 知识库与笔记 | `init-llm-wiki` |
| [`skill-ecosystem/`](./skills/skill-ecosystem) | Skill 生态自身 | `creating-skills`、`hot-skills`、`skill-translator`、`unified-skill-pool` |
| [`career/`](./skills/career) | 求职与简历 | `cv-builder`、`cv-clone` |
| [`github/`](./skills/github) | GitHub 数字资产 | `github-asset-manager` |
| [`workflow/`](./skills/workflow) | 工作流与目标管理 | `ask-for-tools`、`effort-audit`、`go-goal-go` |

> 分类是**仓库结构选择**，对安装命令无影响。`npx skills add` 会递归扫整个 repo 找 `SKILL.md`，子目录对它透明。上面 `## 安装` 节的命令直接用就行，不需要改路径。

## Skill 介绍

### 快速索引

| Skill | 一句话介绍 | 典型场景 |
|-------|-----------|---------|
| [`creating-skills`](./skills/skill-ecosystem/creating-skills) | 创建、改进和验证 Agent Skill | 你想写一个新 skill |
| [`hot-skills`](./skills/skill-ecosystem/hot-skills) | 发现当前热门的 Agent Skills | 你想看看现在流行什么 skill |
| [`skill-translator`](./skills/skill-ecosystem/skill-translator) | 将 skill 的 `SKILL.md` 在中英文之间互译 | 你需要维护多语言 skill |
| [`unified-skill-pool`](./skills/skill-ecosystem/unified-skill-pool) | 把多 harness 的 skill 目录合并到一个共享池子 | 你同时用 Claude/Codex/Kimi 等多套 agent |
| [`effort-audit`](./skills/workflow/effort-audit) | 检查当前任务是否偏离你的长期方向 | 你想确认这件事值不值得做 |
| [`go-goal-go`](./skills/workflow/go-goal-go) | 帮你写出可验证的 `/goal` 目标 | 你要把多轮任务交给 agent 自动执行 |
| [`ask-for-tools`](./skills/workflow/ask-for-tools) | 在 agent 遇到工具边界时主动索要工具 | agent 缺工具或权限时 |
| [`github-asset-manager`](./skills/github/github-asset-manager) | 整理 GitHub Stars、仓库与 README | 管理你的 GitHub 数字资产 |
| [`cv-builder`](./skills/career/cv-builder) | 从项目、GitHub、旧简历生成技术岗简历/CV | 你要写或更新简历 |
| [`cv-clone`](./skills/career/cv-clone) | 复刻目标简历的版式与风格，生成可编辑的 LaTeX 模板 | 你看到一份心仪的样张，想做一份同款排版 |
| [`init-llm-wiki`](./skills/wiki/init-llm-wiki) | 初始化并维护 Karpathy 风格的 LLM Wiki | 你要为一个新领域建 wiki |

每个 skill 的详细说明见对应分类的 README：

- [`wiki/README.md`](./skills/wiki/README.md)
- [`skill-ecosystem/README.md`](./skills/skill-ecosystem/README.md)
- [`career/README.md`](./skills/career/README.md)
- [`github/README.md`](./skills/github/README.md)
- [`workflow/README.md`](./skills/workflow/README.md)

## 贡献

欢迎提交新的 skill 或改进现有 skill。请把每个 skill 放在对应主题的子目录下，例如 `skills/wiki/<skill-name>/`、`skills/skill-ecosystem/<skill-name>/` 等，并包含 `SKILL.md` 说明文件。如果你的 skill 属于一个全新的主题，可以新建一个分类子目录。

## 许可证

[MIT](./LICENSE)
