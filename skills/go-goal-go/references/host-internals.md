# Host-Internal References Index

The following files describe the goal-mode runtime. The user normally does not read them; they are for people implementing or hardening the host that executes `/goal` plans.

- `dispatch-primitive.md` — the canonical sub-agent dispatch contract (`dispatch_review_subagent`) with deterministic verdict parser, failure class enumeration, and portability table.
- `capability-boundary.md` — default-deny workspace containment, side-effect allowlist enforcement, secret scrubbing, tool audit log.

For the user-facing pieces:

- The natural-language shape of the goal plan lives in `SKILL.md` §"The standard goal plan (natural language)".
- The 4 sections of the `<reviewer>` block live in `SKILL.md` §"The `<reviewer>` block" and the user-facing template lives in `references/reviewer-template.md`.
- The prose checklist that maps contract items to paragraphs lives in `references/contract-glossary.md`.
