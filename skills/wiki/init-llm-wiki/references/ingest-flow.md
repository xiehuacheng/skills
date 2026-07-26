# Mandatory Ingest Flow — Discuss First, Write After

Ingest is **not** a batch task that "throws materials in and auto-generates cards." It is a human-machine collaborative curation process. Main session must complete the two phases below before dispatching sub-agents to write cards in parallel.

---

## Phase One — Discuss Key Takeaways

This step runs **first** and cannot be skipped. Focus is content-level conversation, not page planning.

1. **Read all raw materials** awaiting processing (from `00-Raw/`).
2. **Extract key takeaways by source**: 1–2 sentence summary per source, then core arguments, key concepts, important data, conflicts with existing content, author limitations/assumptions. List according to actual content; do not preset quantities.
3. **Present to the user and discuss**: what do these materials mainly say? Which points are most valuable? Which conflict with existing knowledge? Does the user have anything to add, question, or emphasize?
4. **Adjust takeaway priorities** based on user feedback.

---

## Phase Two — Plan Page Schemes

Only after Phase One is confirmed, translate discussion into a concrete writing plan.

1. **Propose a "Processing List for This Round"**: new concept/entity cards; existing pages to update; comparison/algorithm pages to create; overlapping topics to merge or clarify; content mentionable in existing pages.
2. **Show the list and wait for confirmation**: let the user see what will be written/changed/merged; ask about adjustments, additions, skipping, or merging.
3. **Only after user confirmation** dispatch sub-agents to create/update cards in parallel.
4. **After sub-agents complete**, the main session deduplicates, clarifies boundaries, updates `index.md` + `log.md`.

---

## Sub-Agent Failure Handling

If a sub-agent fails or times out, the main session takes over and manually completes the corresponding cards. See `WORKFLOWS.md` (created at init) for the full workflow.