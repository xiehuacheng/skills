# Workflow

工作流与目标管理相关 skill。

- **[ask-for-tools](./ask-for-tools/SKILL.md)** — 在 agent 遇到工具边界时主动向用户索要工具，而不是蛮干。在新任务开始或执行中卡住时触发，先自检工具是否已存在；若不存在，则向用户清晰说明原因、替代方案和"提供工具 / 尝试降级 / 停止任务"三个选项。适用于 MCP server、CLI 工具、Python/Node 包、API 密钥、系统权限和本地文件等场景。
- **[go-goal-go](./go-goal-go/SKILL.md)** — 把模糊意图写成可验证的 `/goal` 目标。会评估任务是否适合 goal 模式，在多轮、可重复、可验证的任务上主动建议 `/goal`，并与用户一起起草目标：终态、证明方式、边界、循环策略和停止规则。还可以在 goal plan 中显式声明循环里要使用的 skill 或系统工具。如果任务不适合 goal 模式，会明确说明原因。
- **[think-twice](./think-twice/SKILL.md)** — 在想开始任何新事情之前先过一道门禁。读取 `~/.config/think-twice/compass.md` 个人罗盘（方向、兴趣领域、在项目及重视程度、本周焦点），先做事实自查（方向对齐、轮子检索），再对最弱的 1–3 个维度逐个拷问，给出"放行 / 带条件放行 / 打回"三档裁决并点名触发的 kill criterion。打回的想法进 parking lot，所有裁决与 override 归档为决策文档。也支持对进行中任务的方向漂移审计。
