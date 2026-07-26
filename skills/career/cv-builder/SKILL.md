---
name: cv-builder
description: "Use when the user wants to build a tech resume or CV. Generate a programmer/technical resume or CV from local projects, GitHub repositories, old resume files, or plain text. Trigger phrases: help me write a resume, generate a resume from these projects, organize GitHub projects into a resume, polish my resume, generate a technical resume PDF."
metadata:
  author: xiehuacheng
  version: "1.0.0"
---

# CV Builder

## Overview

Turn scattered developer experience — local projects, GitHub repositories, old resume files, or plain-text notes — into a polished, ready-to-submit resume or CV. This skill acts as a technical recruiter: read source materials in parallel, ask targeted follow-up questions, draft content in Markdown, and render it to HTML/PDF via customizable templates.

## When to Use

Use when the user wants to:

- Create a new resume or CV from scratch
- Turn GitHub projects or local codebases into resume bullet points
- Update or reformat an existing resume/CV
- Generate a PDF resume with a specific visual style
- Tailor a resume for a specific role or industry

## When Not to Use

Do not use for:

- Writing cover letters or application emails
- Submitting resumes to job boards or company portals
- Verifying the truthfulness of work history or project claims
- Guaranteeing ATS compatibility or interview responses
- Non-technical resumes unless the user explicitly provides all content

## Boundaries and Defaults

**Can do:** read local projects, GitHub repos, old resume files, or plain-text notes; dispatch sub-agents to read materials in parallel; ask targeted follow-up questions; draft a Markdown resume; render to HTML/PDF via built-in (modern/classic/minimal) or custom templates.

**Cannot do (without explicit user approval):** fabricate experience, projects, or metrics not in the source materials; submit resumes to job boards or company portals; modify any source files outside the skill's output directory.

**Default behavior:** read-only on source materials; all writes go to the user's chosen output directory and require approval; the user confirms every personal claim (employment dates, project metrics, technologies used) before it enters the draft.

## Core Workflow

Execute the following steps in order. During interactive phases where the user must make choices, **use the structured question/interaction capabilities provided by the current Agent** (e.g., multiple choice, single choice, confirmation boxes) instead of dumping large blocks of text questions into the chat.

### Step 1: Collect Input Sources

Ask the user what materials they have. Any combination is supported:

| Source | Handling |
|--------|----------|
| Local project folder | Read README, package.json, pyproject.toml, and source-code summaries |
| GitHub repository URL | Fetch repository metadata and README |
| Existing resume file (PDF/DOCX/MD) | Extract text; on macOS, use `textutil -convert txt` for DOCX |
| Plain text or notes | Accept as-is |
| LinkedIn / Notion / portfolio URL | Scrape if possible; otherwise ask the user to export |

Do not start generating content until the user has provided all materials.

### Step 2: Dispatch Sub Agents to Read Materials

The main agent decides the dispatch strategy based on project size:

- **Large projects** (many files, complex code): assign a dedicated sub agent
- **Small projects or simple files**: combine into one sub agent
- **Old resume / text notes**: one sub agent

Each sub agent returns a concise summary including:

- Project/file purpose
- Key technologies used
- Notable features or achievements
- Quantifiable impact (if any)
- Suggested resume bullet points

### Step 3: Ask for Personal Information

Confirm or collect the following through structured interactions, grouped by topic:

1. **Basic info**: name, email, phone, location, LinkedIn, GitHub
2. **Career goal**: target role, industry, city
3. **Experience and skills**: education, work experience, projects, tech stack
4. **Bonus items**: certifications, languages, awards, open-source contributions
5. **Photo (optional)**: whether to provide an ID photo and place it in the top-right corner of the resume

Pre-fill answers using the source summaries and let the user edit or add details.

### Step 4: Draft the Markdown Resume

Generate a Markdown resume that:

- Has a clear, ATS-friendly structure
- Includes keywords for the target role
- Uses concise bullet points (preferably STAR method)
- Matches skills to the target role

Show the draft to the user and ask them to edit it. Repeat until the user approves the content.

### Step 5: Choose a Template

Ask the user for their preferred style through structured interactions:

- **Built-in templates**: modern (modern single-column), classic (classic two-column), minimal (minimal)
- **User-provided template**: accept an HTML/CSS file path
- **Agent-designed**: user describes the style, and the agent generates HTML/CSS

Render an HTML preview and show it to the user.

### Step 6: Confirm Page Layout

Ask the user about layout preferences through structured interactions:

- **Page count**: squeeze to one page or allow multiple pages?
- **Photo**: provide an ID photo and place it in the top-right corner?
- **Other adjustments**: font size, line spacing, margins, etc.?

Modify the HTML/CSS and re-render the preview based on the user's choices. If the user chooses one page, use `build_resume.py --one-page` to generate a compact layout.

### Step 7: Generate the PDF

Convert the HTML preview to PDF using WeasyPrint.

Dependency handling:

1. Check whether a dedicated `uv` virtual environment exists in the skill directory and whether WeasyPrint is installed
2. If not, create the environment and run `uv pip install weasyprint`
3. If automatic installation fails, output the HTML preview and provide manual installation instructions

Iterate with the user on layout, content, and template until satisfied.

## Resources

- `scripts/build_resume.py` — main entry point (supports `--one-page` compact layout)
- `scripts/render_pdf.py` — HTML to PDF (WeasyPrint, auto-injects Hiragino Sans GB font on macOS)
- `scripts/ensure_weasyprint.py` — manages the `uv` environment
- `scripts/read_project.py` — scans key files in local projects
- `assets/templates/` — built-in HTML/CSS templates
- `references/example-resume.md` — example Markdown resume format
