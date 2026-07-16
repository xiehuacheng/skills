---
name: cv-builder
description: "Use when the user wants to build a tech resume or CV. 从本地项目、GitHub 仓库、旧简历文件或纯文本中生成程序员/技术岗简历或 CV。触发语：帮我写份简历、根据这些项目生成简历、把 GitHub 项目整理成简历、优化一下我的简历、生成技术岗简历 PDF。"
---

# CV Builder

## 概述

把分散的开发者经历——本地项目、GitHub 仓库、旧简历文件或纯文本笔记——转换成一份精致、可直接投递的简历或 CV。本 skill 扮演技术招聘人员的角色：并行读取来源材料、针对性追问、用 Markdown 起草内容，并通过可定制模板渲染为 HTML/PDF。

## 何时使用

当用户想要：

- 从零创建新简历或 CV
- 将 GitHub 项目或本地代码库转成简历要点
- 更新或重新排版现有简历/CV
- 生成特定视觉风格的 PDF 简历
- 为特定岗位或行业定制简历

## 何时不使用

不要用于：

- 写求职信或申请邮件
- 向招聘网站或公司门户投递简历
- 核实工作经历或项目声明的真实性
- 保证 ATS 兼容性或面试回复
- 除非用户明确提供全部内容，否则不用于非技术岗简历

## 核心流程

按以下顺序执行。在需要用户做选择的交互阶段，**使用当前 Agent 提供的结构化提问/交互能力**（如多选、单选、确认框），避免在聊天中输出大段文字问题。

### 步骤 1：收集输入来源

询问用户有哪些材料。支持任意组合：

| 来源 | 处理方式 |
|------|----------|
| 本地项目文件夹 | 读取 README、package.json、pyproject.toml、源码摘要 |
| GitHub 仓库 URL | 获取仓库元数据和 README |
| 现有简历文件（PDF/DOCX/MD） | 提取文本；macOS 上 DOCX 用 `textutil -convert txt` |
| 纯文本或笔记 | 直接接受 |
| LinkedIn / Notion / 作品集 URL | 能抓取则抓取，否则请用户导出 |

在用户提供完所有材料前，不要开始生成内容。

### 步骤 2：分派 sub agent 读取材料

主 agent 根据项目大小决定分派策略：

- **大项目**（文件多、代码复杂）：单独分配一个 sub agent
- **小项目或简单文件**：合并到一个 sub agent
- **旧简历 / 文本笔记**：一个 sub agent

每个 sub agent 返回简洁摘要，包括：

- 项目/文件目的
- 使用的关键技术
- 显著功能或成果
- 可量化的影响（如有）
- 建议的简历要点

### 步骤 3：询问个人信息

通过结构化交互分组确认或收集：

1. **基础信息**：姓名、邮箱、电话、所在地、LinkedIn、GitHub
2. **求职目标**：目标岗位、行业、城市
3. **经历与技能**：教育背景、工作经历、项目经历、技术栈
4. **加分项**：证书、语言、奖项、开源贡献
5. **照片（可选）**：是否提供证件照，放在简历右上角

用来源摘要预填答案，让用户修改或补充。

### 步骤 4：起草 Markdown 简历

生成 Markdown 格式简历，要求：

- 结构清晰、ATS 友好
- 包含目标岗位关键词
- 要点简洁（尽量使用 STAR 法则）
- 技能部分与目标岗位匹配

把草稿展示给用户，请其编辑。重复直到用户认可内容。

### 步骤 5：选择模板

通过结构化交互询问用户想要的风格：

- **内置模板**：modern（现代单栏）、classic（经典双栏）、minimal（极简）
- **用户提供模板**：接受 HTML/CSS 文件路径
- **Agent 设计**：用户描述风格，agent 生成 HTML/CSS

渲染 HTML 预览并展示给用户。

### 步骤 6：确认页面与版式

通过结构化交互询问用户版式偏好：

- **页数**：是否压缩到一页，还是允许多页？
- **照片**：是否提供证件照并放在简历右上角？
- **其他调整**：是否需要调整字号、行距、页边距等？

根据用户选择，agent 修改 HTML/CSS 并重新渲染预览。若用户选择压缩到一页，使用 `build_resume.py --one-page` 生成紧凑版式。

### 步骤 7：生成 PDF

用 WeasyPrint 将 HTML 预览转换为 PDF。

依赖处理：

1. 检查 skill 目录下是否有专用的 `uv` 虚拟环境且已安装 WeasyPrint
2. 若无，创建环境并执行 `uv pip install weasyprint`
3. 若自动安装失败，输出 HTML 预览并提供手动安装命令

配合用户迭代调整版式、内容和模板，直到满意。

## 资源

- `scripts/build_resume.py` — 主流程入口（支持 `--one-page` 压缩版式）
- `scripts/render_pdf.py` — HTML 转 PDF（WeasyPrint，macOS 自动注入 Hiragino Sans GB 字体）
- `scripts/ensure_weasyprint.py` — 管理 `uv` 环境
- `scripts/read_project.py` — 扫描本地项目关键文件
- `assets/templates/` — 内置 HTML/CSS 模板
- `references/example-resume.md` — Markdown 简历格式示例
