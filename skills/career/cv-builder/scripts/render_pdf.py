#!/usr/bin/env python3
"""
Render an HTML file to PDF using WeasyPrint from the skill's uv environment.

Usage:
    render_pdf.py --html input.html --output output.pdf [--skill-dir /path/to/cv-builder]

Prints JSON result to stdout.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

VENV_DIR = ".venv"


def find_skill_dir() -> Path:
    return Path(__file__).resolve().parent.parent


def venv_python(venv_dir: Path) -> Path:
    if sys.platform == "win32":
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


def library_env() -> dict[str, str]:
    """Return an env dict with library paths set so WeasyPrint can find system libs."""
    env = os.environ.copy()
    extra_paths = []
    if sys.platform == "darwin" and Path("/opt/homebrew/lib").exists():
        extra_paths.append("/opt/homebrew/lib")
    if sys.platform == "darwin" and Path("/usr/local/lib").exists():
        extra_paths.append("/usr/local/lib")
    if extra_paths:
        key = "DYLD_LIBRARY_PATH"
        existing = env.get(key, "")
        env[key] = ":".join(extra_paths + ([existing] if existing else []))
    return env


def render_with_weasyprint(py: Path, html_path: Path, output_path: Path) -> None:
    # On macOS, extract Hiragino Sans GB W3/W6 from the system TTC and inject
    # @font-face rules directly into the HTML. This makes WeasyPrint embed the
    # regular/bold faces instead of falling back to Hiragino Sans GB Light, and
    # avoids Preview.app display issues with subsetted PingFang SC fonts.
    script = r'''
import shutil, sys, tempfile
from pathlib import Path

from weasyprint import HTML

HIRAGINO_TTC = Path("/System/Library/Fonts/Hiragino Sans GB.ttc")

html_path = Path(sys.argv[1])
output_path = Path(sys.argv[2])
html_content = html_path.read_text(encoding="utf-8")

tmpdir = None
try:
    if sys.platform == "darwin" and HIRAGINO_TTC.exists():
        try:
            from fontTools.ttLib import TTCollection

            tmpdir = Path(tempfile.mkdtemp(prefix="cv_hiragino_"))
            ttc = TTCollection(str(HIRAGINO_TTC))
            # Index 0 = W3 (Regular), Index 2 = W6 (Bold)
            w3_path = tmpdir / "HiraginoSansGB-W3.ttf"
            w6_path = tmpdir / "HiraginoSansGB-W6.ttf"
            ttc.fonts[0].save(str(w3_path))
            ttc.fonts[2].save(str(w6_path))
            font_css = """
<style>
@font-face {
  font-family: "Hiragino Sans GB";
  src: url("file://%s");
  font-weight: 400;
}
@font-face {
  font-family: "Hiragino Sans GB";
  src: url("file://%s");
  font-weight: 700;
}
</style>
""" % (w3_path, w6_path)
            html_content = html_content.replace("</head>", font_css + "</head>")
        except Exception:
            pass

    base_url = html_path.parent.as_uri() + "/"
    HTML(string=html_content, base_url=base_url).write_pdf(str(output_path))
finally:
    if tmpdir is not None:
        shutil.rmtree(tmpdir, ignore_errors=True)
'''
    subprocess.run(
        [str(py), "-c", script, str(html_path), str(output_path)],
        check=True,
        env=library_env(),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Render HTML to PDF with WeasyPrint.")
    parser.add_argument("--html", required=True, help="Input HTML file")
    parser.add_argument("--output", required=True, help="Output PDF file")
    parser.add_argument("--skill-dir", type=Path, help="Path to the cv-builder skill directory")
    args = parser.parse_args()

    skill_dir = args.skill_dir or find_skill_dir()
    venv_dir = skill_dir / VENV_DIR
    py = venv_python(venv_dir)

    html_path = Path(args.html).resolve()
    output_path = Path(args.output).resolve()

    if not html_path.exists():
        print(json.dumps({"success": False, "error": f"HTML file not found: {html_path}"}, ensure_ascii=False))
        return 1

    try:
        render_with_weasyprint(py, html_path, output_path)
        result = {
            "success": True,
            "input": str(html_path),
            "output": str(output_path),
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except Exception as exc:
        result = {
            "success": False,
            "error": str(exc),
            "hint": f"Run {skill_dir}/scripts/ensure_weasyprint.py first.",
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    sys.exit(main())
