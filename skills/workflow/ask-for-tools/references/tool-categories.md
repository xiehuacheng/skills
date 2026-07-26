# Tool Categories Reference

Quick reference for self-checking whether a tool is available before asking the user for it.

## CLI Tools

Check with `which <tool>` or `<tool> --version`.

Common examples:
- `gh` — GitHub CLI
- `kubectl` — Kubernetes CLI
- `ffmpeg` — media processing
- `pandoc` — document conversion
- `jq` — JSON processing
- `curl` / `wget` — HTTP requests

## Python Packages

Check with:

```bash
python3 -c "import <package>"
```

Common examples:
- `requests` — HTTP
- `pandas` — data processing
- `numpy` — numerical computing
- `beautifulsoup4` — HTML parsing
- `selenium` / `playwright` — browser automation

## Node Packages

Check with:

```bash
node -e "require('<package>')"
```

Common examples:
- `axios` — HTTP
- `cheerio` — server-side HTML parsing
- `puppeteer` / `playwright` — browser automation

## MCP Servers

Check whether the MCP server is loaded in the current environment. Methods vary by host:
- Look for MCP tool listings in the system prompt or tool registry.
- Check project-specific MCP configuration files.
- Ask the user if a specific MCP server is available.

Common examples:
- GitHub MCP
- Browser / web search MCP
- Database MCP
- File system MCP

## API Keys / Tokens

Check environment variables first:

```bash
env | grep -i <name>
```

If not present, ask the user. Never guess credentials.

Common examples:
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `ANTHROPIC_API_KEY`

## System Permissions

Infer from error messages:
- `Permission denied` → may need elevated permissions or different file ownership.
- `Operation not permitted` → may need system permission or sandbox escape.
- Network timeouts → may need network access or proxy configuration.

When in doubt, describe the symptom and ask the user.

## Local Files / Data

Check with standard commands:

```bash
ls <path>
find <dir> -name "<pattern>"
```

If the file is user-specific or sensitive, ask before reading.
