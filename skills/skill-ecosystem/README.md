# Skill 生态

围绕 skill 工程本身的工具：发现、创建、翻译、多 harness 共享。

- **[creating-skills](./creating-skills/SKILL.md)** — 创建、改进和验证 Agent Skill。通过协作式头脑风暴帮用户澄清场景、触发时机和范围，在每个关键节点停下来等用户确认，并在批准前主动挑战最脆弱的假设。强调先确认安装位置、明确能力边界与默认行为、写明用户批准点与预期输出示例，最后用 `quick_validate.py` 和 sub-agent 端到端测试验证质量。
- **[hot-skills](./hot-skills/SKILL.md)** — 发现当前热门的 Agent Skills。聚合多个数据源（agentskills.media / skills-rank.com / skills.sh）的信号，支持按分类和别名筛选、关键词搜索、24 小时趋势榜和 JSON 输出，按 `owner/repo@skill-name` 精确去重并合并多源指标。
- **[skill-translator](./skill-translator/SKILL.md)** — 在中英文之间互译 skill 的 `SKILL.md`。自动检测源语言，翻译 `description` frontmatter 和正文，保留代码块、文件路径、命令名、URL 和 `name` frontmatter 不变。翻译结果经 `quick_validate.py` 验证后，在用户确认才覆盖原文件。
- **[unified-skill-pool](./unified-skill-pool/SKILL.md)** — 把多套 agent（Claude Code / Codex / Kimi / OpenCode / Pi / OMP 等）的 skill 目录合并到一个共享池子里。走 detect → merge → symlink → verify 四步；改一次，9 个 harness 同步生效。脚本支持干跑预览、冲突版本备份、自定义路径、坏 symlink 检测与新 harness 即插即用。
