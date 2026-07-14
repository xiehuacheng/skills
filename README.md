# Orange_Skills

一个 Agent Skills 技能集合仓库，将各领域经验打包为可复用的 AI 能力。每个 skill 独立存放在 `skills/<skill-name>/` 目录下，遵循 [Agent Skills 规范](https://agentskills.io/)。

## 当前可用的 Skills

| Skill | 描述 |
|-------|------|
| [`hot-skills`](./skills/hot-skills) | 聚合多个排行榜的热门 Agent Skills，支持分类筛选、关键词搜索、24h 趋势榜和 JSON 输出 |
| [`init-agent-wiki`](./skills/init-agent-wiki) | 根据指定领域初始化并维护 Karpathy 式 LLM Wiki，兼容 Google Cloud OKF 0.1 |

## 安装方法

使用 [skills.sh](https://skills.sh/) CLI 安装指定 skill：

```bash
npx skills add xiehuacheng/Orange_Skills@hot-skills
```

本地测试时也可以直接指定路径：

```bash
npx skills add /path/to/Orange_Skills@hot-skills
```

## 使用示例

以 `hot-skills` 为例：

```bash
# 查看 Top 20 热门 skill
node skills/hot-skills/scripts/fetch-trends.js

# 查看 Top 10 前端相关 skill
node skills/hot-skills/scripts/fetch-trends.js --category frontend --top 10

# 搜索 testing 相关 skill
node skills/hot-skills/scripts/fetch-trends.js --search testing

# 查看 skills.sh 24h 趋势榜
node skills/hot-skills/scripts/fetch-trends.js --trending --top 10

# 强制刷新数据并以 JSON 输出
node skills/hot-skills/scripts/fetch-trends.js --refresh --json

# 安装 init-agent-wiki 后，在 agent 环境中使用 /init-agent-wiki 初始化一个领域的 wiki
npx skills add xiehuacheng/Orange_Skills@init-agent-wiki
```

## 项目特点

- **多 skill 仓库结构**：方便后续不断扩展新的 skills
- **即装即用**：通过 `npx skills add` 一键安装到常用 AI agent
- **数据来源多元**：聚合 GitHub stars、安装量、排行榜等多种信号
- **结果去重合并**：按 `owner/repo@skill-name` 精确去重，合并多源指标

## 贡献

欢迎提交新的 skill 或改进现有 skill。每个 skill 请单独放在 `skills/<skill-name>/` 目录下，并包含 `SKILL.md` 说明文件。

## 许可证

[MIT](./LICENSE)
