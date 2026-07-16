#!/usr/bin/env python3
"""
Scan a local project directory and extract key files for resume generation.

Usage:
    read_project.py /path/to/project [--max-depth 2]

Output: JSON to stdout with:
    - project_name
    - root_path
    - key_files (list of relative paths)
    - readme_excerpt
    - tech_stack (inferred from package files)
    - file_tree_summary
"""

import argparse
import json
import os
import sys
from pathlib import Path

DEFAULT_MAX_DEPTH = 2
KEY_FILES = [
    "README.md",
    "readme.md",
    "README.rst",
    "package.json",
    "pyproject.toml",
    "setup.py",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "build.gradle",
    "pom.xml",
    "Gemfile",
    "composer.json",
    "Dockerfile",
]

SKIP_DIRS = {
    ".git",
    ".github",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    "dist",
    "build",
    "target",
    ".idea",
    ".vscode",
}


def read_text_file(path: Path, max_chars: int = 4000) -> str:
    """Read a text file safely, capping length."""
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
        if len(content) > max_chars:
            content = content[:max_chars] + "\n... [truncated]"
        return content
    except Exception as exc:
        return f"[could not read {path.name}: {exc}]"


def infer_tech_stack(root: Path) -> list[str]:
    """Infer technologies from common config files."""
    stack = set()
    markers = {
        "package.json": "Node.js",
        "requirements.txt": "Python",
        "pyproject.toml": "Python",
        "setup.py": "Python",
        "Cargo.toml": "Rust",
        "go.mod": "Go",
        "build.gradle": "Java / Kotlin / Gradle",
        "pom.xml": "Java / Maven",
        "Gemfile": "Ruby",
        "composer.json": "PHP",
        "Dockerfile": "Docker",
    }
    for file, tech in markers.items():
        if (root / file).exists():
            stack.add(tech)
    return sorted(stack)


def build_file_tree(root: Path, max_depth: int) -> list[str]:
    """Build a concise file tree up to max_depth, skipping common ignored dirs."""
    tree = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Filter dirs in-place to avoid descending into skipped dirs
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        rel = Path(dirpath).relative_to(root)
        depth = len(rel.parts)
        if depth > max_depth:
            continue

        prefix = "  " * depth
        tree.append(f"{prefix}{rel.name or root.name}/")
        for f in sorted(filenames)[:10]:  # cap files per dir
            tree.append(f"{prefix}  {f}")
        if len(filenames) > 10:
            tree.append(f"{prefix}  ... and {len(filenames) - 10} more files")
    return tree


def main() -> int:
    parser = argparse.ArgumentParser(description="Read a project directory for resume content.")
    parser.add_argument("project_path", help="Path to the project directory")
    parser.add_argument("--max-depth", type=int, default=DEFAULT_MAX_DEPTH, help="Max tree depth")
    args = parser.parse_args()

    root = Path(args.project_path).resolve()
    if not root.exists():
        print(json.dumps({"error": f"Path does not exist: {root}"}, ensure_ascii=False))
        return 1
    if not root.is_dir():
        print(json.dumps({"error": f"Path is not a directory: {root}"}, ensure_ascii=False))
        return 1

    key_files_found = []
    for key in KEY_FILES:
        candidate = root / key
        if candidate.exists():
            key_files_found.append(key)

    readme_excerpt = ""
    for readme_name in ["README.md", "readme.md", "README.rst"]:
        readme = root / readme_name
        if readme.exists():
            readme_excerpt = read_text_file(readme, max_chars=6000)
            break

    result = {
        "project_name": root.name,
        "root_path": str(root),
        "key_files": key_files_found,
        "readme_excerpt": readme_excerpt,
        "tech_stack": infer_tech_stack(root),
        "file_tree_summary": build_file_tree(root, args.max_depth),
    }

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
