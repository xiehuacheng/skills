# Career

求职与简历相关 skill。

- **[cv-builder](./cv-builder/SKILL.md)** — 从本地项目、GitHub 仓库、旧简历文件或纯文本笔记中收集材料，通过 sub agent 并行读取并提炼项目亮点，再引导用户确认个人信息、求职目标、经历技能等内容，最终生成 Markdown 草稿并渲染为 HTML/PDF。支持 modern、classic、minimal 等内置模板，也支持自定义模板或 agent 根据描述生成风格。
- **[cv-clone](./cv-clone/SKILL.md)** — 复刻目标简历或 CV 样张的视觉版式，产出可编辑的 LaTeX 模板。给定一张样例简历（PDF/截图），按其版式生成一份可编译的 LaTeX 模板（`tectonic`/`xelatex` 链），自带 `\newcommand` 占位符，**默认不填内容**——先出模板预览，再问用户是否需要帮忙填真实信息。Skill 独立运行，不依赖其他 skill。
