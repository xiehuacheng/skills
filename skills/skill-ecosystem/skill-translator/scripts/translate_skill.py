#!/usr/bin/env python3
"""
Helper script for skill-translator.

Supports one operation:
  --detect <skill-dir>   Detect the source language of SKILL.md (zh-CN or en).
"""

import argparse
import re
import sys
from pathlib import Path


def extract_body(skill_path: Path) -> str:
    """Read SKILL.md and strip frontmatter and code blocks for language detection."""
    text = skill_path.read_text(encoding="utf-8")

    # Remove frontmatter
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            text = parts[2]

    # Remove fenced code blocks
    text = re.sub(r"```[\s\S]*?```", "", text)

    # Remove inline code
    text = re.sub(r"`[^`]+`", "", text)

    return text


def detect_language(skill_dir: Path) -> str:
    """Return 'zh-CN' if the body is mostly Chinese, otherwise 'en'."""
    skill_path = skill_dir / "SKILL.md"
    if not skill_path.exists():
        raise FileNotFoundError(f"SKILL.md not found in {skill_dir}")

    body = extract_body(skill_path)

    # CJK characters
    cjk_count = len(re.findall(r"[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]", body))

    # Latin letters
    latin_count = len(re.findall(r"[a-zA-Z]", body))

    total = cjk_count + latin_count
    if total == 0:
        raise ValueError("No detectable text found in SKILL.md")

    return "zh-CN" if cjk_count / total > 0.5 else "en"


def main() -> int:
    parser = argparse.ArgumentParser(description="Helper for translating skill SKILL.md files.")
    parser.add_argument("--detect", type=Path, help="Detect source language of SKILL.md")

    args = parser.parse_args()

    if args.detect:
        try:
            lang = detect_language(args.detect)
            print(lang)
            return 0
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            return 1

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
