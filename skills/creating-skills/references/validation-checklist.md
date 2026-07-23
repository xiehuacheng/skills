# Skill Validation Checklist

Use when reviewing or testing a skill before shipping it.

## Checklist

**Documentation**

- [ ] Frontmatter `name` and `description` present, under 1024 chars
- [ ] `description` says what the skill is for + which user phrases trigger it
- [ ] Body declares **Can do / Cannot do / Default behavior**
- [ ] Every command has a clear invocation example
- [ ] Pre-run checks (auth, scopes, env) documented
- [ ] Approval points for writes explicit
- [ ] Expected output shape shown with examples
- [ ] Common errors + recovery steps listed
- [ ] Sub-agent prompts provided if the skill delegates

**Implementation**

- [ ] Scripts run from skill root without global installs
- [ ] Commands produce the output the docs promise
- [ ] Default values in code match SKILL.md defaults
- [ ] Writes do not execute without explicit approval
- [ ] Temporary files cleaned up unless user asked to keep
- [ ] Cache behavior documented and manually clearable
- [ ] After any `Write`, agent reads back first lines to catch malformed headers / line endings

**Quality & Testing**

- [ ] `scripts/quick_validate.py <skill-dir>` passes
- [ ] Each documented command was run successfully
- [ ] Output artifacts match expected shape
- [ ] Edge cases tested (missing inputs, bad auth, unwritable paths)
- [ ] For workflow skills, a sub-agent completed an end-to-end realistic request
- [ ] Skill `version` bumped if behavior changed

## Per-Skill-Type Validation

After `quick_validate.py` passes, add checks based on skill type:

| Skill Type | Add |
|---|---|
| Reference / technique | Read-through for accuracy |
| Workflow with scripts | Run each documented command + inspect output |
| Multi-step / sub-agent workflow | Dispatch a sub-agent with a realistic end-to-end request + review report |
| Write-operation | Verify every write path requires explicit approval + shows result |

For sub-agent testing, give it: skill root path, a realistic user request, a checklist of things to verify, and instruction to **report issues, not fix them**. Iterate. Bump `version` on changes.