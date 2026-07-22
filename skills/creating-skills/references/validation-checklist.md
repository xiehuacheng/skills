# Skill Validation Checklist

Use this checklist when reviewing or testing a skill before shipping it.

## Documentation

- [ ] Frontmatter `name` and `description` are present and under 1024 characters.
- [ ] `description` explains what the skill is for and what user phrases trigger it.
- [ ] The body declares **Can do / Cannot do / Default behavior**.
- [ ] Every command has a clear invocation example.
- [ ] Pre-run checks (authentication, scopes, environment) are documented.
- [ ] Approval points for write operations are explicit.
- [ ] Expected output shape is shown with examples.
- [ ] Common errors and recovery steps are listed.
- [ ] Sub-agent prompts are provided if the skill delegates work.
- [ ] Key assumptions were challenged during design and documented if they remain unverified.

## Implementation

- [ ] Scripts run from the skill root without requiring global installs.
- [ ] Commands produce the output promised in the documentation.
- [ ] Default values in code match the defaults in `SKILL.md`.
- [ ] Write operations do not execute without explicit user approval.
- [ ] Temporary files are cleaned up unless the user asked to keep them.
- [ ] Cache behavior, if any, is documented and manually clearable.

## Quality & Testing

- [ ] `scripts/quick_validate.py <skill-dir>` passes.
- [ ] Each documented command was run successfully.
- [ ] Output artifacts match the expected shape and content.
- [ ] Edge cases were tested (missing inputs, bad auth, unwritable paths).
- [ ] For workflow skills, a sub-agent completed an end-to-end realistic request and reported no blockers.
- [ ] The skill `version` was bumped if behavior changed.

## Validation Approach by Skill Type

After `quick_validate.py` passes, run additional checks based on the skill type:

| Skill Type | Validation Approach |
|---|---|
| Reference / technique | `quick_validate.py` + read-through for accuracy |
| Workflow with scripts | `quick_validate.py` + run each documented command + inspect output |
| Multi-step / sub-agent workflow | `quick_validate.py` + dispatch a sub-agent with a realistic end-to-end request + review its report |
| Write-operation skill | Verify every write path requires explicit user approval and shows the result |

For sub-agent testing, give the sub-agent:

- The skill root path
- A realistic user request
- A checklist of things to verify (documentation clarity, command success, output quality, edge cases)
- Instructions to report issues, not fix them

Iterate based on sub-agent findings and user feedback. Bump the skill `version` whenever behavior changes.
