#!/usr/bin/env python3
"""
Quick validation script for Kimi Code skills.

Checks frontmatter, naming, description quality, referenced files, and basic standards.

Usage:
    quick_validate.py <skill_directory>
"""

import os
import re
import sys
from pathlib import Path

MAX_SKILL_NAME_LENGTH = 64
MAX_DESCRIPTION_LENGTH = 1024
DESCRIPTION_WARNING_LENGTH = 500
BODY_WORD_WARNING = 1200

# CJK Unified Ideographs + Hiragana + Katakana + Hangul + CJK Symbols.
# Used to flag accidental user-language mixing in frontmatter `description`,
# where the description is the agent-routing parse target. The skill body
# stays free-form because legitimate skills (i-translation, multilingual)
# document non-Latin text intentionally.
CJK_PATTERN = re.compile(
    r"["
    r"\u3000-\u303f"          # CJK Symbols and Punctuation
    r"\u3040-\u309f"          # Hiragana
    r"\u30a0-\u30ff"          # Katakana
    r"\u4e00-\u9fff"          # CJK Unified Ideographs (common)
    r"\uac00-\ud7af"          # Hangul Syllables
    r"\u3400-\u4dbf"          # CJK Unified Ideographs Extension A
    r"]"
)


def parse_frontmatter_text(content):
    """Extract the raw frontmatter text from SKILL.md."""
    if not content.startswith("---"):
        return None, "No YAML frontmatter found"
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None, "Invalid frontmatter format"
    return match.group(1), None


def parse_yaml_simple(text):
    """Minimal YAML parser for flat string frontmatter."""
    result = {}
    current_key = None
    current_value_lines = []

    def flush():
        nonlocal current_key, current_value_lines
        if current_key is None:
            return
        value = "\n".join(current_value_lines).strip()
        if len(value) >= 2:
            if (value[0] == '"' and value[-1] == '"') or (
                value[0] == "'" and value[-1] == "'"
            ):
                value = value[1:-1]
        result[current_key] = value
        current_key = None
        current_value_lines = []

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line or line.startswith("#"):
            continue

        key_match = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", line)
        if key_match:
            flush()
            current_key = key_match.group(1)
            rest = key_match.group(2)
            if rest:
                current_value_lines.append(rest)
        elif current_key is not None:
            current_value_lines.append(line)

    flush()
    return result


def parse_frontmatter(frontmatter_text):
    """Parse frontmatter, trying PyYAML first then a simple fallback."""
    try:
        import yaml

        frontmatter = yaml.safe_load(frontmatter_text)
        if frontmatter is None:
            return {}, None
        if not isinstance(frontmatter, dict):
            return None, "Frontmatter must be a YAML dictionary"
        return {str(k): v for k, v in frontmatter.items()}, None
    except ImportError:
        return parse_yaml_simple(frontmatter_text), None
    except Exception as e:
        return None, f"Invalid YAML in frontmatter: {e}"


def extract_body(content):
    """Return the markdown body after the frontmatter."""
    match = re.match(r"^---\n.*?\n---\n(.*)$", content, re.DOTALL)
    if not match:
        return content
    return match.group(1)


def clean_body_for_reference_search(body):
    """Remove inline code and fenced code blocks before searching for references."""
    # Remove fenced code blocks
    cleaned = re.sub(r"```[\s\S]*?```", "", body)
    # Remove inline code spans
    cleaned = re.sub(r"`[^`\n]+`", "", cleaned)
    return cleaned


def find_referenced_files(body):
    """Find references to files under references/, scripts/, assets/."""
    cleaned = clean_body_for_reference_search(body)
    # Exclude whitespace, brackets, quotes, backticks, and common markdown punctuation
    filename_chars = r"[^\s\)\]\>\"\'`,;:*]"
    patterns = [
        rf"references/{filename_chars}+",
        rf"scripts/{filename_chars}+",
        rf"assets/{filename_chars}+",
    ]
    found = set()
    for pattern in patterns:
        for match in re.finditer(pattern, cleaned):
            found.add(match.group(0))
    return found


def validate_skill(skill_path):
    """Validate a Kimi Code skill. Returns (valid, messages)."""
    skill_path = Path(skill_path).resolve()
    messages = []
    errors = []
    warnings = []

    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        errors.append("SKILL.md not found")
        return False, errors

    content = skill_md.read_text()
    frontmatter_text, error = parse_frontmatter_text(content)
    if error:
        errors.append(error)
        return False, errors

    frontmatter, error = parse_frontmatter(frontmatter_text)
    if error:
        errors.append(error)
        return False, errors

    allowed_properties = {"name", "description", "metadata"}
    unexpected_keys = set(frontmatter.keys()) - allowed_properties
    if unexpected_keys:
        unexpected = ", ".join(sorted(unexpected_keys))
        allowed = ", ".join(sorted(allowed_properties))
        errors.append(f"Unexpected key(s) in frontmatter: {unexpected}. Allowed: {allowed}")

    if "name" not in frontmatter:
        errors.append("Missing 'name' in frontmatter")
    if "description" not in frontmatter:
        errors.append("Missing 'description' in frontmatter")

    if errors:
        return False, errors + warnings

    name = frontmatter.get("name", "")
    if not isinstance(name, str):
        errors.append(f"Name must be a string, got {type(name).__name__}")
    else:
        name = name.strip()
        if not name:
            errors.append("Name cannot be empty")
        elif not re.match(r"^[a-z0-9-]+$", name):
            errors.append(
                f"Name '{name}' should be hyphen-case (lowercase letters, digits, and hyphens only)"
            )
        elif name.startswith("-") or name.endswith("-") or "--" in name:
            errors.append(
                f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens"
            )
        elif len(name) > MAX_SKILL_NAME_LENGTH:
            errors.append(
                f"Name is too long ({len(name)} characters). Maximum is {MAX_SKILL_NAME_LENGTH}."
            )
        else:
            expected_dir_name = name
            actual_dir_name = skill_path.name
            if actual_dir_name != expected_dir_name:
                warnings.append(
                    f"Directory name '{actual_dir_name}' does not match skill name '{expected_dir_name}'"
                )

    description = frontmatter.get("description", "")
    if not isinstance(description, str):
        errors.append(f"Description must be a string, got {type(description).__name__}")
    else:
        description = description.strip()
        if not description:
            errors.append("Description cannot be empty")
        else:
            if "<" in description or ">" in description:
                errors.append("Description cannot contain angle brackets (< or >)")
            if len(description) > MAX_DESCRIPTION_LENGTH:
                errors.append(
                    f"Description is too long ({len(description)} characters). Maximum is {MAX_DESCRIPTION_LENGTH}."
                )
            elif len(description) > DESCRIPTION_WARNING_LENGTH:
                warnings.append(
                    f"Description is {len(description)} characters. Consider keeping it under {DESCRIPTION_WARNING_LENGTH}."
                )

            cjk_in_description = CJK_PATTERN.search(description)
            if cjk_in_description:
                warnings.append(
                    f"Description contains non-Latin script (CJK character {cjk_in_description.group(0)!r} at offset {cjk_in_description.start()}). creating-skills default is English; replace user-language phrases with language-neutral wording in the description and put any quoted examples in the body."
                )

            # Check for workflow-summary patterns that may cause agents to skip the body
            summary_phrases = [
                "this skill provides a step-by-step",
                "this skill guides you through",
                "this skill walks you through",
                "follow these steps",
            ]
            lowered = description.lower()
            for phrase in summary_phrases:
                if phrase in lowered:
                    warnings.append(
                        f"Description may summarize workflow ('{phrase}'). Prefer describing what it is and when to use it."
                    )

            if "use when" not in lowered and "trigger" not in lowered:
                warnings.append(
                    "Description could be stronger if it includes 'Use when...' or concrete trigger phrases."
                )

    body = extract_body(content)
    body_words = len(body.split())
    if body_words > BODY_WORD_WARNING:
        warnings.append(
            f"SKILL.md body is {body_words} words. Consider moving detailed content to references/ for progressive disclosure."
        )

    referenced_files = find_referenced_files(body)
    for ref in referenced_files:
        ref_path = skill_path / ref
        if not ref_path.exists():
            warnings.append(f"Referenced file does not exist: {ref}")

    scripts_dir = skill_path / "scripts"
    if scripts_dir.exists():
        for script in scripts_dir.iterdir():
            if script.is_file():
                if not os.access(script, os.X_OK):
                    warnings.append(f"Script is not executable: scripts/{script.name}")

    return len(errors) == 0, errors, warnings


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python quick_validate.py <skill_directory>")
        sys.exit(1)

    valid, errors, warnings = validate_skill(sys.argv[1])
    for msg in errors:
        print(f"[ERROR] {msg}")
    for msg in warnings:
        print(f"[WARN] {msg}")

    print()
    if valid and not warnings:
        print("Skill is valid!")
    elif valid:
        print("Skill is valid (with warnings above).")
    else:
        print("Skill validation failed.")

    sys.exit(0 if valid else 1)
