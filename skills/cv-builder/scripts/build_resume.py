#!/usr/bin/env python3
"""
Build an HTML resume from a Markdown content file and a template.

Usage:
    build_resume.py --content resume.md --template modern --output resume.html
    build_resume.py --content resume.md --template-dir /path/to/custom --output resume.html

Built-in templates: modern, classic, minimal.
The template directory must contain a `resume.html` Jinja2 template.
"""

import argparse
import base64
import json
import mimetypes
import os
import subprocess
import sys
from pathlib import Path


def find_skill_dir() -> Path:
    return Path(__file__).resolve().parent.parent


def ensure_venv_python() -> None:
    """Re-execute this script with the skill's uv venv Python if available and not already using it."""
    skill_dir = find_skill_dir()
    venv_python = skill_dir / ".venv" / "bin" / "python"
    if sys.platform == "win32":
        venv_python = skill_dir / ".venv" / "Scripts" / "python.exe"

    if venv_python.exists() and sys.executable != str(venv_python):
        # Avoid infinite recursion if venv python also cannot satisfy imports
        if os.environ.get("CV_BUILDER_VENV_REEXEC") != "1":
            env = os.environ.copy()
            env["CV_BUILDER_VENV_REEXEC"] = "1"
            result = subprocess.run([str(venv_python), __file__] + sys.argv[1:], env=env)
            sys.exit(result.returncode)


ensure_venv_python()

try:
    import markdown
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    print(
        json.dumps(
            {
                "success": False,
                "error": "markdown and jinja2 are required. Run ensure_weasyprint.py to set up the environment.",
            },
            ensure_ascii=False,
        )
    )
    sys.exit(1)


def find_builtin_template(name: str) -> Path:
    skill_dir = find_skill_dir()
    template_dir = skill_dir / "assets" / "templates" / name
    if not template_dir.exists():
        available = [d.name for d in (skill_dir / "assets" / "templates").iterdir() if d.is_dir()]
        raise ValueError(f"Unknown template '{name}'. Available: {', '.join(available)}")
    return template_dir


def photo_data_uri(photo_path: Path) -> str:
    """Embed a photo as a base64 data URI for self-contained HTML/PDF output."""
    mime, _ = mimetypes.guess_type(str(photo_path))
    mime = mime or "image/png"
    data = photo_path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{b64}"


ONE_PAGE_CSS = """
<style>
/* one-page overrides: shrink everything to fit a single A4 page */
@page { margin: 1.2cm !important; }
body { font-size: 8.5pt !important; line-height: 1.2 !important; }
h1 { font-size: 16pt !important; }
h2 { font-size: 9.5pt !important; margin-top: 0.7em !important; margin-bottom: 0.35em !important; }
h3 { font-size: 9pt !important; margin: 0.35em 0 0.1em !important; }
.contact { font-size: 8.5pt !important; margin-bottom: 0.6em !important; }
p { margin: 0.1em 0 !important; }
ul { margin: 0.15em 0 !important; padding-left: 1em !important; }
li { margin-bottom: 0.1em !important; }
</style>
"""


def render_resume(
    content_md: str,
    template_dir: Path,
    photo: str | None = None,
    one_page: bool = False,
) -> str:
    env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("resume.html")
    html_content = markdown.markdown(content_md, extensions=["extra", "nl2br"])
    html = template.render(content=html_content, photo=photo)
    if one_page:
        html = html.replace("</head>", ONE_PAGE_CSS + "</head>")
    return html


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an HTML resume from Markdown and a template.")
    parser.add_argument("--content", required=True, help="Input Markdown resume file")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--template", help="Built-in template name (modern, classic, minimal)")
    group.add_argument("--template-dir", help="Path to a custom template directory")
    parser.add_argument("--output", required=True, help="Output HTML file")
    parser.add_argument("--photo", help="Optional path to a profile photo (jpg/png)")
    parser.add_argument("--one-page", action="store_true", help="Shrink layout to fit a single A4 page")
    args = parser.parse_args()

    content_path = Path(args.content).resolve()
    output_path = Path(args.output).resolve()

    if not content_path.exists():
        print(json.dumps({"success": False, "error": f"Content file not found: {content_path}"}, ensure_ascii=False))
        return 1

    photo = None
    if args.photo:
        photo_path = Path(args.photo).resolve()
        if not photo_path.exists():
            print(json.dumps({"success": False, "error": f"Photo file not found: {photo_path}"}, ensure_ascii=False))
            return 1
        photo = photo_data_uri(photo_path)

    try:
        template_dir = Path(args.template_dir).resolve() if args.template_dir else find_builtin_template(args.template)
        content_md = content_path.read_text(encoding="utf-8")
        html = render_resume(content_md, template_dir, photo=photo, one_page=args.one_page)
        output_path.write_text(html, encoding="utf-8")
        result = {
            "success": True,
            "template_dir": str(template_dir),
            "output": str(output_path),
            "photo_embedded": bool(photo),
            "one_page": bool(args.one_page),
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    sys.exit(main())
