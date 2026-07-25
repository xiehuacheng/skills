# Common Mistakes (速查)

The five failures agents hit after the top-5 already inlined in `SKILL.md`. Brief entries only — full failure-mode reasoning in the original catalogue (pre-0.3 refactor).

## 6. Forgetting `\usepackage{xcolor}` before `\definecolor`

`Undefined control sequence \definecolor` at compile. The skeleton (`references/latex-template-skeleton.tex`) already lists every required package. Diff against it before writing custom templates.

## 7. Long CJK strings refusing to break across lines

A project title like "大模型 KVCache 压缩高效推理方法" overflows the page width. `xeCJK` does not auto-break CJK strings without `\xeCJKsetup{CJKecglue=\hskip 0.15em plus 0.05em minus 0.05em}`. Even with it, very long strings with no Latin punctuation can resist breaking.

Fix: shorten the string (preferred), or insert a soft break via `\\` or `\allowbreak`. Do **not** monkey-patch `\XeTeXlinebreaklocale` mid-template — it is global.

## 9. `tectonic` compile failure from missing package in offline mode

Second compile (no internet) errors with `Package not found: titlesec.sty`. `tectonic` caches packages from the first compile. If the cache is cleared (e.g., user ran `tectonic --clean`), subsequent offline compiles fail.

Fix: detect the missing package, re-run online for that one package. Or warn the user that the first compile after any cache clear needs internet.

## 10. Mismatched `geometry` margins vs sample

Cloned template uses 1.6 cm margins but the sample uses 1.0 cm. The agent copied default margin from the skeleton, never measured the source PDF. The visual fidelity hinges on margins as much as font choice.

Fix: use `pdfinfo` to extract the source's page geometry, then set `\usepackage[margin=<measured>]{geometry}`.