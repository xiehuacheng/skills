# 02-Areas / 02-Module — Three-Stage Evolution

The `02-Areas/` (or `02-Module/`) layer is the **browsing and learning view**: it aggregates scattered concept cards from `01-Wiki/` into a domain map. The hierarchy grows with the wiki's scale. Premature classification (empty folders) and excessive flattening (related pages crammed together) are both anti-patterns.

Core criterion: has the content naturally differentiated into independent organizational units?

---

## Stage One — Flat Index (Early)

When the wiki is small and each domain's intro + links fit clearly on one page, `02-Areas/` stays flat:

```
02-Areas/
└── index.md
```

`index.md` contains domain-grouped navigation and guidance. A 100–300 word intro plus relevant card links per domain is sufficient. **Do not create subfolders at this stage.**

Characteristics: one `index.md` overviews all domains; each domain's intro + link list is not crowded; boundaries are clear with no subtopics needing separate elaboration.

## Stage Two — Domain Landing Page (Growth)

Create a domain subfolder only when the domain has outgrown a single intro in `index.md`, or needs independent learning paths / pattern summaries / decision tables:

```
02-Areas/
├── index.md
└── Agent 与 Claude Code/
    └── index.md
```

The subfolder's `index.md` becomes a **landing page** with: what the domain solves, recommended learning/reading path, core patterns or decision tables, relationship to neighboring domains, and relevant card links.

**Enter Stage Two when any of these is true:** domain's cards take too much space in `02-Areas/index.md`; 2–3 nameable subtopics have formed; the domain needs an "entry path"; the domain intersects multiple others and needs a standalone page to explain boundaries.

**Do not create a subfolder just to host one `index.md`.** A subfolder implies continued growth or already needing a standalone landing page.

## Stage Three — Subdomain Aggregation (Mature)

When a domain keeps growing and its single landing page can no longer contain it, split into subtopic pages:

```
02-Areas/
└── Agent 与 Claude Code/
    ├── index.md          # Domain guide
    ├── 模式与架构.md      # Subtopic
    └── 工具与生态.md      # Subtopic
```

**Enter Stage Three when:** the landing page is too long (significant scrolling), or clear stable subtopics have formed and each merits its own page.

---

## Structures to Avoid

Over-engineering or premature classification. Recommend fixes during lint:

- Subfolders containing only one `index.md` that is just a link list.
- Standalone subfolders for domains explainable with a few cards + one intro.
- Empty folders "reserved for future use".

## Decision Self-Check

Before creating `02-Areas/<domain>/`, answer:

1. Does this domain already take too much space in `02-Areas/index.md`?
2. Does it need structure beyond "intro + link list" (learning paths, decision tables)?
3. After creating, does it have a clear next growth direction (subtopics)?

**Yes × 3** → create. Otherwise keep expressing it as a paragraph in `02-Areas/index.md`.

---

Applied content (projects, experiments, exam questions, case studies) is currently outside this skill's scope. Future versions will decide whether to introduce `03-Projects/`. Do not proactively create any application directories.