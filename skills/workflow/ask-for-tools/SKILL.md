---
name: ask-for-tools
description: Use when a new task starts or execution is stuck and the agent suspects a missing tool is the real blocker. First self-check whether the tool already exists; if not, explain the reason, alternatives, and fallback/stop options to the user.
metadata:
  author: xiehuacheng
  version: "1.0.0"
---

# Ask for Tools

When the agent is limited by tool boundaries rather than reasoning ability, proactively ask the user for tools instead of brute-forcing it.

**What it can do:**
- Identify the categories of tools the task may need (MCP server, CLI tools, Python/Node packages, API keys, permissions, local files).
- Self-check whether a tool already exists, is loaded, or is configured before asking for it.
- Make the request in a structured way: what is missing, why, what happens without it, and alternatives.
- Give the user options: provide the tool / try a fallback / stop the task.
- Remember the user's choice in the current conversation.

**What it cannot do (without explicit authorization):**
- Install system-level software or modify global configuration.
- Create or modify persistent configuration files outside the current task context.
- Assume the user has authorized a tool just because it was used before.
- Bypass explicit approval to obtain API keys, tokens, credentials, or elevated permissions.

**Default behavior:**
- Ask before installing. The agent can check whether a tool exists, but will not automatically install system-affecting tools without approval.
- When the user refuses to provide a tool, offer fallback or stop options instead of silently failing or repeatedly hitting the same dead end.
- Keep each request concise; related tools can be grouped.
- Explain why the tool is needed in plain language.

## Trigger Conditions

1. **At the start of a new task** — the task clearly requires tools the agent may not have.
2. **When execution is stuck** — errors, timeouts, or abnormal output strongly suggest a missing tool.
3. **When the user says** — "missing tool", "install a tool", "do I lack a tool", "what tools can you use", "ask for tools".

## When Not to Trigger

- The current toolset can obviously complete the task.
- The failure is a bug in existing code, not a missing tool.
- The user has already explicitly refused to provide a tool for the current task.

## Tool Categories and Self-Checks

| Category | Examples | Self-Check Method |
|------|------|---------|
| CLI tools | `gh`, `kubectl`, `ffmpeg`, `pandoc` | `which <tool>` or `<tool> --version` |
| Python packages | `requests`, `pandas`, `numpy` | `python3 -c "import <pkg>"` |
| Node packages | `cheerio`, `axios` | `node -e "require('<pkg>')"` |
| MCP server | GitHub, browser, database | Check loaded MCP tools or server configuration |
| API keys / tokens | OpenAI, GitHub, maps | Check environment variables or ask the user |
| System permissions | File writes, network, sudo | Judge from error messages or ask the user |
| Local files / data | Configs, credentials, reference docs | `ls`, `find`, or ask the user |

## Request Format

```
I may need [tool name] to continue this task.

Reason: [one-sentence explanation of why current tools are insufficient]
Checked: [whether it already exists / whether low-risk acquisition was attempted]
If missing: [what will happen, or why it cannot continue]
Alternative: [if any, whether existing tools can do a passable job]

Options:
1. Provide [tool name] — I will continue with the best plan.
2. Try fallback — I will do my best with existing tools, but results may be limited.
3. Stop the task — Come back to me when you have this tool.
```

## Workflow

### Pre-check at Task Start

1. Summarize the task in one sentence.
2. Determine: which tool is the agent most likely missing?
3. If a candidate tool is identified, self-check whether it exists first.
4. If it exists, use it directly; if not, make the request using the request format.
5. Do not block the entire task over minor uncertainty; only pause for high-confidence missing tools.

### Rescue During Execution

1. When an error or abnormal output occurs, diagnose whether it is caused by a missing tool.
2. First rule out code bugs and bad input.
3. If a tool is missing, self-check whether it exists first.
4. If it exists but is unavailable, report the actual failure; if it does not exist, make the request using the request format.
5. Provide fallback or stop options.

### Handling User Responses

- **User provides the tool**: confirm, verify it works, and continue.
- **User chooses fallback**: record the limitation, try alternatives, and keep the user informed.
- **User chooses stop**: summarize what has been completed and what is blocked.
- **User does not respond**: follow up once, then default to trying a fallback.

## Error Handling

| Issue | Handling |
|------|---------|
| Self-check command fails | Report the failure and ask the user directly. |
| User provides the wrong tool | Explain the mismatch, re-ask, or offer a fallback. |
| Tool exists but does not work | Treat it as a tool failure, not a missing tool. |
| User refuses multiple times | Stop asking for the same tool; fallback or stop. |

## Resources

- `references/tool-categories.md` — quick reference for common tool categories and self-check commands.
