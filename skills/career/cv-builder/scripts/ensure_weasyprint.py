#!/usr/bin/env python3
"""
Ensure a dedicated uv virtual environment exists and WeasyPrint is installed.

Usage:
    ensure_weasyprint.py [--skill-dir /path/to/cv-builder]

Exit codes:
    0 - WeasyPrint is available
    1 - Setup failed

On success, prints a JSON object with the path to the WeasyPrint module.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

VENV_DIR = ".venv"
REQUIRED_PACKAGES = ["weasyprint", "jinja2", "markdown"]


def find_skill_dir() -> Path:
    """Locate the skill directory from this script's location."""
    return Path(__file__).resolve().parent.parent


def ensure_uv() -> str:
    """Ensure `uv` is available on PATH."""
    uv = os.environ.get("UV_PATH", "uv")
    result = subprocess.run([uv, "--version"], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError("uv is not installed or not on PATH: " + result.stderr.strip())
    return uv


def venv_python(venv_dir: Path) -> Path:
    """Return the Python executable inside the venv."""
    if sys.platform == "win32":
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


def ensure_venv(skill_dir: Path, uv: str) -> Path:
    """Create the uv virtual environment if it doesn't exist."""
    venv_dir = skill_dir / VENV_DIR
    if not venv_dir.exists():
        subprocess.run([uv, "venv", str(venv_dir)], check=True)
    return venv_dir


def ensure_packages(skill_dir: Path, uv: str, venv_dir: Path) -> None:
    """Install required packages inside the venv using uv pip."""
    subprocess.run(
        [uv, "pip", "install", "--python", str(venv_python(venv_dir)), *REQUIRED_PACKAGES],
        cwd=str(skill_dir),
        check=True,
    )


def system_dependency_hint() -> str:
    """Return platform-specific instructions for WeasyPrint system dependencies."""
    if sys.platform == "darwin":
        return "WeasyPrint requires system libraries. Run: brew install pango cairo libffi gdk-pixbuf"
    if sys.platform == "linux":
        return "WeasyPrint requires system libraries. On Debian/Ubuntu run: sudo apt-get install libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0 libffi-dev libgdk-pixbuf2.0-0"
    return "WeasyPrint requires system libraries. See https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#installation"


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


def verify_weasyprint(venv_dir: Path) -> tuple[bool, str]:
    """Check that WeasyPrint can be imported in the venv. Returns (ok, error_message)."""
    py = venv_python(venv_dir)
    result = subprocess.run(
        [str(py), "-c", "import weasyprint; print(weasyprint.__version__)"],
        capture_output=True,
        text=True,
        env=library_env(),
    )
    if result.returncode == 0:
        return True, ""
    error = result.stderr.strip() or result.stdout.strip()
    if "cannot load library" in error.lower() or "could not import some external libraries" in error.lower():
        # Keep only the key line to avoid dumping the entire traceback.
        for line in error.splitlines():
            if "cannot load library" in line.lower() or "could not import" in line.lower():
                error = f"{line}\n\n{system_dependency_hint()}"
                break
    return False, error


def main() -> int:
    parser = argparse.ArgumentParser(description="Ensure WeasyPrint is available.")
    parser.add_argument("--skill-dir", type=Path, help="Path to the cv-builder skill directory")
    args = parser.parse_args()

    skill_dir = args.skill_dir or find_skill_dir()
    venv_dir = skill_dir / VENV_DIR

    try:
        uv = ensure_uv()
        ensure_venv(skill_dir, uv)

        ok, error = verify_weasyprint(venv_dir)
        if not ok:
            ensure_packages(skill_dir, uv, venv_dir)
            ok, error = verify_weasyprint(venv_dir)

        if not ok:
            raise RuntimeError(error)

        result = {
            "success": True,
            "venv": str(venv_dir),
            "python": str(venv_python(venv_dir)),
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except Exception as exc:
        result = {
            "success": False,
            "error": str(exc),
            "manual_install": f"cd {skill_dir} && uv venv && uv pip install --python {venv_python(venv_dir)} weasyprint jinja2 markdown",
        }
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    sys.exit(main())
