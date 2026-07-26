**中文** | [English](./docs/README.en.md) | [日本語](./docs/README.ja.md)

# skills

> Agent Skills 技能集合 — 把各领域经验打包成可复用的 AI 能力。

![GitHub top language](https://img.shields.io/github/languages/top/xiehuacheng/skills) ![GitHub Repo stars](https://img.shields.io/github/stars/xiehuacheng/skills?style=social) ![GitHub forks](https://img.shields.io/github/forks/xiehuacheng/skills?style=social) ![GitHub License](https://img.shields.io/github/license/xiehuacheng/skills) ![GitHub Issues](https://img.shields.io/github/issues/xiehuacheng/skills) ![GitHub last commit](https://img.shields.io/github/last-commit/xiehuacheng/skills)

## 安装

用 [skills.sh](https://skills.sh/) CLI：

```bash
npx skills add xiehuacheng/skills              # 装全部
npx skills add xiehuacheng/skills -s hot-skills # 只装某一个
npx skills add xiehuacheng/skills -l           # 先看有哪些
```

让 agent 帮你跑：

```
帮我从这个仓库安装 skill：xiehuacheng/skills
```

## 分类浏览

按仓库子目录组织，每个分类有自己的 README：

- **[wiki/](./skills/wiki/README.md)** — 知识库与笔记
- **[skill-ecosystem/](./skills/skill-ecosystem/README.md)** — Skill 工程工具
- **[career/](./skills/career/README.md)** — 求职与简历
- **[github/](./skills/github/README.md)** — GitHub 数字资产
- **[workflow/](./skills/workflow/README.md)** — 工作流与目标管理

> 分类是**仓库结构选择**，对 `npx skills add` 命令无影响——CLI 递归扫 SKILL.md。

## 我做的这堆 skill 是为了解决

**Skill 工程**

- 想写新 skill 但不知从哪下手 → [creating-skills](./skills/skill-ecosystem/creating-skills)
- 不知道现在流行什么 skill → [hot-skills](./skills/skill-ecosystem/hot-skills)
- 要维护多语言 SKILL.md → [skill-translator](./skills/skill-ecosystem/skill-translator)

**工作流与方向**

- 新任务跑偏了想做不下去 → [effort-audit](./skills/workflow/effort-audit)
- 多轮任务不知道啥时候算完 → [go-goal-go](./skills/workflow/go-goal-go)
- agent 缺工具自己硬扛 → [ask-for-tools](./skills/workflow/ask-for-tools)

**个人产出**

- 要写或更新技术简历 → [cv-builder](./skills/career/cv-builder)
- 看到一份样张简历想要同款排版 → [cv-clone](./skills/career/cv-clone)
- GitHub Stars 一团乱 / 仓库 README 没写 → [github-asset-manager](./skills/github/github-asset-manager)
- 要为新领域建 Karpathy 风格 wiki → [init-llm-wiki](./skills/wiki/init-llm-wiki)

## 贡献

欢迎新 skill 或改进。请放在对应主题子目录下，例如 `skills/wiki/<skill-name>/`，并附 `SKILL.md`。新主题可直接新建子目录。

## 许可证

[MIT](./LICENSE)
