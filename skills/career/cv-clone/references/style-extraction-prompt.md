# Style Extraction Prompt

When using a vision-capable model to read the target resume image, use this prompt to get a structured YAML skeleton back. The agent then maps each field onto LaTeX overrides in the canonical skeleton.

```text
You are extracting visual style from a resume image for LaTeX re-implementation.

Output strictly a YAML object with these fields:
  name_position          # left | center | right
  contact_layout         # single-line | multi-line | right-column | pipe-separated
  section_title_decor    # underline | background-block | none
  section_title_weight   # bold | extra-bold | regular
  section_title_case     # UPPERCASE | Title | as-is
  entry_firstline        # title-left-date-right | single-line | two-lines
  bullet_glyph           # • | - | numbered | none
  emphasis_style         # bold | colored | none
  primary_color          # hex, e.g. 1A1A1A
  text_color             # hex
  photo_position         # top-right | top-left | absent | other
  fonts_zh               # CJK family if visible (e.g. PingFang SC, Source Han Sans)
  fonts_en               # Latin family (e.g. Times New Roman, Inter)
  page_size              # A4 | Letter | other
  special_features       # list any of: sidebar, two-column, icons, divider-style-X

For each, give a 1-2 word description or short token. Do not summarize content.
Do not include real names, phones, or company claims — only style.
```

## Mapping to LaTeX overrides

After the model returns the YAML, the agent overrides these macros in `references/latex-template-skeleton.tex`:

| YAML field | LaTeX override |
|---|---|
| `name_position` | `\begin{center}` vs `\begin{flushleft}`/`\begin{flushright}` around `\cvname` |
| `contact_layout` | the line after `\cvname` in the header block |
| `section_title_decor` + `weight` + `case` | redefine `\cvsection` |
| `entry_firstline` | redefine `\cventry` |
| `bullet_glyph` | `label=\textbullet` → swap to `\textendash`, `\arabic*`, etc. in `\setlist` |
| `emphasis_style` | wrap bold / `\color{cvrule}` on the relevant macro |
| `primary_color` + `text_color` | `\definecolor{cvrule}{HTML}{...}` and `\definecolor{cvtext}{HTML}{...}` |
| `photo_position` | uncomment and adjust the `\cvphoto` tikz block; if `absent`, leave it commented |
| `fonts_zh` + `fonts_en` | `\setCJKmainfont{...}` and `\setmainfont{...}` |
| `page_size` | `\documentclass[a4paper]` vs `[letterpaper]` |
| `special_features` | custom TikZ / multicol additions (out of scope for the default skeleton) |