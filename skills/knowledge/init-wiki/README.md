# init-wiki

一个用于初始化并维护 **Karpathy 式 LLM Wiki** 的通用 agent skill。它兼容 Google Cloud 的 [Open Knowledge Format（OKF）0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)，同时**优先保留 Obsidian 原生格式**。

## 用途

当你想为一个新领域（如一个技术栈、研究方向、产品领域）构建一个由 LLM 维护、人类策展的 wiki 时，可以用这个 skill 快速启动：

- 自动生成目录结构
- 生成 `CLAUDE.md` / `AGENTS.md` schema 文档
- 创建 `index.md`、`log.md`
- 统一 frontmatter 和链接规范

## 安装

```bash
npx skills add xiehuacheng/Orange_Skills@init-wiki
```

## 使用

安装完成后，在支持的 agent 环境中输入（例如 Claude Code）：

```text
/init-wiki
```

Agent 会询问你想构建哪个领域的 wiki，然后自动完成初始化。

## 生成的 Wiki 目录结构

```text
wiki/
├── 00-Raw/                 # 原始资料（Markdown + type: source）
├── 01-Wiki/                # 知识点卡片
├── 02-Areas/ 或 02-Module/ # 第二级分类
│   └── <领域>/
│       ├── index.md        # 领域落地页
│       └── 子话题.md        # 成熟期拆分的子话题
├── index.md                # 根目录，frontmatter 声明 okf_version: "0.1"
└── log.md                  # 追加式更新日志
```

## 核心约定

1. **Obsidian 优先**：内部链接统一使用 `[[知识点名称]]`，编辑已有页面时禁止改成标准 Markdown 链接。
2. **OKF 兼容**：每个概念 `.md` 文件都包含 YAML frontmatter，且至少包含 `type` 字段；根 `index.md` 声明 `okf_version`。
3. **保留 frontmatter**：不要删除或修改 `type`、`title`、`description`、`tags`、`aliases` 等字段，除非用户明确要求。
4. **仅在对外导出 OKF 时**，才批量把 `[[...]]` 转换为 `[文本](路径.md)`，且需先征得用户同意。

## 依赖（可选）

- [obsidian-skills](https://github.com/kepano/obsidian-skills)：Kepano 的 Obsidian 编辑 skill，安装后编辑体验更好，不安装也能正常使用。

## 相关资源

- Karpathy LLM Wiki 原文：https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- OKF 规范：https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
